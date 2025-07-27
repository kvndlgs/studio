export interface Character {
    id: number;
    name: string;
    image: string;
    faceoff?: string;
    hint: string;
    voiceId: string;
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
