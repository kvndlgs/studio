/* eslint-disable @typescript-eslint/no-var-requires */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Path to your service account key file
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const characters = [
  {
      "name": "SpongeBob",
      "image": "/img/spongebob.png",
      "faceoff": "/img/spongebob-faceoff.png",
      "hint": "yellow sea creature",
      "voiceId": "umbriel",
      "personality": ["optimistic", "naive", "energetic"],
      "catchPhrases": ["I'm ready!", "Order up!", "Krusty Krab Pizza is the pizza for you and me!"]
  },
  {
      "name": "Shrek",
      "image": "/img/shrek.png",
      "faceoff": "/img/shrek-faceoff.png",
      "hint": "green ogre",
      "voiceId": "titan",
      "personality": ["grumpy", "loner", "territorial"],
      "catchPhrases": ["What are you doing in my swamp?!", "Ogres are like onions.", "Better out than in, I always say."]
  },
  {
      "name": "Peter Griffin",
      "image": "/img/peter.png",
      "faceoff": "/img/peter-faceoff.png",
      "hint": "family guy",
      "voiceId": "pegasus",
      "personality": ["immature", "impulsive", "obnoxious"],
      "catchPhrases": ["Giggity.", "Freakin' sweet!", "Hehehehehe."]
  },
  {
      "name": "Scooby-Doo",
      "image": "/img/scooby.png",
      "faceoff": "/img/scooby-faceoff.png",
      "hint": "mystery dog",
      "voiceId": "dragon",
      "personality": ["cowardly", "hungry", "loyal"],
      "catchPhrases": ["Scooby Dooby Doo!", "Roh-roh!", "Ruh-roh, Raggy!"]
  },
  {
      "name": "Bugs Bunny",
      "image": "/img/bugs.png",
      "faceoff": "/img/bugs-faceoff.png",
      "hint": "wabbit",
      "voiceId": "orion",
      "personality": ["clever", "mischievous", "calm"],
      "catchPhrases": ["What's up, doc?", "Of course you realize, this means war.", "Ain't I a stinker?"]
  },
  {
      "name": "Darth Vader",
      "image": "/img/vader.png",
      "faceoff": "/img/vader-faceoff.png",
      "hint": "sith lord",
      "voiceId": "electra",
      "personality": ["menacing", "powerful", "conflicted"],
      "catchPhrases": ["I find your lack of faith disturbing.", "The Force is strong with this one.", "No, I am your father."]
  },
  {
      "name": "Homer Simpson",
      "image": "/img/homer.png",
      "faceoff": "/img/homer-faceoff.png",
      "hint": "doh",
      "voiceId": "perseus",
      "personality": ["lazy", "dim-witted", "loving"],
      "catchPhrases": ["D'oh!", "Woo-hoo!", "Mmm, donuts."]
  },
  {
      "name": "Mickey Mouse",
      "image": "/img/mickey.png",
      "faceoff": "/img/mickey-faceoff.png",
      "hint": "disney mouse",
      "voiceId": "callisto",
      "personality": ["cheerful", "kind", "adventurous"],
      "catchPhrases": ["Oh boy!", "Hot dog!", "Gosh!"]
  }
];

async function seedCharacters() {
  const charactersCollection = db.collection('characters');
  
  console.log('Seeding characters...');

  for (const character of characters) {
    await charactersCollection.add({
      ...character,
      createdAt: new Date(),
    });
    console.log(`Added ${character.name}`);
  }

  console.log('Finished seeding characters.');
  process.exit(0);
}

seedCharacters().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
