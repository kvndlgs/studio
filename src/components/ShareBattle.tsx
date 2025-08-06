import { useState } from 'react';
import { BattleDataAPI } from '@/types/index';
import { useToast } from '@/hooks/use-toast';

interface ShareBattleProps {
  battle: BattleDataAPI; // Changed from BattleData to BattleDataAPI
}

export default function ShareBattle({ battle }: ShareBattleProps) {
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast(); // Add toast for better UX

  const shareUrl = `${window.location.origin}/battle/${battle.id}`;

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard",
      });
    } catch (err) {
      console.error('Failed to copy link');
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy link to clipboard",
      });
    } finally {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${battle.character1Id} vs ${battle.character2Id} - Rap Battle`,
      text: `Check out this epic rap battle between ${battle.character1Id} and ${battle.character2Id}!`,
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
          body: JSON.stringify({ 
            battleId: battle.id,
            beatUrl: battle.beat.url,
            vocalsUrl: battle.vocalsUrl
          }),
        });

        if (!response.ok) {
          throw new Error('Audio processing failed');
        }

        const result = await response.json();
        if (result.success && result.audioDownloadUrl) {
          // Download the file
          const link = document.createElement('a');
          link.href = result.audioDownloadUrl;
          link.download = `${battle.character1Id}-vs-${battle.character2Id}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download started",
            description: "Your audio file is being downloaded",
          });
        } else {
          throw new Error('Audio processing failed');
        }
      } catch (err) {
        console.error('Failed to download audio:', err);
        toast({
          variant: "destructive",
          title: "Download failed",
          description: "Could not process or download the audio file",
        });
      } finally {
        setDownloading(false);
      }
    } else {
      // Direct download
      const link = document.createElement('a');
      link.href = battle.audioDownloadUrl;
      link.download = `${battle.character1Id}-vs-${battle.character2Id}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your audio file is being downloaded",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleShare}
        disabled={copying}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {copying ? 'Copying...' : 'Share Battle'}
      </button>
      
      <button
        onClick={handleDownloadAudio}
        disabled={downloading || !battle.vocalsUrl}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {downloading ? 'Preparing...' : 'Download Audio'}
      </button>
      
      {!battle.vocalsUrl && (
        <p className="text-sm text-gray-500 text-center">
          Audio download unavailable - no vocals generated
        </p>
      )}
    </div>
  );
}