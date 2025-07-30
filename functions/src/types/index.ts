export interface Character {
    id: string;
    name: string;
    image?: string;
    faceoff?: string;
    voiceId: string;
    hint: string;
    personality: string[],
    catchPhrases: string[],
    createdAt: Date;
}