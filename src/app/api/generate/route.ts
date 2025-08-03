
'use server';

import { ai } from '@/app/api/generate/genkit';
import { characters } from '@/data/characters';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import wav from 'wav';

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
    character1Name: z.string().describe("The name of the first character."),
    character2Name: z.string().describe("The name of the second character."),
    lyricsCharacter1: z.string().describe("The lyrics for the first character."),
    lyricsCharacter2: z.string().describe("The lyrics for the second character."),
    topic: z.string().describe("The topic of the rap battle."),
});
type DetermineWinnerInput = z.infer<typeof DetermineWinnerInputSchema>;

const DetermineWinnerOutputSchema = z.object({
    winnerName: z.string().describe("The name of the character who won the rap battle."),
    judge1Name: z.string().describe("The name of the first judge."),
    judge1Comment: z.string().describe("The first judge's commentary on the battle and why they chose the winner."),
    judge2Name: z.string().describe("The name of the second judge."),
    judge2Comment: z.string().describe("The second judge's commentary on the battle and why they chose the winner."),
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
      prompt: `You are a rap lyric generator. 
      You will generate rap lyrics for two characters based on a given topic, 
      be mean and hilarious.
      uses punchline, wordplays and metaphors.
      try to fit in multi-syllabic rhymes scheme, but not too much.

         Character 1: {{{character1}}}
         Character 2: {{{character2}}}
         Topic: {{{topic}}}
         Number of verses per character: {{{numVerses}}}
         hint1: {{{character1.hint}}}
         hint2: {{{character2.hint}}}
         personality1: {{{character1.personality}}}
         personality2: {{{character2.personality}}}
         catchPhrases1: {{{character1.catchPhrases}}}
         chatchPhrases2: {{{character2.catchPhrases}}}
         Generate rap lyrics for each character, making sure the lyrics are relevant to the topic and appropriate for each character.
         mention funny and mean stuff about your opponents life and respond to previous vers when possible.
         Format the lyrics as follows:

         Character 1:

         [Verse 1]
         ...
         [Verse 2]
         ...

         Character 2:
         [Verse 1] 
         ...
         [Verse 2] 
         ...,
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
            prompt: `You are a panel of two rap battle judges: DJ Roast and MC Flow.
            Your task is to analyze the following rap battle and declare a winner.

            Battle Topic: {{{topic}}}

            Contestant 1: {{{character1Name}}}
            Lyrics:
            {{{lyricsCharacter1}}}

            Contestant 2: {{{character2Name}}}
            Lyrics:
            {{{lyricsCharacter2}}}

            Judging Criteria:
            - Techniques: How well did they use different rhyme schemes, cadences, and flows?
            - Punchlines: How impactful and clever were their punchlines?
            - Delivery: (Imagine their delivery) How well did they convey emotion and confidence?
            - Wordplay: How creative and witty was their use of language?
            - Evilness: How hilariously and effectively did they roast their opponent?

            Instructions:
            1.  **Assign Judge Names**: Set judge1Name to "DJ Roast" and judge2Name to "MC Flow".
            2.  **Judge 1 (DJ Roast) Commentary**: As DJ Roast, provide a short, funny, and slightly mean analysis. Focus on the punchlines and evilness.
            3.  **Judge 2 (MC Flow) Commentary**: As MC Flow, provide a short, insightful analysis. Focus on technical skill, wordplay, and delivery.
            4.  **Declare a Winner**: Based on the criteria, decide which character won the battle. Set the winnerName field to the name of the winning character. Both judges must agree on the winner.
            5.  Ensure your commentary for both judges clearly states who you think won and why, leading to the final decision.
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
    
    // Determine Winner
    const winnerInput: DetermineWinnerInput = {
        character1Name: character1.name,
        character2Name: character2.name,
        lyricsCharacter1: lyricsResult.lyricsCharacter1,
        lyricsCharacter2: lyricsResult.lyricsCharacter2,
        topic: topic,
    };
    const winnerResult = await determineWinnerFlow(winnerInput);

    // Generate Audio
    const audioInput: GenerateTtsAudioInput = {
      lyricsCharacter1: lyricsResult.lyricsCharacter1,
      character1Voice,
      lyricsCharacter2: lyricsResult.lyricsCharacter2,
      character2Voice,
    };
    const audioResult = await generateTtsAudioFlow(audioInput);

    return NextResponse.json({ 
        lyrics: lyricsResult, 
        audio: audioResult,
        winner: winnerResult
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    const errorMessage =
      error.message || 'An internal server error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
