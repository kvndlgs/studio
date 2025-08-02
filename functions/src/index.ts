'use server';
// index.ts - Fixed Firebase Functions Configuration
import {https, setGlobalOptions} from 'firebase-functions/v2';
import {defineSecret} from 'firebase-functions/params';
import {getFirestore} from 'firebase-admin/firestore';
import {Character} from './types';
import * as admin from 'firebase-admin';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {enableFirebaseTelemetry} from '@genkit-ai/firebase';
import * as z from 'zod';
import * as wav from 'wav';

enableFirebaseTelemetry();

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

const apiKey = defineSecret('GEMINI_API_KEY');

admin.initializeApp();
setGlobalOptions({
  secrets: [apiKey],
  region: 'us-central1',
});

const db = getFirestore();

const GenerateRapLyricsInputSchema = z.object({
  character1: z.string().describe('The name of the first character.'),
  character2: z.string().describe('The name of the second character.'),
  topic: z.string().describe(`The topic of the rap battle.`),
  numVerses: z
    .number()
    .describe('The number of verses to generate for each character.'),
});
export type GenerateRapLyricsInput = z.infer<
  typeof GenerateRapLyricsInputSchema
>;

const GenerateRapLyricsOutputSchema = z.object({
  lyricsCharacter1: z
    .string()
    .describe('The rap lyrics for the first character.'),
  lyricsCharacter2: z
    .string()
    .describe('The rap lyrics for the second character.'),
});
export type GenerateRapLyricsOutput = z.infer<
  typeof GenerateRapLyricsOutputSchema
>;

export async function generateRapLyrics(
  input: GenerateRapLyricsInput
): Promise<GenerateRapLyricsOutput> {
  return generateRapLyricsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRapLyricsPrompt',
  input: {schema: GenerateRapLyricsInputSchema},
  output: {schema: GenerateRapLyricsOutputSchema},
  prompt: `You are a rap lyric generator. You will generate rap lyrics for two characters based on a given topic, be mean and funny.

Character 1: {{{character1}}}
Character 2: {{{character2}}}
Topic: {{{topic}}}
Number of verses per character: {{{numVerses}}}

Generate rap lyrics for each character, making sure the lyrics are relevant to the topic and appropriate for each character.
Format the lyrics as follows but do not read anything that is between '[]'. mention funny and mean stuff about your opponents life and respond to previous vers when possible. :

Character 1:
[Verse 1]
...
[Verse 2]
...

Character 2:
[Verse 1]
...
[Verse 2]
...`,
});

export const generateRapLyricsFlow = ai.defineFlow(
  {
    name: 'generateRapLyricsFlow',
    inputSchema: GenerateRapLyricsInputSchema,
    outputSchema: GenerateRapLyricsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

const GenerateTtsAudioInputSchema = z.object({
  lyricsCharacter1: z.string().describe('The lyrics for the first character.'),
  character1Voice: z.string().describe('The voice ID for the first character.'),
  lyricsCharacter2: z.string().describe('The lyrics for the second character.'),
  character2Voice: z.string().describe('The voice ID for the second character.'),
});
export type GenerateTtsAudioInput = z.infer<typeof GenerateTtsAudioInputSchema>;

const GenerateTtsAudioOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."
    ),
});
export type GenerateTtsAudioOutput = z.infer<
  typeof GenerateTtsAudioOutputSchema
>;

export async function generateTtsAudio(
  input: GenerateTtsAudioInput
): Promise<GenerateTtsAudioOutput> {
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

export const generateTtsAudioFlow = ai.defineFlow(
  {
    name: 'generateTtsAudioFlow',
    inputSchema: GenerateTtsAudioInputSchema,
    outputSchema: GenerateTtsAudioOutputSchema,
  },
  async input => {
    const prompt = `Speaker1: ${input.lyricsCharacter1}\n\nSpeaker2: ${input.lyricsCharacter2}`;
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Speaker1',
                voiceConfig: {
                  prebuiltVoiceConfig: {voiceName: input.character1Voice},
                },
              },
              {
                speaker: 'Speaker2',
                voiceConfig: {
                  prebuiltVoiceConfig: {voiceName: input.character2Voice},
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

export const generateRapBattle = https.onCall(
  {
    secrets: [apiKey],
    region: 'us-central1',
  },
  async request => {
    const {character1Id, character2Id, topic, numVerses} = request.data;

    // Fetch characters from Firestore
    const [char1Doc, char2Doc] = await Promise.all([
      db.collection('characters').doc(character1Id).get(),
      db.collection('characters').doc(character2Id).get(),
    ]);

    const character1 = {id: char1Doc.id, ...char1Doc.data()} as Character;
    const character2 = {id: char2Doc.id, ...char2Doc.data()} as Character;

    // Note: Calling Genkit flows directly within an onCall function might lead to
    // timeouts if the flows are long-running. For production, consider triggering
    // these flows via a task queue (e.g., Cloud Tasks) or implementing a
    // polling mechanism on the client-side.
    // Generate lyrics using your existing flow
    const lyricsResult = await generateRapLyricsFlow({
      character1: character1.name,
      character2: character2.name,
      topic,
      numVerses,
    });

    // Generate audio using your existing flow
    const audioResult = await generateTtsAudioFlow({
      lyricsCharacter1: lyricsResult.lyricsCharacter1,
      character1Voice: character1.voiceId,
      lyricsCharacter2: lyricsResult.lyricsCharacter2,
      character2Voice: character2.voiceId,
    });

    // Save battle to Firestore
    const battleRef = await db.collection('battles').add({
      participants: [character1Id, character2Id],
      topic,
      lyrics: lyricsResult,
      audioDataUri: audioResult.audioDataUri,
      createdAt: new Date(),
    });

    return {
      battleId: battleRef.id,
      lyrics: lyricsResult,
      audio: audioResult.audioDataUri,
    };
  }
);
