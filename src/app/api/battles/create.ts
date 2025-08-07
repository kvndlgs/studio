// pages/api/battles/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from 'uuid';
import { BattleDataAPI } from "@/types";
import { BattleDatabaseServer } from '@/lib/database.server'; // Correct import

interface RequestBody {
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
    winner?: string | null;
    judges?: {
        judge1Name?: string;
        commentary1?: string;
        judge2Name?: string;
        commentary2?: string;
    } | null;
    vocalsUrl?: string | null;
    isPublic: boolean;
}

interface ResponseBody {
    success: boolean;
    battleId: string;
    shareUrl: string;
}

interface ErrorResponse {
    error: string;
}

// Background audio processing function
async function processAudio(battleId: string) {
    // Use the full URL for the API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    try {
        const response = await fetch(`${baseUrl}/api/audio/mix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ battleId }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Audio processing failed: ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();
        console.log(`Audio processing initiated for battle ${battleId}:`, result);
    } catch (error) {
        console.error(`Audio processing failed for battle ${battleId}:`, error);
        console.log(`Failed to generate audio for battle ${battleId}:`, error)
    }
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseBody | ErrorResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body as RequestBody;
        
        const { character1Id, character2Id, beat, topic, lyrics, isPublic = true } = body;
        
        if (!character1Id || !character2Id || !beat || !topic || !lyrics) {
            return res.status(400).json({ 
                error: 'Missing required fields: character1Id, character2Id, beat, topic, and lyrics are required' 
            });
        }

        if (!lyrics.character1 || !lyrics.character2) {
            return res.status(400).json({ 
                error: 'Both character lyrics are required' 
            });
        }

        const battleId = uuidv4();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const battleData: BattleDataAPI = {
            id: battleId,
            character1Id,
            character2Id,
            beat,
            topic,
            lyrics,
            winner: body.winner || undefined,
            judges: body.judges || undefined,
            vocalsUrl: body.vocalsUrl || undefined,
            audioDownloadUrl: undefined,
            createdAt: now,
            expiresAt,
            isPublic,
            viewCount: 0,
        };

        await BattleDatabaseServer.store(battleData);

        if (body.vocalsUrl && beat.url) {
            // No need to await this, let it run in the background
            processAudio(battleId);
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
        
        res.status(201).json({
            success: true,
            battleId,
            shareUrl: `${baseUrl}/battles/${battleId}`,
        });

    } catch (error) {
        console.error('Failed to create battle:', error);
        console.log('Failed to create battle:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Failed to create battle' 
        });
    }
}
