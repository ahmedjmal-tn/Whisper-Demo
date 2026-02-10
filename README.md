# Whisper Demo (English)

> **Production demo** — Speech-to-Text (STT) using Whisper (Hugging Face) + browser Text-to-Speech (TTS).  
> English only. Ready for supervisor review.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your Hugging Face Access Token

Get a free token at [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

Create a `.env.local` file in the project root:

```env
HF_ACCESS_TOKEN=hf_your-token-here
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production (optional)

```bash
npm run build
npm run start
```

---

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import it on [vercel.com](https://vercel.com).
3. Add the environment variable `HF_ACCESS_TOKEN` in Vercel project settings.
4. Deploy — done.

---

## Tech Stack

| Layer     | Technology                                |
| --------- | ----------------------------------------- |
| Framework | Next.js 14 (App Router)                   |
| Language  | TypeScript                                |
| Styling   | TailwindCSS 3                             |
| STT       | Whisper large-v3 via Hugging Face Inference API |
| TTS       | Browser Web Speech API (`speechSynthesis`)|
| Hosting   | Vercel (serverless-compatible)            |

---

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page (client component)
│   ├── globals.css         # Tailwind + custom styles
│   └── api/
│       └── transcribe/
│           └── route.ts    # POST endpoint for Whisper
├── components/
│   ├── Recorder.tsx        # Mic recording with MediaRecorder API
│   ├── Uploader.tsx        # Drag & drop file upload
│   └── TranscriptCard.tsx  # Result display + TTS + copy + JSON export
├── lib/
│   └── validators.ts       # File type/size validation (client + server)
├── .env.local.example      # API key template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Features

- **Record** — Use your microphone directly in the browser
- **Upload** — Drag & drop or browse for MP3, WAV, M4A, WebM, or OGG files (max 25 MB)
- **Transcribe (English)** — Sends audio to Whisper (openai/whisper-large-v3) via Hugging Face Inference API
- **Play TTS** — Reads the transcription aloud using the browser's Speech Synthesis
- **Edit text** — Click the transcription text to edit it before TTS playback
- **Copy** — One-click copy to clipboard
- **Download JSON** — Exports transcription data as a structured JSON file
- **Rate limiting** — Basic in-memory rate limiter on the API (10 req/min per IP)
- **File validation** — Client + server-side type and size checks
- **Tunisian Mode placeholder** — Disabled toggle with "Coming Soon" note

---

## Demo Script (for Supervisor Review)

Follow these steps to demonstrate the application:

### Step 1: Open the App
- Navigate to `http://localhost:3000` (or the deployed Vercel URL)
- Observe the professional header: **"Whisper Demo (English)"**

### Step 2: Record Audio
1. Click the **"Record"** tab (selected by default)
2. Click **"Record audio"** — allow microphone access when prompted
3. Speak a few sentences in English (e.g., "Hello, this is a demo of the Whisper speech-to-text system.")
4. Click **"Stop recording"**
5. Use the audio player to replay your recording

### Step 3: Transcribe
1. Click **"Transcribe (English)"**
2. Wait for the loading indicator to finish (typically 2–5 seconds)
3. The transcription card appears with:
   - Full text
   - Model info (`whisper-1`), language (`EN`), duration, processing time
   - Confidence: N/A (Whisper API does not return per-segment confidence)

### Step 4: Play TTS
1. Click **"Play TTS"** to hear the transcription read aloud
2. Click the transcription text to edit it, then click **"Play TTS"** again

### Step 5: Export
1. Click **"Copy"** to copy text to clipboard
2. Click **"Download JSON"** to save a structured JSON file with all metadata

### Step 6: Upload Mode
1. Switch to the **"Upload"** tab
2. Drag & drop an audio file (or click to browse)
3. Repeat Steps 3–5

### Step 7: Show Tunisian Mode Placeholder
- Scroll down to the **"Future: Tunisian Mode (Coming Soon)"** section
- Note the disabled toggle and explanation text
- Explain: "Tunisian Arabic support will be enabled after this English validation phase"

---

## API Endpoint

### `POST /api/transcribe`

**Request:** `multipart/form-data` with field `file` (audio file)

**Response:**
```json
{
  "text": "Hello, this is a test.",
  "model": "openai/whisper-large-v3",
  "language": "en",
  "duration_sec": null,
  "processing_time_ms": 1842
}
```

**Error response:**
```json
{
  "error": "Description of what went wrong."
}
```

---

## Security Notes

- HF token is **never** sent to the client — only used server-side
- File type and size validated on both client and server
- Basic rate limiting: 10 requests/minute per IP
- No database — fully stateless

---

## License

Internal demo — not for redistribution.
