import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/chat-context";

export const runtime = "nodejs";

const MODEL = "claude-opus-5";
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

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
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

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(),
      output_config: { effort: "low" },
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((block) => block.type === "text");

    if (response.stop_reason === "refusal" || !textBlock) {
      return NextResponse.json(
        {
          error:
            "Je ne peux pas répondre à ça. Écris-nous directement à contact@arc-wear.com.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ reply: textBlock.text });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "L'assistant est très sollicité, réessaie dans un instant." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "L'assistant est momentanément indisponible." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue." },
      { status: 500 },
    );
  }
}
