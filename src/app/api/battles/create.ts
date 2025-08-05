import { NextApiRequest, NextApiResponse } from "next";
import { BattleData, BattleDataAPI } from "@/types";
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { BattleDatabase } from '@/lib/database';

interface CreateBattleRequest extends NextApiRequest {
    body: Omit<BattleDataAPI, 'id' | 'createdAt' | 'expiresAt'>; // Use BattleDataAPI for the request body
}

interface CreateBattleResponse {
    success: boolean;
    battleId: string;
    shareUrl: string;
}

export default async function handler(
    req: CreateBattleRequest,
    res: NextApiResponse<CreateBattleResponse | {error: string}>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const battleId = uuidv4();
        const expiresAtDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create a BattleData object with Timestamp for storage
        const battleData: BattleData = {
            ...req.body,
            id: battleId,
            // Convert Date to Timestamp
            createdAt: Timestamp.fromDate(new Date()),
            expiresAt: Timestamp.fromDate(expiresAtDate),
        };

        const battleDataAPI: BattleDataAPI = {
            ...battleData, // Copy properties
            // Convert Timestamp back to Date for BattleDataAPI
            createdAt: (battleData.createdAt as Timestamp).toDate(),
            expiresAt: (battleData.expiresAt as Timestamp).toDate(),
        };


        // Use BattleDatabase.store to save the battle data
        await BattleDatabase.store(battleData);


        // You might want to trigger audio mix after the battle is created and stored
        // await triggerAudioMix(battleData); // Implement this function

        res.status(201).json({
            success: true,
            battleId,
            shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/battle/${battleId}`, // Use your base URL
        });
    } catch (error) {
        console.error('Failed to create battle:', error);
        res.status(500).json({ error: 'Failed to create battle' });
    }
}