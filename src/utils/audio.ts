import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from 'uuid';


const execAsync = promisify(exec);

export interface AudioFile {
    url: string;
    path: string;
    cleanup: () => Promise<void>;
}

export class AudioProcessor {
    private static tempDir = path.join('/tmp', 'audio-processing');

    static async ensureTempDir(): Promise<void> {
        try {
            await fs.access(this.tempDir);
        } catch {
            await fs.mkdir(this.tempDir, { recursive: true});
        }
    }

    static async downloadAudio(url: string, filename: string): Promise<AudioFile> {
        await this.ensureTempDir();
        const filepath = path.join(this.tempDir, filename);
        
        const fetchUrl = url.startsWith('http') ? url : `http://localhost:9002${url}`;

        const response = await fetch(fetchUrl);
        if(!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to download audio from ${fetchUrl}. Status: ${response.status}. Body: ${errorBody}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(filepath, buffer);

        return {
            url,
            path: filepath,
            cleanup: () => fs.unlink(filepath).catch(() => {})
        };
    }
    
    static async downloadDataUri(dataUri: string, filename: string): Promise<AudioFile> {
        await this.ensureTempDir();
        const filepath = path.join(this.tempDir, filename);
        
        const base64Data = dataUri.split(';base64,').pop();
        if (!base64Data) {
            throw new Error('Invalid data URI for vocals');
        }

        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(filepath, buffer);

        return {
            url: dataUri,
            path: filepath,
            cleanup: () => fs.unlink(filepath).catch(() => {})
        };
    }

    static async mixAudio(
        beatFile: AudioFile,
        vocalsFile: AudioFile,
        outputFilename: string,
        options: {
            beatVolume?: number;
            vocalsVolume?: number;
            vocalsDelay?: number; // in seconds
        } = {}
    ): Promise<AudioFile> {
        const { beatVolume = 0.7, vocalsVolume = 1.0, vocalsDelay = 0.5 } = options;
        const outputPath = path.join(this.tempDir, outputFilename);
        const delayInMs = vocalsDelay * 1000;

        const command = `ffmpeg -y -i "${beatFile.path}" -i "${vocalsFile.path}" -filter_complex "[0:a]volume=${beatVolume}[beat];[1:a]adelay=${delayInMs}|${delayInMs},volume=${vocalsVolume}[vocals];[beat][vocals]amix=inputs=2:duration=longest:dropout_transition=2" -c:a libmp3lame -b:a 192k "${outputPath}"`;

        try {
            await execAsync(command);
        } catch (error) {
            console.error(`FFmpeg command failed: ${command}`);
            throw new Error(`FFmpeg mixing failed: ${error}`);
        }

        return {
            url: outputPath,
            path: outputPath,
            cleanup: () => fs.unlink(outputPath).catch(() => {})
        };
    }

    static async uploadAudioToFirebase(filePath: string, destination: string): Promise<string> {
        const storage = getStorage();
        const bucket = storage.bucket();
        const token = uuidv4();
        
        const [file] = await bucket.upload(filePath, {
            destination: destination,
            metadata: {
                contentType: 'audio/mpeg',
                metadata: {
                  firebaseStorageDownloadTokens: token
                }
            }
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${token}`;
        
        return publicUrl;
    }


    static async processFullBattle(
        battleId: string,
        beatUrl: string,
        vocalsUrl: string
    ): Promise<string> {
        let beatFile: AudioFile | null = null;
        let vocalsFile: AudioFile | null = null;
        let mixedFile: AudioFile | null = null;

        try {
            [beatFile, vocalsFile] = await Promise.all([
                this.downloadAudio(beatUrl, `beat-${battleId}.mp3`),
                this.downloadDataUri(vocalsUrl, `vocals-${battleId}.wav`)
            ]);

            mixedFile = await this.mixAudio(
                beatFile,
                vocalsFile,
                `mixed-${battleId}.mp3`
            );

            const publicUrl = await this.uploadAudioToFirebase(
                mixedFile.path,
                `battles/${battleId}/mixed.mp3`
            );

            return publicUrl;
        } finally {
            await Promise.all([
                beatFile?.cleanup(),
                vocalsFile?.cleanup(),
                mixedFile?.cleanup()
            ].filter(p => p));
        }
    }
}
