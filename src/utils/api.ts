import { BattleData } from "@/types";

export async function createBattle(battleData: Omit<BattleData, 'id' | 'createdAt' | 'expiresAt'>): Promise<{ battleId: string; shareUrl: string}> {
    const response = await fetch('/api/battles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(battleData)
    })

    if (!response.ok) {
        throw new Error('Failed to create battle')
    }

    return response.json();
    
}