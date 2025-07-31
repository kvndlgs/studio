// index.ts - Fixed Firebase Functions Configuration
import { onCallGenkit } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as v2 from 'firebase-functions/v2';
import { Character } from './types/index';
import { generateRapLyricsFlow } from './ai/flows/generate-rap-lyrics';
import { generateTtsAudioFlow } from './ai/flows/generate-tts-audio';
import './ai/genkit';

const apiKey = defineSecret('GEMINI_API_KEY');

initializeApp();
const db = getFirestore();

// Fixed: Properly configure onCallGenkit functions
export const generateRapLyrics = onCallGenkit({
    secrets: [apiKey],
    region: 'us-central1', // Add explicit region
}, generateRapLyricsFlow);

export const generateTtsAudio = onCallGenkit({
    secrets: [apiKey],
    region: 'us-central1', // Add explicit region
}, generateTtsAudioFlow);

/** 
export const createCharacter = v2.https.onCall({
    region: 'us-central1', // Add explicit region
}, async (request) => {
    const characterData: Omit<Character, 'id' | 'createdAt'> = request.data;

    const docRef = await db.collection('characters').add({
        ...characterData,
        createdAt: new Date()
    });
    
    return { id: docRef.id, ...characterData };
});
*/

export const getCharacters = v2.https.onCall({
    region: 'us-central1',
}, async (request) => {
    const snapshot = await db.collection('characters').get();

    const characters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return characters;
    console.log(characters.length + ' fetched characters sucessfully');
});

export const getCharacter = v2.https.onCall({
    region: 'us-central1',
}, async (request) => {
    const { characterId } = request.data;

    const doc = await db.collection('characters').doc(characterId).get();

    if (!doc.exists) {
        throw new Error('Character not found');
    }

    return {
        id: doc.id,
        ...doc.data()
    };  

    console.log('Fetched characters sucessfully');
});


export const generateRapBattle = v2.https.onCall({
    region: 'us-central1',
    secrets: [apiKey], // Add secrets here too
}, async (request) => {
    const { character1Id, character2Id, topic, numVerses } = request.data;
    
    // Fetch characters from Firestore
    const [char1Doc, char2Doc] = await Promise.all([
      db.collection('characters').doc(character1Id).get(),
      db.collection('characters').doc(character2Id).get()
    ]);
    
    const character1 = { id: char1Doc.id, ...char1Doc.data() } as Character;
    const character2 = { id: char2Doc.id, ...char2Doc.data() } as Character;
    
    // Generate lyrics using your existing flow
    const lyricsResult = await generateRapLyricsFlow({
      character1: character1.name,
      character2: character2.name,
      topic,
      numVerses
    });
    
    // Generate audio using your existing flow
    const audioResult = await generateTtsAudioFlow({
      lyricsCharacter1: lyricsResult.lyricsCharacter1,
      character1Voice: character1.voiceId,
      lyricsCharacter2: lyricsResult.lyricsCharacter2,
      character2Voice: character2.voiceId
    });
    
    // Save battle to Firestore
    const battleRef = await db.collection('battles').add({
      participants: [character1Id, character2Id],
      topic,
      lyrics: lyricsResult,
      audioDataUri: audioResult.audioDataUri,
      createdAt: new Date()
    });
    
    return {
      battleId: battleRef.id,
      lyrics: lyricsResult,
      audio: audioResult.audioDataUri
    };
});

export const testLyrics = v2.https.onRequest({
    region: 'us-central1',
    secrets: [apiKey],
}, async (req, res) => {
    try {
      const result = await generateRapLyricsFlow({
        character1: 'Shrek',
        character2: 'Peter Griffin',
        topic: 'Toilet Paper',
        numVerses: 2,
      });
  
      res.json(result);
    } catch (err) {
      console.error('Error in testLyrics:', err);
      res.status(500).send('Something went wrong.');
    }
});
  
export const testAudio = v2.https.onRequest({
    region: 'us-central1',
    secrets: [apiKey],
}, async (req, res) => {
    try {
      const result = await generateTtsAudioFlow({
        character1Voice: 'umbriel',
        character2Voice: 'umbriel',
        lyricsCharacter1: 'I am Shaggy',
        lyricsCharacter2: 'I am Realistic Fish Head',
      });
  
      res.json(result);
    } catch (err) {
      console.error('Error in testAudio:', err);
      res.status(500).send('Something went wrong.');
    }
});