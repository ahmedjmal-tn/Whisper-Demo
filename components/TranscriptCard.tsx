"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface TranscriptResult {
  text: string;
  model: string;
  language: string;
  duration_sec?: number | null;
  processing_time_ms?: number;
}

interface TranscriptCardProps {
  result: TranscriptResult;
  fileName?: string;
}

export default function TranscriptCard({ result, fileName }: TranscriptCardProps) {
  const [editedText, setEditedText] = useState(result.text);
  const [isEditing, setIsEditing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedText(result.text);
    setIsEditing(false);
  }, [result.text]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.speechSynthesis) {
      setTtsSupported(false);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editedText, isEditing]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = editedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [editedText]);

  const handleDownloadJSON = useCallback(() => {
    const payload = {
      filename: fileName || "unknown",
      transcription: editedText,
      model: result.model,
      language: result.language,
      duration_sec: result.duration_sec ?? "N/A",
      processing_time_ms: result.processing_time_ms ?? "N/A",
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editedText, fileName, result]);

  const handlePlayTTS = useCallback(() => {
    if (!ttsSupported || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(editedText);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    // Try to find an English voice
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.localService
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [editedText, ttsSupported]);

  const handleStopTTS = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Transcription Result
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="rounded-md bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
              {result.model}
            </span>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
              {result.language.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Metadata row */}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>
            Duration: {result.duration_sec != null ? `${result.duration_sec.toFixed(1)}s` : "N/A"}
          </span>
          <span>
            Processing: {result.processing_time_ms ? `${(result.processing_time_ms / 1000).toFixed(1)}s` : "N/A"}
          </span>
          <span>Confidence: N/A</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Text area */}
        {isEditing ? (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Edit transcription before TTS playback
            </label>
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Done editing
              </button>
              <button
                onClick={() => {
                  setEditedText(result.text);
                  setIsEditing(false);
                }}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="cursor-text rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-800 hover:bg-gray-100 transition-colors"
            title="Click to edit"
          >
            {editedText || (
              <span className="italic text-gray-400">No transcription text.</span>
            )}
            <p className="mt-2 text-xs text-gray-400">Click to edit text</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {/* Play TTS */}
          {ttsSupported ? (
            !isSpeaking ? (
              <button
                onClick={handlePlayTTS}
                disabled={!editedText}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Play TTS
              </button>
            ) : (
              <button
                onClick={handleStopTTS}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
                Stop TTS
              </button>
            )
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
              Text-to-Speech not supported in this browser. Try Chrome or Edge.
            </div>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                  />
                </svg>
                Copy
              </>
            )}
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}
