import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/chat-context";
import { CONTACT_EMAIL_DISPLAY } from "@/lib/site";

export const runtime = "nodejs";

const MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 12;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;

type ChatMessage = { role: "user" | "assistant"; content: string };

// Best-effort in-memory rate limit. Resets on cold start / across instances —
// fine as a first line of defense, not a substitute for a real limiter
// (e.g. Upstash) once traffic grows.
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "L'assistant n'est pas encore configuré (clé API manquante côté serveur).",
      },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de messages envoyés, réessaie dans quelques minutes." },
      { status: 429 },
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const incoming = body.messages;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json(
      { error: "Aucun message fourni." },
      { status: 400 },
    );
  }

  for (const message of incoming) {
    if (
      typeof message.content !== "string" ||
      message.content.length === 0 ||
      message.content.length > MAX_MESSAGE_LENGTH ||
      (message.role !== "user" && message.role !== "assistant")
    ) {
      return NextResponse.json(
        { error: "Message invalide." },
        { status: 400 },
      );
    }
  }

  const history = incoming.slice(-MAX_HISTORY_MESSAGES);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
      }),
    });

    if (response.status === 429) {
      return NextResponse.json(
        { error: "L'assistant est très sollicité, réessaie dans un instant." },
        { status: 429 },
      );
    }
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorBody);
      return NextResponse.json(
        { error: "L'assistant est momentanément indisponible." },
        { status: 502 },
      );
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = data.candidates?.[0]?.finishReason;

    if (data.promptFeedback?.blockReason || finishReason === "SAFETY" || !text) {
      return NextResponse.json(
        {
          error:
            `Je ne peux pas répondre à ça. Écris-nous directement à ${CONTACT_EMAIL_DISPLAY}.`,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Chat route unexpected error:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue." },
      { status: 500 },
    );
  }
}
