"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import AudioPanel from "@/components/AudioPanel";
import TranscriptPanel from "@/components/TranscriptPanel";
import VoicePanel from "@/components/VoicePanel";
import PipelineTimeline from "@/components/PipelineTimeline";
import PrivacyModal from "@/components/PrivacyModal";

interface TranscriptResult {
  text: string;
  model: string;
  language: string;
  duration_sec?: number | null;
  processing_time_ms?: number;
}

type TranscribeStep = "idle" | "uploading" | "transcribing" | "done" | "error";

export default function Home() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("recording.webm");

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStep, setTranscribeStep] = useState<TranscribeStep>("idle");
  const [transcriptResult, setTranscriptResult] = useState<TranscriptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [mobileTab, setMobileTab] = useState<"audio" | "transcript" | "voice">("audio");

  const resultRef = useRef<HTMLDivElement>(null);

  // Initialize dark mode from localStorage / system
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  }, []);

  const handleAudioReady = useCallback((blob: Blob, name: string) => {
    if (blob instanceof File) {
      setAudioFile(blob);
      setAudioBlob(null);
    } else {
      setAudioBlob(blob);
      setAudioFile(null);
    }
    setFileName(name);
    setError(null);
    setTranscriptResult(null);
    setTranscribeStep("idle");
  }, []);

  const handleTranscribe = useCallback(async () => {
    const source = audioFile || audioBlob;
    if (!source) {
      setError("No audio available. Please record or upload a file first.");
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setTranscriptResult(null);
    setTranscribeStep("uploading");

    try {
      const formData = new FormData();
      if (audioFile) {
        formData.append("file", audioFile);
      } else if (audioBlob) {
        formData.append("file", audioBlob, fileName);
      }

      setTranscribeStep("transcribing");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      setTranscriptResult(data as TranscriptResult);
      setTranscribeStep("done");

      // On mobile, switch to transcript tab
      setMobileTab("transcript");

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setTranscribeStep("error");
    } finally {
      setIsTranscribing(false);
    }
  }, [audioFile, audioBlob, fileName]);

  const hasAudio = !!audioFile || !!audioBlob;
  const pipelineStep = transcribeStep === "done" ? "done" : isTranscribing ? "stt" : "idle";

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* ── Background Orbs ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-float-slow absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full blur-[120px]" style={{ background: `rgba(var(--accent), var(--orb-opacity))` }} />
        <div className="animate-float-medium absolute top-1/3 -right-24 h-[350px] w-[350px] rounded-full blur-[100px]" style={{ background: `rgba(var(--accent-blue), var(--orb-opacity))` }} />
        <div className="animate-float-slow absolute -bottom-16 left-1/3 h-[300px] w-[300px] rounded-full blur-[100px]" style={{ background: `rgba(var(--accent), calc(var(--orb-opacity) * 0.6))` }} />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(128,128,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="relative z-10 glass" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Left: title + badge */}
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Whisper Demo{" "}
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">(English)</span>
            </h1>
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "rgba(var(--accent), 0.1)", color: "rgb(var(--accent))" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "rgb(var(--accent))" }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "rgb(var(--accent))" }} />
              </span>
              Powered by Whisper
            </span>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="rounded-lg p-2 transition-colors"
              style={{ color: "var(--text-muted)" }}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 006.002-2.248z" />
                </svg>
              )}
            </button>

            {/* Privacy / About */}
            <button
              onClick={() => setShowPrivacy(true)}
              className="rounded-lg p-2 transition-colors"
              style={{ color: "var(--text-muted)" }}
              aria-label="About and Privacy"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Pipeline ────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 pt-4">
        <PipelineTimeline currentStep={pipelineStep} />
      </div>

      {/* ── Mobile Tab Nav ──────────────────────────────────── */}
      <div className="relative z-10 lg:hidden mx-auto w-full max-w-[1400px] px-4 sm:px-6 pt-4">
        <div className="flex gap-1 rounded-xl p-1 glass-strong">
          {(["audio", "transcript", "voice"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all ${
                mobileTab === tab ? "text-white" : ""
              }`}
              style={
                mobileTab === tab
                  ? { background: "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-blue)))" }
                  : { color: "var(--text-muted)" }
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main 3-Column Layout ────────────────────────────── */}
      <main className="relative z-10 flex-1">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-5">
          <div ref={resultRef} className="grid gap-4 lg:grid-cols-[28%_44%_28%]">
            {/* Left: Audio Panel */}
            <div className={`${mobileTab !== "audio" ? "hidden lg:block" : ""}`}>
              <AudioPanel onAudioReady={handleAudioReady} disabled={isTranscribing} />
            </div>

            {/* Center: Transcript Panel */}
            <div className={`${mobileTab !== "transcript" ? "hidden lg:block" : ""}`}>
              <TranscriptPanel
                hasAudio={hasAudio}
                isTranscribing={isTranscribing}
                transcribeStep={transcribeStep}
                result={transcriptResult}
                error={error}
                fileName={fileName}
                onTranscribe={handleTranscribe}
              />
            </div>

            {/* Right: Voice Panel */}
            <div className={`${mobileTab !== "voice" ? "hidden lg:block" : ""}`}>
              <VoicePanel text={transcriptResult?.text || ""} />
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-transparent" style={{ ["--tw-gradient-to" as string]: "rgba(var(--accent), 0.3)" }} />
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              Built by students of the{" "}
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-bold">
                International Institute of Technology (IIT), Sfax
              </span>
            </p>
            <div className="h-px w-10 bg-gradient-to-l from-transparent" style={{ ["--tw-gradient-to" as string]: "rgba(var(--accent-blue), 0.3)" }} />
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Demo for Speech-to-Text and Text-to-Speech (English). Tunisian mode will be enabled after validation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {["Next.js", "Whisper Large V3 Turbo", "Hugging Face", "Web Speech API"].map((t) => (
              <span
                key={t}
                className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{ background: "var(--glass-bg-strong)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Privacy Modal ───────────────────────────────────── */}
      <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}
