'use server';

import { ai } from '@/app/api/generate/genkit';
import { characters } from '@/data/characters';
import { judges } from '@/data/panel';
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

const JudgeCommentarySchema = z.object({
    judgeName: z.string().describe("The name of the judge."),
    commentary: z.string().describe("The judge's commentary on the rap battle.")
});

const DetermineWinnerInputSchema = z.object({
    character1: z.string().describe("The name of the first character."),
    character2: z.string().describe("The name of the second character."),
    lyricsCharacter1: z.string().describe("The lyrics of the first character."),
    lyricsCharacter2: z.string().describe("The lyrics of the second character."),
});
type DetermineWinnerInput = z.infer<typeof DetermineWinnerInputSchema>;


const DetermineWinnerOutputSchema = z.object({
    winner: z.string().describe("The name of the character who won the rap battle."),
    judges: z.array(JudgeCommentarySchema).describe("An array of commentaries from the judges.")
});


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
         each characters personalities are as follow, added to their original character: {{{character1.personality}}}
         each characters catch phrases are as follow, added to their original character: {{{character1.catchPhrases}}}
         each characters personalities are as follow, added to their original character: {{{character2.personality}}}
         each characters catch phrases are as follow, added to their original character: {{{character2.catchPhrases}}}
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
              }
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
        name: "determineWinnerFlow",
        inputSchema: DetermineWinnerInputSchema,
        outputSchema: DetermineWinnerOutputSchema,
    },
    async (input) => {
        const judge1 = judges[0];
        const judge2 = judges[1];

        const prompt = ai.definePrompt({
            name: "determineWinnerPrompt",
            input: { schema: DetermineWinnerInputSchema },
            output: { schema: DetermineWinnerOutputSchema },
            prompt: `You are a panel of two judges at a rap battle.
Your names are ${judge1.name} and ${judge2.name}.
Your personalities are as follows:
- ${judge1.name}: ${judge1.personality.join(', ')}. Favorite phrases: ${judge1.catchPhrases.join(', ')}.
- ${judge2.name}: ${judge2.personality.join(', ')}. Favorite phrases: ${judge2.catchPhrases.join(', ')}.

Two characters, ${input.character1} and ${input.character2}, have just had a rap battle.
Here are their lyrics:

Lyrics for ${input.character1}:
---
${input.lyricsCharacter1}
---

Lyrics for ${input.character2}:
---
${input.lyricsCharacter2}
---

As the judges, you must now determine a winner based on punchlines, techniques, rhyme scheme, and overall madness.
Analyze the battle based on punchlines, clever techniques, rhyme scheme, and overall madness.
Your commentary should reflect your defined personalities. Be critical, funny, and opinionated.

Provide your verdict in the requested JSON format, with a commentary from each judge and the name of the winner.`
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
    
    // Concurrently generate audio and determine winner
    const [audioResult, winnerResult] = await Promise.all([
        generateTtsAudioFlow({
            lyricsCharacter1: lyricsResult.lyricsCharacter1,
            character1Voice,
            lyricsCharacter2: lyricsResult.lyricsCharacter2,
            character2Voice,
        }),
        determineWinnerFlow({
            character1: character1.name,
            character2: character2.name,
            lyricsCharacter1: lyricsResult.lyricsCharacter1,
            lyricsCharacter2: lyricsResult.lyricsCharacter2,
        }),
    ]);


    return NextResponse.json({ 
        lyrics: lyricsResult, 
        audio: audioResult,
        winner: winnerResult.winner,
        judges: winnerResult.judges
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    const errorMessage =
      error.message || 'An internal server error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
