import {
    collection,
    doc,
    setDoc,
    updateDoc,
    increment,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { adminDb } from '@/lib/firebase-admin'
import { BattleData, BattleDataAPI } from '@/types/index'



const BATTLES_COLLECTION = 'battles';

export class BattleDatabase {
  // Client-side methods
  static async get(battleId: string): Promise<BattleData | null> {
    const docRef = doc(db, BATTLES_COLLECTION, battleId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      // Explicitly define the type of the data
      return {
        id: docSnap.id,
        characters: data.characters, // Cast or ensure type for each field
        beat: data.beat,
        topic: data.topic,
        verses: data.verses,
        winner: data.winner,
        judges: data.judges,
        vocalsUrl: data.vocalsUrl as string | undefined, // Explicitly cast vocalsUrl
        audioDownloadUrl: data.audioDownloadUrl as string | undefined, // Explicitly cast audioDownloadUrl
        createdAt: data.createdAt as Timestamp, // Cast Timestamps
        expiresAt: data.expiresAt as Timestamp, // Cast Timestamps
        isPublic: data.isPublic,
        viewCount: data.viewCount,
      } as BattleData; // Final cast for safety
  }

  static async incrementViewCount(battleId: string): Promise<void> {
    const docRef = doc(db, BATTLES_COLLECTION, battleId);
    await updateDoc(docRef, {
      viewCount: increment(1)
    });
  }

  // Server-side methods (for API routes)
  static async store(battle: BattleData): Promise<void> {
    const docRef = adminDb.collection(BATTLES_COLLECTION).doc(battle.id);
    
    const firestoreBattle = {
      ...battle
    };
    
    await docRef.set(firestoreBattle);
  }

  static async getById(battleId: string): Promise<BattleData | null> {
    const docRef = adminDb.collection(BATTLES_COLLECTION).doc(battleId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return null;
    
    return { id: docSnap.id, ...docSnap.data() } as BattleData;
  }

  static async updateAudioUrl(battleId: string, audioUrl: string): Promise<void> {
    const docRef = adminDb.collection(BATTLES_COLLECTION).doc(battleId);
    await docRef.update({
      audioDownloadUrl: audioUrl
    });
  }

  static async getRecentBattles(limitCount: number = 10): Promise<BattleData[]> {
    const q = query(
      collection(db, BATTLES_COLLECTION),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BattleData));
  }
}