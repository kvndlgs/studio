import { useState, useEffect } from 'react';
import { BattleData, BattleDataAPI } from '../types/index';
import { BattleDatabase } from '@/lib/database';

export function useBattle(battleId: string | null) {
  const [battle, setBattle] = useState<BattleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!battleId) return;

    const fetchBattle = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const battleData = await BattleDatabase.get(battleId);
        if (battleData) {
          setBattle(battleData);
          // Increment view count
          await BattleDatabase.incrementViewCount(battleId);
        } else {
          setError('Battle not found');
        }
      } catch (err) {
        setError('Failed to load battle');
        console.error('Error fetching battle:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBattle();
  }, [battleId]);

  return { battle, loading, error };
}

export function useCreateBattle() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBattle = async (
    battleData: Omit<BattleDataAPI, 'id' | 'createdAt' | 'expiresAt' | 'viewCount'>
  ): Promise<{ battleId: string; shareUrl: string } | null> => {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/app/api/battles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(battleData),
      });

      if (!response.ok) {
        throw new Error('Failed to create battle');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create battle');
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createBattle, creating, error };
}