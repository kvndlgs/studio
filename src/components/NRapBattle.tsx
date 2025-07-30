
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Progress } from "./ui/progress";
// import { characters } from "@/data/characters";
import { CharacterCard } from "./CharacterCard";


const formSchema = z.object({
    topic: z
      .string()
      .min(5, { message: "Topic must be at least 5 characters long." })
      .max(100, { message: "Topic must be 100 characters or less." }),
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  const beats = [
      { id: 1, name: 'Shook Ones Pt, II', bpm: 92, image: '/img/shookones.png', hint: 'Legendary Battle Instrumental From Mobb', audioSrc: '/audio/shookones.mp3' },
      { id: 2, name: 'Who Shot Ya', bpm: 90, image: '/img/whoshotya.png', hint: 'Biggie Vs. 2Pac', audioSrc: '/audio/whoshotya.mp3' },
      { id: 3, name: 'Hit Em Up', bpm: 95, image: '/img/hitemup.png', hint: '2Pac Vs. Biggie', audioSrc: '/audio/hitemup.mp3' },
      { id: 4, name: 'Not Like Us', bpm: 102, image: '/img/notlikeus.png', hint: 'Kendrick Lamar Vs. Drake', audioSrc: '/audio/notlikeus.mp3' },
      { id: 5, name: 'Family Matters', bpm: 82, image: '/img/familymatters.png', hint: 'Drake Vs. Kendrick Lamar', audioSrc: '/audio/familymatters.mp3'},
  ];

  export function RapBattle () {
    
  }