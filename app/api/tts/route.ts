import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tts
 * Converts text to natural-sounding speech using Hugging Face Inference API.
 * Tries multiple TTS models in order until one works.
 */

const DEFAULT_MODELS = [
  "facebook/fastspeech2-en-ljspeech",
  "espnet/kan-bayashi_ljspeech_vits",
];

const ENV_MODELS = (process.env.HF_TTS_MODELS || "")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const MODELS = ENV_MODELS.length > 0 ? ENV_MODELS : DEFAULT_MODELS;
const HF_TTS_BASE_URL = (process.env.HF_TTS_BASE_URL || "https://api-inference.huggingface.co/models")
  .replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Text too long. Maximum 2000 characters." },
        { status: 400 }
      );
    }

    const token = process.env.HF_ACCESS_TOKEN;

    // Try each model until one works
    let lastError = "";
    for (const model of MODELS) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const inputField = HF_TTS_BASE_URL.includes("router.huggingface.co")
          ? "text_inputs"
          : "inputs";

        const response = await fetch(`${HF_TTS_BASE_URL}/${model}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ [inputField]: text }),
        });

        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";
          let errText = "";
          if (contentType.includes("application/json")) {
            try {
              const errJson = await response.json();
              errText =
                typeof errJson?.error === "string"
                  ? errJson.error
                  : JSON.stringify(errJson);
            } catch {
              errText = "Unknown error";
            }
          } else {
            errText = await response.text();
          }
          // If model is loading, try next
          if (response.status === 503) {
            lastError = `Model ${model} is loading. Please try again in a few seconds.`;
            continue;
          }
          if (response.status === 404) {
            lastError = `Model ${model} not found on the Hugging Face Inference API.`;
            continue;
          }
          // If auth fails, try without token
          if (response.status === 401 || response.status === 403) {
            const retryRes = await fetch(
              `${HF_TTS_BASE_URL}/${model}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [inputField]: text }),
              }
            );
            if (retryRes.ok) {
              const audioBuffer = await retryRes.arrayBuffer();
              return new NextResponse(audioBuffer, {
                status: 200,
                headers: {
                  "Content-Type": retryRes.headers.get("content-type") || "audio/flac",
                  "Cache-Control": "no-store",
                },
              });
            }
            lastError = `Auth failed for ${model}: ${errText}`;
            continue;
          }
          lastError = `${model} error: ${errText}`;
          continue;
        }

        // Success — return audio binary
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": response.headers.get("content-type") || "audio/flac",
            "Cache-Control": "no-store",
          },
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Unknown error";
        continue;
      }
    }

    return NextResponse.json(
      { error: lastError || "All TTS models failed. Please try again." },
      { status: 503 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
