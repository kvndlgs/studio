
'use server';

import { ai } from '@/app/api/generate/genkit';
import { characters } from '@/data/characters';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import wav from 'wav';
import { judges } from '@/data/panel';

// Schemas
const GenerateRapLyricsInputSchema = z.object({
  character1: z.string().describe('The name of the first character.'),
  character2: z.string().describe('The name of the second character.'),
  topic: z.string().describe('The topic of the rap battle'),
  numVerses: z
    .number()
    .describe('The number of verses to generate for each character.'),
});
type GenerateRapLyricsInput = z.infer<typeof GenerateRapLyricsInputSchema>;

const GenerateRapLyricsOutputSchema = z.object({
  lyricsCharacter1: z
    .string()
    .describe('The rap lyrics for the first character.'),
  lyricsCharacter2: z
    .string()
    .describe('The rap lyrics for the second character.'),
});
type GenerateRapLyricsOutput = z.infer<typeof GenerateRapLyricsOutputSchema>;

const GenerateTtsAudioInputSchema = z.object({
  lyricsCharacter1: z.string().describe('The lyrics for the first character.'),
  character1Voice: z
    .string()
    .describe('The voice ID for the first character.'),
  lyricsCharacter2: z.string().describe('The lyrics for the second character.'),
  character2Voice: z
    .string()
    .describe('The voice ID for the second character.'),
});
type GenerateTtsAudioInput = z.infer<typeof GenerateTtsAudioInputSchema>;

const GenerateTtsAudioOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."
    ),
});
type GenerateTtsAudioOutput = z.infer<typeof GenerateTtsAudioOutputSchema>;

const DetermineWinnerInputSchema = z.object({
    character1Name: z.string(),
    character2Name: z.string(),
    lyricsCharacter1: z.string(),
    lyricsCharacter2: z.string(),
    topic: z.string(),
    judge1Name: z.string(),
    judge1Hint: z.string(),
    judge2Name: z.string(),
    judge2Hint: z.string(),
});
type DetermineWinnerInput = z.infer<typeof DetermineWinnerInputSchema>;


const DetermineWinnerOutputSchema = z.object({
    winnerName: z.string().describe("The name of the character who won the rap battle."),
    judge1Name: z.string().describe("The name of the first judge."),
    judge1Comment: z.string().describe("The first judge's commentary on the battle."),
    judge2Name: z.string().describe("The name of the second judge."),
    judge2Comment: z.string().describe("The second judge's commentary on the battle."),
});
type DetermineWinnerOutput = z.infer<typeof DetermineWinnerOutputSchema>;

// Helper function
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

// Genkit Flows
const generateRapLyricsFlow = ai.defineFlow(
  {
    name: 'generateRapLyricsFlow',
    inputSchema: GenerateRapLyricsInputSchema,
    outputSchema: GenerateRapLyricsOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
      name: 'generateRapLyricsPrompt',
      input: { schema: GenerateRapLyricsInputSchema },
      output: { schema: GenerateRapLyricsOutputSchema },
      prompt: `You are a rap lyric generator. You will generate rap lyrics for two characters based on a given topic, be mean and funny.
         Character 1: {{{character1}}}
         Character 2: {{{character2}}}
         Topic: {{{topic}}}
         Number of verses per character: {{{numVerses}}}
         Generate rap lyrics for each character, making sure the lyrics are relevant to the topic and appropriate for each character.
         Format the lyrics as follows but do not read anything that is between '[]'.
         mention funny and mean stuff about your opponents life and respond to previous vers when possible. :
         Character 1:
         [Verse 1]
         ...
         [Verse 2]
         ...
         Character 2:
         [Verse 1] ...
         [Verse 2] ...,
         `,
    });
    const { output } = await prompt(input);
    return output!;
  }
);

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
                  prebuiltVoiceConfig: {
                    voiceName: input.character1Voice,
                  },
                },
              },
              {
                speaker: 'Speaker2',
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: input.character2Voice,
                  },
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

const determineWinnerFlow = ai.defineFlow(
    {
        name: 'determineWinnerFlow',
        inputSchema: DetermineWinnerInputSchema,
        outputSchema: DetermineWinnerOutputSchema,
    },
    async (input) => {
        const prompt = ai.definePrompt({
            name: 'determineWinnerPrompt',
            input: { schema: DetermineWinnerInputSchema },
            output: { schema: DetermineWinnerOutputSchema },
            prompt: `You are a panel of two rap battle judges. Your task is to determine the winner of a rap battle based on the provided lyrics.
            Evaluate the lyrics based on:
            - Technique (rhyme scheme, rhythm)
            - Punchlines (clever and impactful lines)
            - Delivery (how well the character's personality is conveyed)
            - Wordplay (creative use of language)
            - Evilness (how mean and funny the disses are)

            Here is the battle information:
            - Topic: {{{topic}}}
            - Character 1 ({{{character1Name}}}):
            {{{lyricsCharacter1}}}
            - Character 2 ({{{character2Name}}}):
            {{{lyricsCharacter2}}}

            The judges are:
            - Judge 1: {{{judge1Name}}}. Personality hint: {{{judge1Hint}}}
            - Judge 2: {{{judge2Name}}}. Personality hint: {{{judge2Hint}}}

            Based on your evaluation, decide the winner and provide a brief, funny, and in-character comment from each judge explaining their decision.
            `,
        });

        const { output } = await prompt(input);
        return output!;
    }
);


// Main handler for the API route
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      character1Id,
      character2Id,
      topic,
      numVerses,
      character1Voice,
      character2Voice,
    } = body;

    if (
      !character1Id ||
      !character2Id ||
      !topic ||
      !numVerses ||
      !character1Voice ||
      !character2Voice
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const character1 = characters.find((c) => c.id === character1Id);
    const character2 = characters.find((c) => c.id === character2Id);

    if (!character1 || !character2) {
      return NextResponse.json(
        { error: 'One or both characters not found' },
        { status: 404 }
      );
    }

    // Generate Lyrics
    const lyricsInput: GenerateRapLyricsInput = {
      character1: character1.name,
      character2: character2.name,
      topic,
      numVerses,
    };
    const lyricsResult = await generateRapLyricsFlow(lyricsInput);

    // Generate Audio
    const audioInput: GenerateTtsAudioInput = {
      lyricsCharacter1: lyricsResult.lyricsCharacter1,
      character1Voice,
      lyricsCharacter2: lyricsResult.lyricsCharacter2,
      character2Voice,
    };
    const audioResult = await generateTtsAudioFlow(audioInput);

    // Determine Winner
    const winnerInput: DetermineWinnerInput = {
        character1Name: character1.name,
        character2Name: character2.name,
        lyricsCharacter1: lyricsResult.lyricsCharacter1,
        lyricsCharacter2: lyricsResult.lyricsCharacter2,
        topic,
        judge1Name: judges[0].name,
        judge1Hint: judges[0].hint,
        judge2Name: judges[1].name,
        judge2Hint: judges[1].hint,
    };
    const winnerResult = await determineWinnerFlow(winnerInput);

    return NextResponse.json({ lyrics: lyricsResult, audio: audioResult, winner: winnerResult });
  } catch (error: any) {
    console.error('API Route Error:', error);
    const errorMessage =
      error.message || 'An internal server error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
