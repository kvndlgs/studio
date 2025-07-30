/**
 * @fileOverview A rap lyrics generation AI agent for two characters.
 *
 * - generateRapLyrics - A function that handles the rap lyrics generation process.
 * - GenerateRapLyricsInput - The input type for the generateRapLyrics function.
 * - GenerateRapLyricsOutput - The return type for the generateRapLyrics function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const GenerateRapLyricsInputSchema = z.object({
  character1: z.string().describe('The name of the first character.'),
  character2: z.string().describe('The name of the second character.'),
  topic: z.string().describe(`The topic of the rap battle.`),
  numVerses: z.number().describe('The number of verses to generate for each character.'),
});
export type GenerateRapLyricsInput = z.infer<typeof GenerateRapLyricsInputSchema>;

const GenerateRapLyricsOutputSchema = z.object({
  lyricsCharacter1: z.string().describe('The rap lyrics for the first character.'),
  lyricsCharacter2: z.string().describe('The rap lyrics for the second character.'),
});
export type GenerateRapLyricsOutput = z.infer<typeof GenerateRapLyricsOutputSchema>;

export async function generateRapLyrics(input: GenerateRapLyricsInput): Promise<GenerateRapLyricsOutput> {
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
