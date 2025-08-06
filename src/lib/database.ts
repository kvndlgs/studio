// lib/database.ts
// THIS FILE IS CLIENT-SIDE SAFE.
import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment,
  Timestamp,
  FirestoreError
} from 'firebase/firestore';
import { db } from './firebase';
import { BattleData, BattleDataAPI } from '../types/index';

const BATTLES_COLLECTION = 'battles';

export class BattleDatabase {
  static async get(battleId: string): Promise<BattleDataAPI | null> {
    try {
      const docRef = doc(db, BATTLES_COLLECTION, battleId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log(`No battle found with ID: ${battleId}`);
        return null;
      }
      
      const data = docSnap.data() as BattleData;
      
      // Firestore Timestamps need to be converted to JS Date objects
      const createdAt = (data.createdAt as unknown as Timestamp).toDate();
      const expiresAt = (data.expiresAt as unknown as Timestamp).toDate();

      if (expiresAt < new Date()) {
        console.warn(`Battle ${battleId} has expired.`);
        return null;
      }
      
      return {
        ...data,
        id: docSnap.id,
        createdAt,
        expiresAt,
      };
    } catch (error) {
      console.error('Error getting battle:', error);
      if (error instanceof FirestoreError) {
        if (error.code === 'permission-denied') {
          throw new Error('Access denied to battle data');
        }
        if (error.code === 'not-found') {
          return null;
        }
      }
      throw new Error('Failed to retrieve battle data');
    }
  }

  static async incrementViewCount(battleId: string): Promise<void> {
    try {
      const docRef = doc(db, BATTLES_COLLECTION, battleId);
      await updateDoc(docRef, {
        viewCount: increment(1)
      });
    } catch (error) {
      // It's not critical if this fails, so just log a warning.
      console.warn('Failed to increment view count:', error);
    }
  }
}
