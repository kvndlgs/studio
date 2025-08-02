
'use server';

import {defineFlow, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {z} from 'zod';
import {NextResponse} from 'next/server';
import wav from 'wav';
import { characters } from '@/data/characters';

configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logSinks: [],
  enableTracing: false,
});

// Schemas
const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  voiceId: z.string(),
  image: z.string(),
  faceoff: z.string().optional(),
  hint: z.string(),
  personality: z.array(z.string()),
  catchPharases: z.array(z.string()),
});

const GenerateRapLyricsInputSchema = z.object({
  character1: CharacterSchema,
  character2: CharacterSchema,
  topic: z.string(),
});

const GenerateRapLyricsOutputSchema = z.object({
  lyricsCharacter1: z.string().describe('The rap lyrics for character 1'),
  lyricsCharacter2: z.string().describe('The rap lyrics for character 2'),
});

const GenerateTtsAudioInputSchema = z.object({
  lyrics: z.string(),
  voiceId: z.string(),
});

// Text-to-WAV conversion
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
    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () =>
      resolve(Buffer.concat(bufs).toString('base64'))
    );
    writer.write(pcmData);
    writer.end();
  });
}

// Genkit Flows
const generateRapLyricsFlow = defineFlow(
  {
    name: 'generateRapLyrics',
    inputSchema: GenerateRapLyricsInputSchema,
    outputSchema: GenerateRapLyricsOutputSchema,
  },
  async (input) => {
    const prompt = `You are a rap battle lyricist. Generate a rap battle between two characters.
      Character 1: ${input.character1.name}
      - Personality: ${input.character1.personality.join(', ')}
      - Hint: ${input.character1.hint}
      - Catchphrases: ${input.character1.catchPharases.join(', ')}

      Character 2: ${input.character2.name}
      - Personality: ${input.character2.personality.join(', ')}
      - Hint: ${input.character2.hint}
      - Catchphrases: ${input.character2.catchPharases.join(', ')}

      The topic of the rap battle is: "${input.topic}".

      Each character should have one verse. The lyrics should be creative, funny, and in character.
      Return ONLY the JSON object with the lyrics.
    `;

    const llmResponse = await googleAI.generateText({
      model: 'gemini-pro',
      prompt: prompt,
      output: {
        format: 'json',
        schema: GenerateRapLyricsOutputSchema,
      },
    });

    return llmResponse.output()!;
  }
);

const generateTtsAudioFlow = defineFlow(
  {
    name: 'generateTtsAudio',
    inputSchema: GenerateTtsAudioInputSchema,
    outputSchema: z.string(),
  },
  async ({lyrics, voiceId}) => {
    const {media} = await googleAI.generateTextToSpeech({
      model: 'gemini-2.5-flash-preview-tts',
      text: lyrics,
      voice: voiceId as any,
      encoding: 'PCM',
    });

    if (!media) {
      throw new Error('No audio data returned from TTS service.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return `data:audio/wav;base64,${wavBase64}`;
  }
);

// Main handler for the API route
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {character1Id, character2Id, topic} = body;

    if (!character1Id || !character2Id || !topic) {
      return NextResponse.json(
        {error: 'Missing required fields'},
        {status: 400}
      );
    }

    const character1 = characters.find(c => c.id === character1Id);
    const character2 = characters.find(c => c.id === character2Id);

    if (!character1 || !character2) {
      return NextResponse.json(
        {error: 'One or both characters not found'},
        {status: 404}
      );
    }

    // Generate Lyrics
    const lyrics = await generateRapLyricsFlow({
      character1,
      character2,
      topic,
    });

    // Generate TTS for both characters in parallel
    const [audio1, audio2] = await Promise.all([
        generateTtsAudioFlow({ lyrics: lyrics.lyricsCharacter1, voiceId: character1.voiceId }),
        generateTtsAudioFlow({ lyrics: lyrics.lyricsCharacter2, voiceId: character2.voiceId })
    ]);
    
    // This is a simplified combination. A real app might do more sophisticated audio mixing.
    // For now, we'll just send back one of the audio files, but in a real scenario, you'd combine them.
    // A more advanced implementation would use a multi-speaker TTS flow if available or mix audio server-side.
    
    const combinedLyrics = `
            Speaker 1: ${lyrics.lyricsCharacter1}
            Speaker 2: ${lyrics.lyricsCharacter2}
        `;

    const audioDataUri = await generateTtsAudioFlow({
        lyrics: combinedLyrics,
        voiceId: 'onyx', // A default voice for the combined track
    });


    return NextResponse.json({lyrics, audio: audioDataUri});
  } catch (error: any) {
    console.error('API Route Error:', error);
    const errorMessage =
      error.details?.message || 'An internal server error occurred.';
    return NextResponse.json({error: errorMessage}, {status: 500});
  }
}

    