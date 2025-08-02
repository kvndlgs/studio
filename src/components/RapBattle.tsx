
"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Share2, Music, MicVocal, Wand2, Play, Pause, AlertTriangle, Speaker } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Character } from '@/types'
import { CharacterCard } from "./CharacterCard";
import { characters } from "@/data/characters";


const formSchema = z.object({
  topic: z
    .string()
    .min(5, { message: "Topic must be at least 5 characters long." })
    .max(100, { message: "Topic must be 100 characters or less." }),
});

type FormValues = z.infer<typeof formSchema>;


type GenerateRapLyricsOutput = {
  lyricsCharacter1: string;
  lyricsCharacter2: string;
};

type GenerateTtsAudioOutput = {
  audio: string;
};

const beats = [
    { id: 1, name: 'Shook Ones Pt, II', bpm: 92, image: '/img/shookones.png', hint: 'Legendary Battle Instrumental From Mobb', audioSrc: '/audio/shookones.mp3' },
    { id: 2, name: 'Who Shot Ya', bpm: 90, image: '/img/whoshotya.png', hint: 'Biggie Vs. 2Pac', audioSrc: '/audio/whoshotya.mp3' },
    { id: 3, name: 'Hit Em Up', bpm: 95, image: '/img/hitemup.png', hint: '2Pac Vs. Biggie', audioSrc: '/audio/hitemup.mp3' },
    { id: 4, name: 'Not Like Us', bpm: 102, image: '/img/notlikeus.png', hint: 'Kendrick Lamar Vs. Drake', audioSrc: '/audio/notlikeus.mp3' },
    { id: 5, name: 'Family Matters', bpm: 82, image: '/img/familymatters.png', hint: 'Drake Vs. Kendrick Lamar', audioSrc: '/audio/familymatters.mp3'},
];

