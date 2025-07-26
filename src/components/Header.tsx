"use client";

import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="text-primary h-6 w-6" />
          <h1 className="text-xl font-bold font-headline text-foreground">
            Groq Rap Rumble
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">Log In</Button>
          <Button>Sign Up</Button>
        </div>
      </div>
    </header>
  );
}
