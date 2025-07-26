
"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import {
  generateRapLyrics,
  type GenerateRapLyricsOutput,
} from "@/ai/flows/generate-rap-lyrics";
import {
  generateTtsAudio,
  type GenerateTtsAudioOutput,
} from "@/ai/flows/generate-tts-audio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Share2, Music, MicVocal, Wand2, Play, Pause, AlertTriangle, Speaker } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Progress } from "./ui/progress";

const formSchema = z.object({
  topic: z
    .string()
    .min(5, { message: "Topic must be at least 5 characters long." })
    .max(100, { message: "Topic must be 100 characters or less." }),
});

type FormValues = z.infer<typeof formSchema>;

const characters = [
  { id: "peter", name: "Peter Griffin", image: "/img/peter.png", hint: "You are Peter Griffin from Family Guy", voiceId: "en-US-Wavenet-D" },
  { id: "shrek", name: "Shrek", image: "https://placehold.co/150x150.png", hint: "You are Shrek", voiceId: "en-US-Wavenet-B" },
  { id: "batman", name: "Batman 66'", image: "/img/batman.png", hint: "You are batman from 1966", voiceId: "en-US-Wavenet-B" },
  { id: "bender", name: "Bender", image: "/img/bender.png", hint: "You are bender from Futurama", voiceId: "en-US-Wavenet-A"},
  { id: "realisticfishhead", name: "Realistic Fish Head", image: "/img/realisticfishhead.png", hint: "You are Realistic Fish Head, news anchor from Bikini Bottom.", voiceId: "en-US-Wavenet-A"},
  { id: "shaggy", name: "Shaggy", image: "/img/shaggy.png", hint: "You are Shaggy from Scooby Doo.", voiceId: "en-US-Wavenet-A"},

];

