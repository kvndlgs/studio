import { onCallGenkit } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as v2 from 'firebase-functions/v2';
import { Character } from './types/index';
import { generateRapLyricsFlow } from './ai/flows/generate-rap-lyrics';
import { generateTtsAudioFlow } from './ai/flows/generate-tts-audio';

const apiKey = defineSecret('GEMINI_API_KEY');



initializeApp();
const db = getFirestore();


export const generateRapLyrics = onCallGenkit({
    secrets: [apiKey],
    }, generateRapLyricsFlow );

export const generateTtsAudio = onCallGenkit({
    secrets: [apiKey],
}, generateTtsAudioFlow );



export const createCharacter = v2.https.onCall(async(request) => {
    const characterData: Omit<Character, 'id' | 'createdAt'> = request.data;

    const docRef = await db.collection('characters').add({
        ...characterData,
        createdAt: new Date()
    });
    
    return { id: docRef.id, ...characterData };
});

export const getCharacters = v2.https.onCall(async(request) => {
    const snapshot = await db.collection('characters').get();

    const characters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return characters;
});

export const getCharacter = v2.https.onCall(async(request) => {
    const { characterId } = request.data;

    const doc = await db.collection('characters').doc(characterId).get();

    if (!doc.exists) {
        throw new Error('Character not found');
    }

    return {
        id: doc.id,
        ...doc.data()
    };  
});


export const seedCharacters = v2.https.onCall(async(request) => {
    const charactersData = [
        {
            name: "Peter Griffin",
            voiceId: "fenrir",
            image: "gs://suckerpunch.firebasestorage.app/img/peter_avatar.png",
            faceoff: "gs://suckerpunch.firebasestorage.app/img/peter_faceoff.png",
            hint: "You are Peter Griffin from Family Guy",
            personality: ["Dummy", "Thick boston accent"],
            catchPhrases: ['EhHEhEHhe']
        },
        {
            name: "Shrek",
            voiceId: "puck",
            image: "gs://suckerpunch.firebasestorage.app/img/shrek_avatar.png",
            faceoff: "gs://suckerpunch.firebasestorage.app/img/shrek_faceoff.png",
            hint: "You are Shrek",
            personality: ["Mean", "Unfriendly"],
            catchPhrases: ['What are you doing in my swamp?']
        },
        {
            name: "Batman 66'",
            voiceId: "charon",
            image: "gs://suckerpunch.firebasestorage.app/img/batman_avatar.png",
            faceoff: "gs://suckerpunch.firebasestorage.app/img/batman_faceoff.png",
            hint: "You are batman from 1966",
            personality: ["Fair", "Heroic"],
            catchPhrases: ['I am Batman']
        },
        {
            name: "Bender",
            voiceId: "zephyr",
            image: "gs://suckerpunch.firebasestorage.app/img/bender_avatar.png",
            faceoff: "gs://suckerpunch.firebasestorage.app/img/bender_faceoff.png",
            hint: "You are bender from Futurama",
            personality: ["Alcoolic", "Narcissistic", "Ironic"],
            catchPhrases: ['I am Bender']
        },
        {
            name: "Realistic Fish Head",
            voiceId: "vindemiatrix",
            image: "gs://suckerpunch.firebasestorage.app/img/realisticfishhead_avatar.png",
            faceoff: "gs://suckerpunch.firebasestorage.app/img/realisticfishhead_faceoff.png",
            hint: "You are Realistic Fish Head, news anchor from Bikini Bottom.",
            personality: ['Calm', 'Random', 'Volatile'],
            catchPhrases: ['BREAKING NEWS', 'LIVE FROM BIKINI BOTTOM']
        },
        {
           name: "Shaggy",
           voiceId: "umbriel",
           image: "gs://suckerpunch.firebasestorage.app/img/shaggy_avatar.png",
           faceoff: "gs://suckerpunch.firebasestorage.app/img/shaggy_faceoff.png",
           hint: "You are Shaggy from Scooby Doo.",
           personality: ['Mean', 'Random', 'Volatile'],
           catchPhrases: ['I am Shaggy']
        },
        {
            name: "Hagrid PS2",
            voiceId: "luna",
            image: "gs://suckerpunch.firebasestorage.app/img/hagrid_avatar.png",
            faceoff: "gs://suckerpunch.firebasestorage.app/img/hagrid_faceoff.png",
            hint: "You are Hagrid from Harry Potter but the PS2 Game version",
            personality: ['Grumpy'],
            catchPhrases: ['Hey harry']
        },
        {
            name: "Parappa The Rapper",
            voiceId: "umbriel",
            image: "gs://suckerpunch.firebasestorage.app/img/parapa_avatar.png",
            faceoff: "gs://suckerpunch.firebasestorage.app/img/parapa_faceoff.png",
            hint: "You are Parappa The Rapper",
            personality: ['Stupid'],
            catchPhrases: ['I am Parappa'],
        }
    ];

    const batch = db.batch();
    for (const characterData of charactersData) {
        const docRef = db.collection('characters').doc();
        batch.set(docRef, {
            ...characterData,
            createdAt: new Date()
        });
    }

    await batch.commit();

    return { message: `Successfully seeded ${charactersData.length} characters.`}

});

export const generateRapBattle = v2.https.onCall(async (request)  => {
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