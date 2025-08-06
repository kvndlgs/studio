// lib/database.server.ts
// THIS FILE IS SERVER-SIDE ONLY. DO NOT IMPORT ON THE CLIENT.
import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { BattleData, BattleDataAPI } from '../types/index';

const BATTLES_COLLECTION = 'battles';

export class BattleDatabaseServer {
  static async store(battle: BattleDataAPI): Promise<void> {
    try {
      const docRef = adminDb.collection(BATTLES_COLLECTION).doc(battle.id);
      
      // Convert JS Date objects back to Firestore Timestamps for storage
      const firestoreBattle = {
        ...battle,
        createdAt: Timestamp.fromDate(battle.createdAt),
        expiresAt: Timestamp.fromDate(battle.expiresAt),
      };
      
      // The 'id' is part of the document path, so we don't store it in the document body.
      const { id, ...dataToStore } = firestoreBattle;

      await docRef.set(dataToStore);
    } catch (error) {
      console.error('Error storing battle:', error);
      throw new Error('Failed to store battle data in Firestore.');
    }
  }

  static async getById(battleId: string): Promise<BattleDataAPI | null> {
    try {
      const docRef = adminDb.collection(BATTLES_COLLECTION).doc(battleId);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        console.log(`Admin: No battle found with ID: ${battleId}`);
        return null;
      }
      
      const data = docSnap.data() as BattleData;

      const createdAt = (data.createdAt as unknown as Timestamp).toDate();
      const expiresAt = (data.expiresAt as unknown as Timestamp).toDate();

      if (expiresAt < new Date()) {
        console.warn(`Admin: Battle ${battleId} has expired.`);
        return null;
      }
      
      return {
        ...data,
        id: docSnap.id,
        createdAt,
        expiresAt,
      };
    } catch (error) {
      console.error('Error getting battle by ID with Admin SDK:', error);
      throw new Error('Failed to retrieve battle data from Firestore.');
    }
  }

  static async updateAudioUrl(battleId: string, audioUrl: string): Promise<void> {
    try {
      const docRef = adminDb.collection(BATTLES_COLLECTION).doc(battleId);
      await docRef.update({
        audioDownloadUrl: audioUrl
      });
      console.log(`Successfully updated audio URL for battle ${battleId}`);
    } catch (error) {
      console.error('Error updating audio URL in Firestore:', error);
      throw new Error('Failed to update audio URL.');
    }
  }
}
