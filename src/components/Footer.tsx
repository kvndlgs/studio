import { Twitter, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 mt-12 border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row max-w-screen-2xl">
        <p className="text-sm text-muted-foreground">
          © {currentYear} Groq Rap Rumble. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Twitter">
            <Twitter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Instagram">
            <Instagram className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Facebook">
            <Facebook className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
