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

export interface Beat {
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




// Fixed BattleData interface with proper lyrics structure
export interface BattleData {
    id: string;
    character1Id: string;
    character2Id: string;
    beat: {
        id: number;
        name: string;
        url: string;
    };
    topic: string;
    lyrics: {
        character1: string; // Changed from string[] to string to match frontend
        character2: string; // Changed from string[] to string to match frontend
    };
    winner?: string; // Made optional since it might not always exist
    judges?: {
        judge1Name?: string;
        commentary1?: string;
        judge2Name?: string;
        commentary2?: string;
    }; // Made optional since judges might not always exist
    vocalsUrl?: string; // Made optional
    audioDownloadUrl?: string; // Made optional
    createdAt: Timestamp;
    expiresAt: Timestamp;
    isPublic: boolean;
    viewCount: number;
}


export interface BattleDataAPI extends Omit<BattleData, 'createdAt' | 'expiresAt'> {
    createdAt: Date;
    expiresAt: Date;
  }


  export interface CreateBattleRequest {
    character1Id: string;
    character2Id: string;
    beat: {
        id: number;
        name: string;
        url: string;
    };
    topic: string;
    lyrics: {
        character1: string;
        character2: string;
    };
    winner?: string | null; // Allow null from frontend
    judges?: {
        judge1Name?: string;
        commentary1?: string;
        judge2Name?: string;
        commentary2?: string;
    } | null; // Allow null from frontend
    vocalsUrl?: string | null; // Allow null from frontend
    isPublic: boolean;
}


export interface CreateBattleResponse {
    success: boolean;
    vocalsUrl: string;
    battleId: string;
}

export interface AudioMixRequest {
    beatUrl: string;
    vocalsUrl: string;
    battleId: string;
}