import { Timestamp } from 'firebase/firestore';

export interface Character {
    id: string;
    name: string;
    image: string;
    faceoff?: string;
    shadow?: string;
    hint: string;
    voiceId: string;
    personality: string[];
    catchPhrases: string[];
    createdAt: Date;
}

export interface AnimatorProps {
    id: string;
    name: string;
    image: string;
    hint: string;
    voiceId: string;
    personality: string[];
    catchPhrases: string[];
    createdAt: Date;
}

export interface Beats {
    id: number;
    name: string;
    bpm: number;
    image: string;
    hint: string;
    audioSrc: string;
}


export interface Judge {
    id: string;
    name: string;
    voiceId: string;
    image: string;
    hint: string;
    personality: string[];
    catchPhrases: string[];
    createdAt: Date;
}



export interface BattleData {
    id: string;
    characters: [Character, Character];
    beat: {
        id: string;
        name: string;
        url: string;
    };
    topic: string;
    verses: {
        character1: string[];
        character2: string[];
    };
    winner: Character;
    judges: {
        name: string;
        comment: string;
    }[];
    vocalsUrl: string;
    audioDownloadUrl: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    isPublic: boolean;
    viewCount: number;
}

export interface BattleDataAPI extends Omit<BattleData, 'createdAt' | 'expiresAt'> {
    createdAt: Date;
    expiresAt: Date;
  }

export interface AudioMixRequest {
    beatUrl: string;
    vocalsUrl: string;
    battleId: string;
}