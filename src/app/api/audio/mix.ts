import { NextApiRequest, NextApiResponse } from "next";
import { AudioProcessor } from "@/utils/audio";
import { BattleDatabase } from "@/lib/database";
import { BattleData, BattleDataAPI } from "@/types"; // Import BattleData and BattleDataAPI
import { Timestamp } from "firebase/firestore"; // Import Timestamp

interface MixAudioRequest extends NextApiRequest {
    body: {
      battleId: string;
    };
  }

  interface MixAudioResponse {
    success: boolean;
    downloadUrl?: string;
    error?: string;
  }

  export default async function handler(
    req: MixAudioRequest,
    res: NextApiResponse<MixAudioResponse>
  ) {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
      const { battleId } = req.body;

      // Get battle data - this will return BattleData (with Timestamps)
      const battle: BattleData | null = await BattleDatabase.getById(battleId); // Assuming you use getById on the server side
      if (!battle) {
        return res.status(404).json({ success: false, error: 'Battle not found' });
      }

      // Process audio
      const downloadUrl = await AudioProcessor.processFullBattle(
        battleId,
        battle.beat.url,
        battle.vocalsUrl // This should now be a string
      );

      // Create a BattleDataAPI object for storing
      const battleDataAPI: BattleDataAPI = {
          ...battle, // Copy other properties
          audioDownloadUrl: downloadUrl,
          // Convert Timestamp to Date for BattleDataAPI
          createdAt: (battle.createdAt as Timestamp).toDate(),
          expiresAt: (battle.expiresAt as Timestamp).toDate(),
      };


      // Update battle with download URL using the BattleDataAPI object
      await BattleDatabase.store(battleDataAPI); // Pass the converted object

      res.status(200).json({
        success: true,
        downloadUrl
      });
    } catch (error) {
      console.error('Audio mixing error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mix audio'
      });
    }
  }