export function RapBattle() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [lyrics, setLyrics] = useState<GenerateRapLyricsOutput | null>(null);
  const [ttsAudio, setTtsAudio] = useState<GenerateTtsAudioOutput | null>(null);
  const [selectedBeat, setSelectedBeat] = useState(beats[0]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedCharacter1, setSelectedCharacter1] = useState<Character| null>(null);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);
  const [isVocalsPlaying, setIsVocalsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const vocalsAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
    },
  });

  useEffect(() => {
    if (lyrics) {
      const timer = setTimeout(() => setIsResultsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsResultsVisible(false);
    }
  }, [lyrics]);

  useEffect(() => {
    if (beatAudioRef.current) {
      beatAudioRef.current.pause();
      beatAudioRef.current = null;
    }
    const audio = new Audio(selectedBeat.audioSrc);
    audio.loop = true;
    audio.addEventListener('error', () => { setAudioError(true); setIsBeatPlaying(false); });
    beatAudioRef.current = audio;
    setAudioError(false);
    setIsBeatPlaying(false);

    return () => {
      audio.pause();
    }
  }, [selectedBeat]);

  useEffect(() => {
    if (ttsAudio?.audio) {
        if (vocalsAudioRef.current) {
            vocalsAudioRef.current.pause();
            vocalsAudioRef.current = null;
        }
        const audio = new Audio(ttsAudio.audio);
        audio.addEventListener('ended', () => setIsVocalsPlaying(false));
        vocalsAudioRef.current = audio;
        setIsVocalsPlaying(false);

        return () => {
            audio.pause();
        }
    }
  }, [ttsAudio]);

  const toggleBeatPlayback = () => {
    if (audioError || !beatAudioRef.current) return;
    if (isBeatPlaying) {
      beatAudioRef.current?.pause();
    } else {
      beatAudioRef.current?.play().catch(() => setAudioError(true));
    }
    setIsBeatPlaying(!isBeatPlaying);
  };

  const toggleVocalsPlayback = () => {
    if (!vocalsAudioRef.current) return;
    if (isVocalsPlaying) {
        vocalsAudioRef.current.pause();
        vocalsAudioRef.current.currentTime = 0;
    } else {
        vocalsAudioRef.current.play();
    }
    setIsVocalsPlaying(!isVocalsPlaying);
  };

  const handleGenerate: SubmitHandler<FormValues> = async (data) => {
    if (!selectedCharacter || !selectedCharacter1) {
      toast({
        variant: "destructive",
        title: "Please select characters",
        description: "You need to select both characters before starting the battle.",
      });
      return;
    }

    setIsLoading(true);
    setLyrics(null);
    setTtsAudio(null);
    setLoadingStatus("Generating rap battle...");

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character1Id: selectedCharacter.id,
          character2Id: selectedCharacter1.id,
          topic: data.topic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const battleData = await response.json();

      setLyrics(battleData.lyrics);
      setTtsAudio(battleData);

      toast({
        title: "Battle Generated!",
        description: `${selectedCharacter.name} vs ${selectedCharacter1.name} is ready to rumble!`,
      });

    } catch (error: any) {
      console.error("Failed during generation:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "There was a problem generating the rap battle. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const resetBattle = () => {
    setLyrics(null);
    setTtsAudio(null);
    form.reset();
    if(beatAudioRef.current) {
        beatAudioRef.current.pause();
    }
    if (vocalsAudioRef.current) {
        vocalsAudioRef.current.pause();
    }
    setIsBeatPlaying(false);
    setIsVocalsPlaying(false);
  }

  if (lyrics) {
    return (
      <section className={cn(
        "container max-w-5xl py-12 transition-opacity duration-1000",
        isResultsVisible ? "opacity-100" : "opacity-0"
      )}>
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl md:text-6xl">The Battle is On!</h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            {selectedCharacter?.name} Vs. {selectedCharacter1?.name}.
          </p>
        </div>

        <Card className="mb-8 shadow-2xl overflow-hidden">
            <div className="p-4 md:p-6 bg-muted/30 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-between">
                <div className="flex items-center gap-4">
                    <Image src={selectedBeat.image} alt={selectedBeat.name} width={80} height={80} className="rounded-lg shadow-md aspect-square object-cover" data-ai-hint={selectedBeat.hint} />
                    <div>
                        <p className="text-sm text-muted-foreground">The Beat</p>
                        <p className="font-bold text-lg font-headline">{selectedBeat.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                     <Button size="lg" className="rounded-full w-20 h-20" aria-label="Play Beat" onClick={toggleBeatPlayback} disabled={audioError}>
                        {isBeatPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                    </Button>
                    {ttsAudio && (
                        <Button size="lg" className="rounded-full w-20 h-20" variant="secondary" aria-label="Play Vocals" onClick={toggleVocalsPlayback}>
                            {isVocalsPlaying ? <Pause className="w-10 h-10" /> : <Speaker className="w-10 h-10" />}
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline"><Download className="h-5 w-5"/> <span className="hidden sm:inline ml-2">Download</span></Button>
                    <Button variant="outline"><Share2 className="h-5 w-5"/> <span className="hidden sm:inline ml-2">Share</span></Button>
                </div>
            </div>
            {audioError && (
                 <div className="p-4 border-t border-destructive/20 bg-destructive/10">
                    <Alert variant="destructive" className="border-0">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Audio Error</AlertTitle>
                        <AlertDescription>
                            Could not load the beat. Please ensure it exists in the `/public/audio` directory.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
             {!ttsAudio && isLoading && (
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-4">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                        <p className="text-sm text-muted-foreground">{loadingStatus}</p>
                    </div>
                    <Progress value={75} className="w-full mt-2 h-2" />
                </div>
            )}
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
            <Card className="transform transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
                <CardHeader className="flex-row items-center gap-4">
                  <div>
                    <img src={selectedCharacter?.faceoff} alt={selectedCharacter?.name} />
                  </div>
                    <CardTitle className="text-2xl font-headline">{selectedCharacter?.name}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert prose-p:text-foreground/80 whitespace-pre-wrap font-body text-base">
                    {lyrics.lyricsCharacter1}
                </CardContent>
            </Card>
            <Card className="transform transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
                <CardHeader className="flex-row items-center gap-4">
                  <div>
                    <img src={selectedCharacter1?.faceoff} alt={selectedCharacter1?.name} />
                  </div>
                 <CardTitle className="text-2xl font-headline">{selectedCharacter1?.name}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert prose-p:text-foreground/80 whitespace-pre-wrap font-body text-base">
                    {lyrics.lyricsCharacter2}
                </CardContent>
            </Card>
        </div>

        <div className="mt-12 text-center">
            <Button onClick={resetBattle} size="lg">
                <Wand2 className="mr-2 h-5 w-5"/> New Battle
            </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container max-w-5xl py-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl md:text-6xl">
          SET BATTLE MATCH UP
        </h2>
        <p className="mt-4 text-muted-foreground md:text-xl">
          Pick 2 opponents, a beat, and let the sucker punches fly
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                <MicVocal className="h-8 w-8 text-primary" />
                 Main Event
              </CardTitle>
              <CardDescription>
                Two enter the ring. Only one will leave a legend.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-4">
                <div className="flex flex-col items-center justify-end">

                        <img
                            src={selectedCharacter?.faceoff}
                            alt={selectedCharacter?.name}
                            data-ai-hint={selectedCharacter?.hint}
                            className="w-3/4"
                        />

                  <h3 className="text-xl font-bold font-headline mt-2"> {selectedCharacter?.name}</h3>
                </div>
                <div className="text-4xl font-bold text-muted-foreground font-headline mx-4">VS</div>
                <div className="flex flex-col items-center justify-end">

                        <img
                            src={selectedCharacter1?.faceoff}
                            alt={selectedCharacter1?.name}
                            data-ai-hint={selectedCharacter1?.hint}
                            className="w-3/4"
                        />

                  <h3 className="text-xl font-bold font-headline mt-2">{ selectedCharacter1?.name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="max-w-full container flex flex-col items-between gap-4">
            <h4 className="text-bold"> Pick a character </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedCharacter?.id === character.id}
                disabled={isLoading}
                onClick={() => setSelectedCharacter(character)}
              />
            ))}
            </div>

            <div className="w-full h-auto text-center"><h3>VS.</h3></div>

            <h4 className="font-bold"> Pick an opponent </h4>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {characters.map((character) => (
               <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedCharacter1?.id === character.id}
                disabled={isLoading || character.id === selectedCharacter?.id}
                onClick={() => setSelectedCharacter1(character)}
              />
            ))}
            </div>

          </div>

          <Card className="shadow-lg">
             <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                <Music className="h-8 w-8 text-primary" />
                The Beat
              </CardTitle>
              <CardDescription>
                Select an instrumental.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {beats.map((beat) => (
                        <Card key={beat.id} onClick={() => setSelectedBeat(beat)} className={cn(
                            "cursor-pointer transition-all duration-300 group overflow-hidden",
                            selectedBeat.id === beat.id ? 'ring-2 ring-primary shadow-primary/40 shadow-xl' : 'ring-0 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1'
                        )}>
                            <CardHeader className="p-0 relative">
                                <Image src={beat.image} alt={beat.name} width={120} height={120} className="rounded-md p-1 aspect-[3/2] self-center object-cover" data-ai-hint={beat.hint}/>
                                <div className={cn(
                                  "absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center",
                                  selectedBeat.id === beat.id && "bg-black/60"
                                )}>
                                    {selectedBeat.id === beat.id && <Play className="w-10 h-10 text-white/90 drop-shadow-lg" />}
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 text-center">
                                <p className="font-semibold font-headline">{beat.name}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {audioError && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Audio File Not Found</AlertTitle><AlertDescription>Could not load '{selectedBeat.name}'. Make sure the file exists at `public{selectedBeat.audioSrc}`.</AlertDescription></Alert>}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
               <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                <Wand2 className="h-8 w-8 text-primary" />
                The Topic
              </CardTitle>
              <CardDescription>What's the beef about?</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="sr-only">Topic</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="e.g., The aerodynamic of a cow, Grower or shower?, the meaning of life..."
                        className="min-h-[100px] text-base"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isLoading || !selectedCharacter || !selectedCharacter1} size="lg" className="w-full text-white text-lg font-bold tracking-wide">
                    {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      ''
                    )}
                    {isLoading ? loadingStatus : "START!"}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </section>
  );
}

    