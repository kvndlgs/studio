import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RapBattle } from "@/components/RapBattle";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full">
        <RapBattle />
      </main>
      <Footer />
    </div>
  );
}
