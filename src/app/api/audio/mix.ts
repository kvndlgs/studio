import { NextApiRequest, NextApiResponse } from "next";
import { AudioProcessor } from "@/utils/audio";
import { BattleDatabaseServer } from "@/lib/database.server";
import { BattleDataAPI } from "@/types";

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
    req: NextApiRequest,
    res: NextApiResponse<MixAudioResponse>
  ) {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
      console.log('Method not allowed');
    }

    try {
      const { battleId } = req.body;
      if (!battleId) {
        return res.status(400).json({ success: false, error: 'Battle ID is required' });
        console.log('Not battle Id found');
      }

      // Get battle data using the server-side database method
      const battle: BattleDataAPI | null = await BattleDatabaseServer.getById(battleId);
      if (!battle) {
        return res.status(404).json({ success: false, error: 'Battle not found' });
        console.log('Battle not found');
      }
      
      if (!battle.vocalsUrl) {
          return res.status(400).json({ success: false, error: 'Battle has no vocals to mix' });
          console.log('Vocals not found');
      }

      if (!battle.beat.url) {
          return res.status(400).json({ success: false, error: 'Battle has no beat to mix' });
          console.log('Beat not found');
      }

      // Process audio
      const downloadUrl = await AudioProcessor.processFullBattle(
        battleId,
        battle.beat.url,
        battle.vocalsUrl
      );

      // Update battle with download URL
      await BattleDatabaseServer.updateAudioUrl(battleId, downloadUrl);

      res.status(200).json({
        success: true,
        downloadUrl
      });
    } catch (error) {
      console.error('Audio mixing error:', error);
      console.log('Audio mixing error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mix audio'
      });
    }
  }
