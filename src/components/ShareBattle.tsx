import { useState } from 'react';
import { BattleData } from '@/types/index';


interface ShareBattleProps {
    battle: BattleData;
  }
  
  export default function ShareBattle({ battle }: ShareBattleProps) {
    const [copying, setCopying] = useState(false);
    const [downloading, setDownloading] = useState(false);
  
    const shareUrl = `${window.location.origin}/battle/${battle.id}`;
  
    const handleCopyLink = async () => {
      setCopying(true);
      try {
        await navigator.clipboard.writeText(shareUrl);
        // Show success toast
      } catch (err) {
        console.error('Failed to copy link');
      } finally {
        setCopying(false);
      }
    };
  
    const handleShare = async () => {
      const shareData = {
        title: `${battle.characters[0].name} vs ${battle.characters[1].name} - Rap Battle`,
        text: `Check out this epic rap battle between ${battle.characters[0].name} and ${battle.characters[1].name}!`,
        url: shareUrl,
      };
  
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.log('Share cancelled');
        }
      } else {
        handleCopyLink();
      }
    };
  
    const handleDownloadAudio = async () => {
      if (!battle.audioDownloadUrl) {
        // Trigger audio generation
        setDownloading(true);
        try {
          const response = await fetch('/api/audio/mix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ battleId: battle.id }),
          });
  
          const result = await response.json();
          if (result.success) {
            // Download the file
            const link = document.createElement('a');
            link.href = result.downloadUrl;
            link.download = `${battle.characters[0].name}-vs-${battle.characters[1].name}.mp3`;
            link.click();
          }
        } catch (err) {
          console.error('Failed to download audio');
        } finally {
          setDownloading(false);
        }
      } else {
        // Direct download
        const link = document.createElement('a');
        link.href = battle.audioDownloadUrl;
        link.download = `${battle.characters[0].name}-vs-${battle.characters[1].name}.mp3`;
        link.click();
      }
    };
  
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={handleShare}
          disabled={copying}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {copying ? 'Copying...' : 'Share Battle'}
        </button>
        
        <button
          onClick={handleDownloadAudio}
          disabled={downloading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {downloading ? 'Preparing...' : 'Download Audio'}
        </button>
      </div>
    );
  }