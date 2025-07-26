export class BPMOrchestrator {
    private bpm: number;
    private beatsPerBar: number = 4;
    private barsPerVerse: number = 4;
    private introBeats: number = 2; // Number of beats to wait before starting
  
    constructor(bpm: number) {
      this.bpm = bpm;
    }
  
    // Calculate timing for verse playback with intro delay
    calculateVerseTiming(verseText: string): {
      duration: number;
      wordTimings: Array<{ word: string; startTime: number; duration: number }>;
    } {
      const words = verseText.split(' ');
      const totalSyllables = this.countSyllables(verseText);
      
      // Calculate base timing
      const millisecondsPerBeat = (60 / this.bpm) * 1000;
      const totalBars = this.barsPerVerse;
      const verseDuration = (totalBars * this.beatsPerBar * millisecondsPerBeat);
      
      // Calculate intro delay for vocals only
      const introDelay = this.introBeats * millisecondsPerBeat;
      
      // Adjust for syllable density
      const adjustedVerseDuration = Math.max(verseDuration, totalSyllables * 200);
      const totalDuration = adjustedVerseDuration + introDelay;
      
      // Calculate word timings (starting after the intro delay)
      const wordTimings: Array<{ word: string; startTime: number; duration: number }> = [];
      let currentTime = introDelay; // Vocals start after the intro delay
      
      words.forEach((word, index) => {
        const wordSyllables = this.countSyllables(word);
        const wordDuration = (wordSyllables / totalSyllables) * adjustedVerseDuration;
        
        wordTimings.push({
          word: word,
          startTime: currentTime,
          duration: wordDuration
        });
        
        currentTime += wordDuration;
      });
  
      return {
        duration: totalDuration, // Total duration includes intro delay
        wordTimings
      };
    }
  
    // Add pauses between verses
    calculatePauseDuration(): number {
      const beatsPerPause = 2; // 2 beats pause between verses
      return (beatsPerPause * 60 / this.bpm) * 1000;
    }
  
    // Get the intro delay duration
    getIntroDelay(): number {
      return (this.introBeats * 60 / this.bpm) * 1000;
    }
  
    // Set custom intro beats (optional method for flexibility)
    setIntroBeats(beats: number): void {
      this.introBeats = beats;
    }
  
    // Count syllables in text (simple heuristic)
    private countSyllables(text: string): number {
      const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
      return words.reduce((total, word) => {
        const syllables = word.match(/[aeiouy]+/g) || [];
        return total + Math.max(1, syllables.length);
      }, 0);
    }
  
    // Calculate total battle duration
    calculateBattleDuration(verses: string[]): number {
      const verseDurations = verses.map(verse => this.calculateVerseTiming(verse).duration);
      const pauseDuration = this.calculatePauseDuration();
      const totalPauses = verses.length - 1;
      
      return verseDurations.reduce((total, duration) => total + duration, 0) + 
             (totalPauses * pauseDuration);
    }
  
    // Synchronize verse with beat (beat starts immediately, vocals delayed)
    synchronizeWithBeat(verse: string, startTime: number = 0): {
      timing: ReturnType<BPMOrchestrator['calculateVerseTiming']>;
      beatSync: Array<{ beat: number; time: number }>;
    } {
      const timing = this.calculateVerseTiming(verse);
      const beatSync: Array<{ beat: number; time: number }> = [];
      
      const millisecondsPerBeat = (60 / this.bpm) * 1000;
      // Beat sync should cover the full duration but start immediately
      const totalBeats = Math.ceil(timing.duration / millisecondsPerBeat);
      
      // Beats start at startTime (no delay), vocals start after intro delay
      for (let beat = 0; beat < totalBeats; beat++) {
        beatSync.push({
          beat: beat + 1,
          time: startTime + (beat * millisecondsPerBeat) // Beat starts immediately
        });
      }
  
      return { timing, beatSync };
    }
  }