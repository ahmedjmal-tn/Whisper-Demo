"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

type VoiceMode = "natural" | "browser";

interface VoicePanelProps {
  text: string;
}

export default function VoicePanel({ text }: VoicePanelProps) {
  // Mode
  const [mode, setMode] = useState<VoiceMode>("natural");

  // Browser TTS state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);

  // Natural AI TTS state
  const [isGenerating, setIsGenerating] = useState(false);
  const [naturalAudioUrl, setNaturalAudioUrl] = useState<string | null>(null);
  const [naturalError, setNaturalError] = useState<string | null>(null);
  const naturalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isNaturalPlaying, setIsNaturalPlaying] = useState(false);

  const eqRef = useRef<HTMLDivElement>(null);

  // Load browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setTtsSupported(false);
      return;
    }

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      const en = all.filter((v) => v.lang.startsWith("en"));
      setVoices(en.length > 0 ? en : all);
      if (en.length > 0 && !selectedVoiceUri) {
        const local = en.find((v) => v.localService);
        setSelectedVoiceUri((local || en[0]).voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup natural audio URL on unmount
  useEffect(() => {
    return () => {
      if (naturalAudioUrl) URL.revokeObjectURL(naturalAudioUrl);
    };
  }, [naturalAudioUrl]);

  // Clear generated audio when text changes
  useEffect(() => {
    if (naturalAudioUrl) {
      URL.revokeObjectURL(naturalAudioUrl);
      setNaturalAudioUrl(null);
    }
    setNaturalError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // ─── Natural Voice (AI) ───────────────────────────────
  const handleNaturalPlay = useCallback(async () => {
    if (!text) return;

    // If we already have audio, just play it
    if (naturalAudioUrl && naturalAudioRef.current) {
      naturalAudioRef.current.currentTime = 0;
      naturalAudioRef.current.play();
      return;
    }

    setIsGenerating(true);
    setNaturalError(null);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "TTS generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setNaturalAudioUrl(url);

      // Play immediately
      const audio = new Audio(url);
      naturalAudioRef.current = audio;
      audio.onplay = () => setIsNaturalPlaying(true);
      audio.onended = () => setIsNaturalPlaying(false);
      audio.onpause = () => setIsNaturalPlaying(false);
      audio.onerror = () => { setIsNaturalPlaying(false); setNaturalError("Audio playback failed"); };
      audio.play();
    } catch (err) {
      setNaturalError(err instanceof Error ? err.message : "Failed to generate voice");
    } finally {
      setIsGenerating(false);
    }
  }, [text, naturalAudioUrl]);

  const handleNaturalStop = useCallback(() => {
    if (naturalAudioRef.current) {
      naturalAudioRef.current.pause();
      naturalAudioRef.current.currentTime = 0;
    }
    setIsNaturalPlaying(false);
  }, []);

  // ─── Browser Voice ────────────────────────────────────
  const handleBrowserPlay = useCallback(() => {
    if (!ttsSupported || !text) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voice = voices.find((v) => v.voiceURI === selectedVoiceUri);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };

    window.speechSynthesis.speak(utterance);
  }, [text, ttsSupported, isPaused, rate, pitch, voices, selectedVoiceUri]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  }, []);

  const handleBrowserStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  // Stop everything when switching modes
  const switchMode = useCallback((newMode: VoiceMode) => {
    handleBrowserStop();
    handleNaturalStop();
    setMode(newMode);
  }, [handleBrowserStop, handleNaturalStop]);

  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const estimatedSec = wordCount > 0 ? Math.round((wordCount / (150 * rate)) * 60) : 0;
  const isAnySpeaking = isSpeaking || isNaturalPlaying;

  return (
    <div className="panel-card p-5 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
          <svg className="h-3.5 w-3.5" style={{ color: "rgb(34, 197, 94)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Voice (TTS)</h2>
      </div>

      
      



      {/* ─── Browser Mode ────────────────────────────── */}
      {mode === "browser" && (
        <>
          {!ttsSupported ? (
            <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}>
              Text-to-Speech not supported in this browser. Try Chrome or Edge.
            </div>
          ) : (
            <>
              {/* Voice selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Browser Voice
                </label>
                <select
                  value={selectedVoiceUri}
                  onChange={(e) => setSelectedVoiceUri(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}){v.localService ? " — Local" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Rate</label>
                  <span className="text-[10px] font-mono font-bold" style={{ color: "var(--text-secondary)" }}>{rate.toFixed(1)}×</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} aria-label="Speech rate" />
              </div>

              {/* Pitch slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Pitch</label>
                  <span className="text-[10px] font-mono font-bold" style={{ color: "var(--text-secondary)" }}>{pitch.toFixed(1)}</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} aria-label="Speech pitch" />
              </div>

              {/* Play / Pause / Stop */}
              <div className="flex gap-2">
                {!isSpeaking && !isPaused ? (
                  <button
                    onClick={handleBrowserPlay}
                    disabled={!text}
                    className="btn-primary flex-1 !text-xs"
                    style={{ background: "linear-gradient(135deg, rgb(99, 102, 241), rgb(79, 70, 229))", boxShadow: "0 4px 16px rgba(99, 102, 241, 0.25)" }}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play
                  </button>
                ) : (
                  <>
                    {isSpeaking ? (
                      <button onClick={handlePause} className="btn-secondary flex-1 !text-xs">Pause</button>
                    ) : (
                      <button onClick={handleBrowserPlay} className="btn-primary flex-1 !text-xs" style={{ background: "linear-gradient(135deg, rgb(99,102,241), rgb(79,70,229))" }}>Resume</button>
                    )}
                    <button onClick={handleBrowserStop} className="btn-secondary !text-xs !px-3">Stop</button>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Equalizer animation (both modes) */}
      {isAnySpeaking && (
        <div ref={eqRef} className="flex items-end justify-center gap-1 h-8 animate-fade-in">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full"
              style={{
                background: mode === "natural"
                  ? "linear-gradient(to top, rgb(34, 197, 94), rgb(16, 185, 129))"
                  : "linear-gradient(to top, rgb(99, 102, 241), rgb(79, 70, 229))",
                animation: `eq-bar ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--eq-h" as any]: `${8 + Math.random() * 20}px`,
                height: "4px",
              }}
            />
          ))}
        </div>
      )}

      {/* Playback Info */}
      <div className="rounded-xl p-3 space-y-1" style={{ background: "var(--bg-tertiary)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Playback Info
        </p>
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>Words: {wordCount}</span>
          <span>Est. duration: ~{estimatedSec}s</span>
        </div>
      </div>

      {/* Empty state */}
      {!text && (
        <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
          <div className="rounded-full p-3 mb-2" style={{ background: "var(--bg-tertiary)" }}>
            <svg className="h-5 w-5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Transcribe audio to enable TTS</p>
        </div>
      )}
    </div>
  );
}
