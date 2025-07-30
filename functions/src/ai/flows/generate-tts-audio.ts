'use server';

/**
 * @fileOverview A Text-to-Speech (TTS) generation flow for two speakers.
 *
 * - generateTtsAudio - A function that handles the TTS generation process.
 * - GenerateTtsAudioInput - The input type for the generateTtsAudio function.
 * - GenerateTtsAudioOutput - The return type for the generateTtsAudio function.
 */

import {ai} from '../../ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateTtsAudioInputSchema = z.object({
  lyricsCharacter1: z.string().describe('The lyrics for the first character.'),
  character1Voice: z.string().describe('The voice ID for the first character.'),
  lyricsCharacter2: z.string().describe('The lyrics for the second character.'),
  character2Voice: z.string().describe('The voice ID for the second character.'),
});
export type GenerateTtsAudioInput = z.infer<typeof GenerateTtsAudioInputSchema>;

const GenerateTtsAudioOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type GenerateTtsAudioOutput = z.infer<typeof GenerateTtsAudioOutputSchema>;

export async function generateTtsAudio(input: GenerateTtsAudioInput): Promise<GenerateTtsAudioOutput> {
    return generateTtsAudioFlow(input);
}

async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });
  
      let bufs = [] as any[];
      writer.on('error', reject);
      writer.on('data', function (d) {
        bufs.push(d);
      });
      writer.on('end', function () {
        resolve(Buffer.concat(bufs).toString('base64'));
      });
  
      writer.write(pcmData);
      writer.end();
    });
}

const generateTtsAudioFlow = ai.defineFlow(
    {
        name: 'generateTtsAudioFlow',
        inputSchema: GenerateTtsAudioInputSchema,
        outputSchema: GenerateTtsAudioOutputSchema,
    },
    async (input) => {
        const prompt = `Speaker1: ${input.lyricsCharacter1}\n\nSpeaker2: ${input.lyricsCharacter2}`;
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Speaker1',
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: input.character1Voice }, 
                                },
                            },
                            {
                                speaker: 'Speaker2',
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: input.character2Voice },
                                },
                            },
                        ],
                    },
                },
            },
            prompt,
        });

        if (!media) {
            throw new Error('TTS generation failed: no media returned.');
        }

        const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
        );

        const wavBase64 = await toWav(audioBuffer);
        
        return {
            audioDataUri: `data:audio/wav;base64,${wavBase64}`,
        };
    }
);
