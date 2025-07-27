import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/hooks/use-auth";
import { GoogleAnalytics } from '@next/third-parties/google';

const gid = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;


export const metadata: Metadata = {
  title: "SUCKERPUNCH AI",
  description: "Rap Battle Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-title" content="suckerpunch" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <GoogleAnalytics gaId='G-YSYZ0LDK67' />
      </body>
    </html>
  );
}
