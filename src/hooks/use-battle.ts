import { useState, useEffect } from 'react';
import { BattleDataAPI, CreateBattleRequest } from '../types/index';
import { BattleDatabase } from '@/lib/database';

export function useBattle(battleId: string | null) {
  const [battle, setBattle] = useState<BattleDataAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!battleId) {
      setBattle(null);
      setError(null);
      return;
    }

    const fetchBattle = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const battleData = await BattleDatabase.get(battleId);
        if (battleData) {
          setBattle(battleData);
          // Increment view count in background
          BattleDatabase.incrementViewCount(battleId).catch(console.error);
        } else {
          setError('Battle not found');
          setBattle(null);
        }
      } catch (err) {
        setError('Failed to load battle');
        setBattle(null);
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
    battleData: CreateBattleRequest
  ): Promise<{ battleId: string; shareUrl: string } | null> => {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/battles/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(battleData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create battle';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: { battleId: string; shareUrl: string } = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create battle';
      setError(errorMessage);
      console.error('Create battle error:', err);
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createBattle, creating, error };
}