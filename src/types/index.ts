export interface Character {
    id: string;
    name: string;
    image: string;
    faceoff?: string;
    shadow?: string;
    hint: string;
    voiceId: string;
    personality: string[];
    catchPharases: string[];
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

export interface Battle {
    character1_id: string;
    character2_id: string;
    winner_id: string;
    instrumental_id: string;
    created_at: string;
}