const beats = [
    { id: 1, name: 'Shook Ones Pt, II', bpm: 92, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLqmLsMP3un3Ny3E0kMngdZk-Lsh4D8eBDHA&s', hint: 'Classic Rap Battle Instrumental', audioSrc: '/audio/Shook Ones, Pt II - Mobb Deep.mp3' },
    { id: 2, name: 'Who Shot Ya', bpm: 90, image: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Biggie-_Who_Shot_Ya.jpg/250px-Biggie-_Who_Shot_Ya.jpg', hint: 'study anime', audioSrc: '/audio/Notorious B.I.G - Who Shot Ya.mp3' },
    { id: 3, name: 'Hit Em Up', bpm: 95, image: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/2pac_-_Hit_%27Em_Up_promo.jpg/250px-2pac_-_Hit_%27Em_Up_promo.jpg', hint: 'sound system', audioSrc: '/audio/2Pac - Hit Em Up.mp3' },
    { id: 4, name: 'Not Like Us', bpm: 102, image: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/61/Kendrick_Lamar_-_Not_Like_Us.png/250px-Kendrick_Lamar_-_Not_Like_Us.png', hint: 'Classic Rap Battle Instrumental', audioSrc: '/audio/Kendrick Lamar - Not Like Us.mp3' },
    { id: 5, name: 'Family Matters', bpm: 82, image: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f8/Drake_-_Family_Matters.jpg/250px-Drake_-_Family_Matters.jpg', hint: 'Classic Rap Battle Instrumental', audioSrc: '/audio/Drake - Family Matters'},
];

export function RapBattle() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [lyrics, setLyrics] = useState<GenerateRapLyricsOutput | null>(null);
  const [ttsAudio, setTtsAudio] = useState<GenerateTtsAudioOutput | null>(null);
  const [selectedBeat, setSelectedBeat] = useState(beats[0]);
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
    if (ttsAudio?.audioDataUri) {
        if (vocalsAudioRef.current) {
            vocalsAudioRef.current.pause();
            vocalsAudioRef.current = null;
        }
        const audio = new Audio(ttsAudio.audioDataUri);
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
    setIsLoading(true);
    setLyrics(null);
    setTtsAudio(null);
    try {
      setLoadingStatus("Generating lyrical fire...");
      const lyricsResult = await generateRapLyrics({
        character1: characters[0].name,
        character2: characters[1].name,
        topic: data.topic,
        numVerses: 2,
      });
      setLyrics(lyricsResult);

      setLoadingStatus("Recording the vocal track...");
      const ttsResult = await generateTtsAudio({
        lyricsCharacter1: lyricsResult.lyricsCharacter1,
        character1Voice: characters[0].voiceId,
        lyricsCharacter2: lyricsResult.lyricsCharacter2,
        character2Voice: characters[1].voiceId,
      });
      setTtsAudio(ttsResult);

    } catch (error) {
      console.error("Failed during generation:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:
          "There was a problem generating the rap battle. Please try again.",
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
    beatAudioRef.current?.pause();
    vocalsAudioRef.current?.pause();
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
            The epic clash between {characters[0].name} and {characters[1].name}.
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
                    <Progress value={50} className="w-full mt-2 h-2" />
                </div>
            )}
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
            <Card className="transform transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
                <CardHeader className="flex-row items-center gap-4">
                    <Avatar className="w-16 h-16 border-4 border-primary/50">
                        <AvatarImage src={characters[0].image} alt={characters[0].name} data-ai-hint={characters[0].hint}/>
                        <AvatarFallback>{characters[0].name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl font-headline">{characters[0].name}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert prose-p:text-foreground/80 whitespace-pre-wrap font-body text-base">
                    {lyrics.lyricsCharacter1}
                </CardContent>
            </Card>
            <Card className="transform transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
                <CardHeader className="flex-row items-center gap-4">
                    <Avatar className="w-16 h-16 border-4 border-primary/50">
                        <AvatarImage src={characters[1].image} alt={characters[1].name} data-ai-hint={characters[1].hint}/>
                        <AvatarFallback>{characters[1].name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl font-headline">{characters[1].name}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert prose-p:text-foreground/80 whitespace-pre-wrap font-body text-base">
                    {lyrics.lyricsCharacter2}
                </CardContent>
            </Card>
        </div>
        
        <div className="mt-12 text-center">
            <Button onClick={resetBattle} size="lg">
                <Wand2 className="mr-2 h-5 w-5"/> Create Another Battle
            </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container max-w-5xl py-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl md:text-6xl">
          Create Your Rap Battle
        </h2>
        <p className="mt-4 text-muted-foreground md:text-xl">
          Choose your fighters, pick a beat, and let the AI lyrical warfare
          begin.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                <MicVocal className="h-8 w-8 text-primary" />
                Step 1: The Contenders
              </CardTitle>
              <CardDescription>
                Two titans enter the ring. Only one will leave a legend.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-4">
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={characters[0].image}
                    alt={characters[0].name}
                    width={150}
                    height={150}
                    className="rounded-full border-4 border-primary shadow-lg"
                    data-ai-hint={characters[0].hint}
                  />
                  <h3 className="text-xl font-bold font-headline">{characters[0].name}</h3>
                </div>
                <div className="text-4xl font-bold text-muted-foreground font-headline mx-4">VS</div>
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={characters[1].image}
                    alt={characters[1].name}
                    width={150}
                    height={150}
                    className="rounded-full border-4 border-primary shadow-lg"
                    data-ai-hint={characters[1].hint}
                  />
                  <h3 className="text-xl font-bold font-headline">{characters[1].name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
             <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                <Music className="h-8 w-8 text-primary" />
                Step 2: The Beat
              </CardTitle>
              <CardDescription>
                Select the instrumental that will set the stage for this epic showdown.
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
                                <Image src={beat.image} alt={beat.name} width={200} height={120} className="rounded-t-lg aspect-[3/2] object-cover" data-ai-hint={beat.hint}/>
                                <div className={cn(
                                  "absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center",
                                  selectedBeat.id === beat.id && "bg-black/60"
                                )}>
                                    {selectedBeat.id === beat.id && <Play className="w-10 h-10 text-white/90 drop-shadow-lg" />}
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 text-center">
                                <p className="font-semibold font-headline">{beat.name}</p>
                                <p className="text-sm text-muted-foreground">{beat.bpm} BPM</p>
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
                Step 3: The Topic
              </CardTitle>
              <CardDescription>What will they be battling about? Get creative!</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="sr-only">Battle Topic</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="e.g., The last piece of pizza, who is the real king, the meaning of life..."
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
                 <Button type="submit" disabled={isLoading} size="lg" className="w-full text-lg font-headline tracking-wide">
                    {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                    <MicVocal className="mr-2 h-6 w-6" />
                    )}
                    {isLoading ? loadingStatus : "Start the Rumble!"}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </section>
  );
}
