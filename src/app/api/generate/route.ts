import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { NextResponse } from "next/server";

const generateRapBattle = httpsCallable(functions, 'generateRapBattle');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { character1Id, character2Id, topic } = body;

    if (!character1Id || !character2Id || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await generateRapBattle({
        character1Id,
        character2Id,
        topic,
    });

    return NextResponse.json(result.data);

  } catch (error: any) {
    console.error("API Route Error:", error);
    // Forward the actual error message from the function if available
    const errorMessage = error.details?.message || "An internal server error occurred.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
