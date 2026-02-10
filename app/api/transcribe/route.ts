import { NextRequest, NextResponse } from "next/server";
import { Client, handle_file } from "@gradio/client";
import { validateServerFile } from "@/lib/validators";

// ---------------------------------------------------------------------------
// Whisper Large V3 Turbo — via public Hugging Face Gradio Space
// 100% FREE — no token needed — calls hf-audio/whisper-large-v3-turbo Space
// ---------------------------------------------------------------------------
const HF_SPACE = "hf-audio/whisper-large-v3-turbo";
const MODEL_LABEL = "openai/whisper-large-v3-turbo";

// ---------------------------------------------------------------------------
// Basic in-memory rate limiter
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// Clean stale entries every 5 min
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitMap.keys()).forEach((key) => {
    const val = rateLimitMap.get(key);
    if (val && now > val.resetAt) rateLimitMap.delete(key);
  });
}, 5 * 60_000);

// ---------------------------------------------------------------------------
// POST /api/transcribe
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No audio file provided. Send a file with field name "file".' },
        { status: 400 }
      );
    }

    // Server-side validation
    const validation = validateServerFile(file.size, file.type, file.name);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Read audio as Blob
    const audioBuffer = await file.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], {
      type: file.type || "audio/wav",
    });

    // -----------------------------------------------------------------------
    // Call the public Whisper Large V3 Turbo Space (Gradio API)
    // This is 100% free — no HF token required
    // -----------------------------------------------------------------------
    const hfToken = process.env.HF_ACCESS_TOKEN;
    console.log("[transcribe] Connecting to Space:", HF_SPACE);
    const startTime = Date.now();

    const client = await Client.connect(HF_SPACE, {
      token: (hfToken as `hf_${string}`) || undefined,
    });

    const result = await client.predict("/predict", {
      inputs: audioBlob,
      task: "transcribe",
    });

    const elapsedMs = Date.now() - startTime;
    const data = result.data as string[];
    const text = (data && data[0]) ? data[0].trim() : "";

    console.log(
      `[transcribe] Success in ${elapsedMs}ms — "${text.substring(0, 80)}…"`
    );

    return NextResponse.json({
      text,
      model: MODEL_LABEL,
      language: "en",
      duration_sec: null,
      processing_time_ms: elapsedMs,
    });
  } catch (err: unknown) {
    console.error("[transcribe] Error:", err);

    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    // Space is sleeping / loading
    if (
      message.includes("loading") ||
      message.includes("503") ||
      message.includes("sleeping")
    ) {
      return NextResponse.json(
        {
          error:
            "The Whisper Space is waking up. Please wait ~30 seconds and try again.",
        },
        { status: 503 }
      );
    }

    // Queue full / rate limit
    if (
      message.includes("queue") ||
      message.includes("rate limit") ||
      message.includes("429")
    ) {
      return NextResponse.json(
        { error: "The Space is busy. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
