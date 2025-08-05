import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
// Assuming you're using Firebase Admin SDK for Node.js
import { getStorage } from "firebase-admin/storage";
// Remove client-side imports:
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const execAsync = promisify(exec);

export interface AudioFile {
    url: string;
    path: string;
    cleanup: () => Promise<void>;
}

export class AudioProcessor {
    private static tempDir = path.join(process.cwd(), 'temp');

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

        const response = await fetch(url);
        if(!response.ok) {
            throw new Error(`Failed to download audio from ${url}`);
        }

        const buffer = await response.buffer();
        await fs.writeFile(filepath, buffer);

        return {
            url,
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
            vocalsDelay?: number; // im seconds
        } = {}
    ): Promise<AudioFile> {
        const { beatVolume = 0.7, vocalsVolume = 1.0, vocalsDelay = 0.5 } = options;
        const outputPath = path.join(this.tempDir, outputFilename);

        const command = `ffmpeg -i "${beatFile.path}" -i | "${vocalsFile.path}" \
         -filter_complex "[0:a]volume=${beatVolume}[beat]; \
                          [1:a]adelay=${vocalsDelay}s:all=1, volume=${vocalsVolume}[vocals]; \
                          [beat][vocals]amix=inputs=2:duration=longest:dropout_transition=2" \
        -codec:a libmp3lame -b:a 192k "${outputPath}"`;


        try {
            await execAsync(command);
        } catch (error) {
            throw new Error(`FFmpeg mixing failed: ${error}`);
        }

        return {
            url: outputPath,
            path: outputPath,
            cleanup: () => fs.unlink(outputPath).catch(() => {})
        };
    }

    // Make this method static as it doesn't depend on instance properties
    static async uploadAudioToFirebase(audioBuffer: Buffer, filename: string): Promise<string> {
        const storage = getStorage();
        const bucket = storage.bucket(); // Get the default bucket
        const file = bucket.file(filename); // Create a file reference using Admin SDK

        try {
            // Use the save method from the Admin SDK's File object to upload the buffer
            await file.save(audioBuffer, {
                metadata: { contentType: 'audio/mpeg' } // Set the content type
            });

            // Get the download URL for the uploaded file using getSignedUrl
            const [downloadURL] = (await file.getSignedUrl({
                action: 'read',
                expires: '03-09-2491' // Or set an appropriate expiration date
            })) as string[];


            return downloadURL;
        } catch (error) {
            console.error("Error uploading audio to firebase storage", error);
            throw error;
        }
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
                this.downloadAudio(vocalsUrl, `vocals-${battleId}.mp3`)
            ]);

            mixedFile = await this.mixAudio(
                beatFile,
                vocalsFile,
                `mixed-${battleId}.mp3`,
                {
                    beatVolume: 0.7,
                    vocalsVolume: 1.0,
                    vocalsDelay: 0.5
                }
            );

            const publicUrl = await this.uploadAudioToFirebase( // Corrected method name
                await fs.readFile(mixedFile.path),
                `battles/${battleId}/mixed.mp3`
            );

            return publicUrl;
        } finally {
            await Promise.all([
                beatFile?.cleanup(),
                vocalsFile?.cleanup(),
                mixedFile?.cleanup()
            ].filter(Boolean));
        }
    }
}
