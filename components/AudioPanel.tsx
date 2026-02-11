"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  validateAudioFile,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_LABEL,
} from "@/lib/validators";
import { analyzeAudio, getWaveformData, type AudioMetrics } from "@/lib/audioMetrics";
import Waveform from "@/components/Waveform";

type SubTab = "record" | "upload" | "samples";

interface AudioPanelProps {
  onAudioReady: (blob: Blob, fileName: string) => void;
  disabled?: boolean;
}

// Sample audio entries (public domain / CC0)
const SAMPLE_AUDIOS = [
  { id: "sample1", label: "Hello World", desc: "Short greeting", url: "" },
  { id: "sample2", label: "News Clip", desc: "Broadcast excerpt", url: "" },
  { id: "sample3", label: "Dictation", desc: "Clear speech", url: "" },
];

export default function AudioPanel({ onAudioReady, disabled }: AudioPanelProps) {
  const [subTab, setSubTab] = useState<SubTab>("record");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Metrics & waveform
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null);
  const [waveData, setWaveData] = useState<number[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Analyze audio helper ───
  const analyzeBlob = useCallback(async (blob: Blob) => {
    try {
      const [m, w] = await Promise.all([analyzeAudio(blob), getWaveformData(blob)]);
      setMetrics(m);
      setWaveData(w);
    } catch {
      // Silently fail metrics
    }
  }, []);

  // ─── Recording ───
  const startRecording = useCallback(async () => {
    setRecError(null);
    setPermissionDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "m4a";
        const fileName = `recording_${Date.now()}.${ext}`;

        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        onAudioReady(blob, fileName);
        analyzeBlob(blob);

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setSeconds(0);
      setAudioUrl(null);
      setAudioBlob(null);
      setMetrics(null);
      setWaveData([]);

      timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
      ) {
        setPermissionDenied(true);
        setRecError("Microphone access denied. Please allow microphone access in your browser settings.");
      } else {
        setRecError("Could not access microphone. Please check your device.");
      }
    }
  }, [audioUrl, onAudioReady, analyzeBlob]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // ─── Upload handlers ───
  const handleFile = useCallback(
    (file: File) => {
      setUploadError(null);
      const result = validateAudioFile(file);
      if (!result.valid) {
        setUploadError(result.error!);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      onAudioReady(file, file.name);

      // Analyze
      const blob = new Blob([file], { type: file.type });
      analyzeBlob(blob);
    },
    [onAudioReady, analyzeBlob]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      const files = e.dataTransfer.files;
      if (files && files.length > 0) handleFile(files[0]);
    },
    [disabled, handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleFile(files[0]);
      e.target.value = "";
    },
    [handleFile]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="panel-card p-5 space-y-4 h-full flex flex-col">
      {/* Panel title */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(var(--accent), 0.1)" }}>
          <svg className="h-3.5 w-3.5" style={{ color: "rgb(var(--accent))" }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Audio</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--bg-tertiary)" }}>
        {(["record", "upload"] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold capitalize transition-all duration-200 ${
              subTab === tab ? "text-white shadow-sm" : ""
            }`}
            style={
              subTab === tab
                ? { background: "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-blue)))" }
                : { color: "var(--text-muted)" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 space-y-3 min-h-0">
        {/* ─── RECORD ─── */}
        {subTab === "record" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={disabled}
                  className="btn-primary !rounded-full !p-0 h-12 w-12 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  aria-label="Start recording"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="btn-primary !rounded-full !p-0 h-12 w-12 flex-shrink-0"
                  style={{ background: "var(--text-primary)" }}
                  aria-label="Stop recording"
                >
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-recording-pulse" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-sm bg-red-500" />
                  </span>
                </button>
              )}
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {isRecording ? "Recording…" : "Tap to record"}
                </p>
                {isRecording && (
                  <p className="font-mono text-lg font-bold" style={{ color: "rgb(239, 68, 68)" }}>
                    {formatTime(seconds)}
                  </p>
                )}
              </div>
            </div>

            {/* Live waveform during recording */}
            {isRecording && (
              <div className="flex items-center justify-center gap-0.5 rounded-xl p-4" style={{ background: "var(--bg-tertiary)" }}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full"
                    style={{
                      background: "rgb(239, 68, 68)",
                      height: `${8 + Math.random() * 24}px`,
                      animation: `soundwave ${0.4 + Math.random() * 0.8}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.04}s`,
                      opacity: 0.6 + Math.random() * 0.4,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Audio preview */}
            {audioUrl && !isRecording && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg-tertiary)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Recorded Preview
                </p>
                <audio controls src={audioUrl} className="w-full h-8" />
              </div>
            )}

            {recError && (
              <div className="rounded-lg p-3 text-xs glow-red" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
                {recError}
                {permissionDenied && (
                  <p className="mt-1 opacity-80">Tip: Click the lock icon in your browser address bar to manage permissions.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── UPLOAD ─── */}
        {subTab === "upload" && (
          <div className="space-y-3 animate-fade-in">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !disabled && inputRef.current?.click()}
              className="relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200"
              style={{
                borderColor: dragActive ? "rgb(var(--accent))" : "var(--border)",
                background: dragActive ? "rgba(var(--accent), 0.05)" : "transparent",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.webm,.ogg,audio/*"
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
              />
              <div className="flex flex-col items-center gap-2">
                <div
                  className="rounded-full p-2.5"
                  style={{ background: dragActive ? "rgba(var(--accent), 0.15)" : "var(--bg-tertiary)" }}
                >
                  <svg className="h-6 w-6" style={{ color: dragActive ? "rgb(var(--accent))" : "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    {dragActive ? "Drop here" : "Upload audio"}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Drag & drop or click
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {ALLOWED_EXTENSIONS.map((ext) => (
                    <span
                      key={ext}
                      className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                    >
                      {ext.toUpperCase().replace(".", "")}
                    </span>
                  ))}
                </div>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Max: {MAX_FILE_SIZE_LABEL}</p>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2.5 rounded-xl p-3" style={{ background: "var(--bg-tertiary)" }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(var(--accent), 0.1)" }}>
                  <svg className="h-4 w-4" style={{ color: "rgb(var(--accent))" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>{selectedFile.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); setMetrics(null); setWaveData([]); }}
                  className="rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Remove file"
                >
                  <svg className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {uploadError && (
              <div className="rounded-lg p-3 text-xs" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
                {uploadError}
              </div>
            )}
          </div>
        )}

        
      </div>

      {/* ─── Waveform & Metrics ─── */}
      {waveData.length > 0 && (
        <div className="space-y-2 rounded-xl p-3" style={{ background: "var(--bg-tertiary)" }}>
          <Waveform data={waveData} height={48} />
          {metrics && (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(var(--accent), 0.1)", color: "rgb(var(--accent))" }}>
                {metrics.duration.toFixed(1)}s
              </span>
              <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(var(--accent-blue), 0.1)", color: "rgb(var(--accent-blue))" }}>
                {metrics.rmsDb > -Infinity ? `${metrics.rmsDb} dB` : "— dB"}
              </span>
              {metrics.clipping && (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                  ⚠ Clipping
                </span>
              )}
              <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--glass-bg-strong)", color: "var(--text-muted)" }}>
                {metrics.sampleRate / 1000}kHz
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
