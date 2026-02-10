"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface TranscriptResult {
  text: string;
  model: string;
  language: string;
  duration_sec?: number | null;
  processing_time_ms?: number;
}

type TranscribeStep = "idle" | "uploading" | "transcribing" | "done" | "error";

interface TranscriptPanelProps {
  hasAudio: boolean;
  isTranscribing: boolean;
  transcribeStep: TranscribeStep;
  result: TranscriptResult | null;
  error: string | null;
  fileName: string;
  onTranscribe: () => void;
}

export default function TranscriptPanel({
  hasAudio,
  isTranscribing,
  transcribeStep,
  result,
  error,
  fileName,
  onTranscribe,
}: TranscriptPanelProps) {
  const [editedText, setEditedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (result?.text) {
      setEditedText(result.text);
      setIsEditing(false);
      setShowDiff(false);
    }
  }, [result?.text]);

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editedText, isEditing]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = editedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editedText]);

  const handleDownloadJSON = useCallback(() => {
    const payload = {
      filename: fileName || "unknown",
      transcription: editedText,
      model: result?.model,
      language: result?.language,
      duration_sec: result?.duration_sec ?? "N/A",
      processing_time_ms: result?.processing_time_ms ?? "N/A",
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editedText, fileName, result]);

  // Auto-punctuation heuristic
  const autoPunctuate = useCallback(() => {
    let text = editedText;
    // Capitalize after sentence endings
    text = text.replace(/([.!?])\s+([a-z])/g, (_, p, c) => `${p} ${c.toUpperCase()}`);
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);
    // Add period at end if missing
    if (text.length > 0 && !/[.!?]$/.test(text.trim())) {
      text = text.trim() + ".";
    }
    setEditedText(text);
  }, [editedText]);

  const cleanSpacing = useCallback(() => {
    setEditedText(editedText.replace(/\s+/g, " ").trim());
  }, [editedText]);

  // Progress steps
  const steps: { key: TranscribeStep; label: string }[] = [
    { key: "uploading", label: "Uploading" },
    { key: "transcribing", label: "Transcribing" },
    { key: "done", label: "Done" },
  ];

  const getDiffHighlight = () => {
    if (!result?.text || !showDiff) return null;
    const original = result.text;
    if (editedText === original) return <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>No changes made.</p>;

    return (
      <div className="space-y-1.5 text-xs">
        <div className="rounded-lg p-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}>
          <p className="font-semibold text-[10px] mb-1" style={{ color: "#f87171" }}>Original:</p>
          <p style={{ color: "var(--text-secondary)" }}>{original}</p>
        </div>
        <div className="rounded-lg p-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)" }}>
          <p className="font-semibold text-[10px] mb-1" style={{ color: "#4ade80" }}>Edited:</p>
          <p style={{ color: "var(--text-secondary)" }}>{editedText}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="panel-card p-5 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(var(--accent-blue), 0.1)" }}>
          <svg className="h-3.5 w-3.5" style={{ color: "rgb(var(--accent-blue))" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Transcript</h2>
      </div>

      {/* CTA Button */}
      <button
        onClick={onTranscribe}
        disabled={!hasAudio || isTranscribing}
        className="btn-primary w-full !py-3 !text-sm !font-bold"
      >
        {isTranscribing ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Transcribing…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Transcribe (English)
          </span>
        )}
      </button>

      {/* Progress Steps */}
      {transcribeStep !== "idle" && transcribeStep !== "error" && (
        <div className="flex items-center gap-1 animate-fade-in">
          {steps.map((step, idx) => {
            const stepOrder = ["uploading", "transcribing", "done"];
            const currentIdx = stepOrder.indexOf(transcribeStep);
            const thisIdx = stepOrder.indexOf(step.key);
            const isComplete = thisIdx < currentIdx;
            const isCurrent = thisIdx === currentIdx;

            return (
              <React.Fragment key={step.key}>
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-300"
                    style={{
                      background: isComplete
                        ? "rgb(34, 197, 94)"
                        : isCurrent
                          ? "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-blue)))"
                          : "var(--bg-tertiary)",
                      color: isComplete || isCurrent ? "white" : "var(--text-muted)",
                    }}
                  >
                    {isComplete ? "✓" : idx + 1}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: isCurrent ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-px mx-1" style={{ background: isComplete ? "rgb(34, 197, 94)" : "var(--border)" }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Skeleton Loader */}
      {isTranscribing && !result && (
        <div className="space-y-2 animate-fade-in">
          <div className="h-3 rounded-full w-full" style={{ background: "var(--bg-tertiary)" }}>
            <div className="h-full w-1/2 rounded-full animate-shimmer" style={{ background: "linear-gradient(90deg, transparent, rgba(var(--accent), 0.1), transparent)" }} />
          </div>
          <div className="h-3 rounded-full w-3/4" style={{ background: "var(--bg-tertiary)" }} />
          <div className="h-3 rounded-full w-5/6" style={{ background: "var(--bg-tertiary)" }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-3 text-xs animate-slide-up glow-red" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="font-semibold">Transcription failed</p>
          <p className="mt-1 opacity-80">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex-1 space-y-3 min-h-0 animate-slide-up">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(var(--accent), 0.1)", color: "rgb(var(--accent))" }}>
              {result.model}
            </span>
            <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(var(--accent-blue), 0.1)", color: "rgb(var(--accent-blue))" }}>
              {result.language.toUpperCase()}
            </span>
            {result.processing_time_ms && (
              <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                {(result.processing_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
              Confidence: N/A
            </span>
          </div>

          {/* Text */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full rounded-xl p-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
                rows={4}
              />
              <div className="flex gap-1.5">
                <button onClick={() => setIsEditing(false)} className="btn-primary !text-xs !px-3 !py-1.5">Done</button>
                <button onClick={() => { setEditedText(result.text); setIsEditing(false); }} className="btn-secondary !text-xs !px-3 !py-1.5">Reset</button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="cursor-text rounded-xl p-3 text-sm leading-relaxed transition-all hover:ring-2"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              title="Click to edit"
            >
              {editedText || <span className="italic" style={{ color: "var(--text-muted)" }}>No text.</span>}
              <p className="mt-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>Click to edit</p>
            </div>
          )}

          {/* Edit tools */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={autoPunctuate} className="btn-secondary !text-[10px] !px-2.5 !py-1">Auto Punctuation</button>
            <button onClick={cleanSpacing} className="btn-secondary !text-[10px] !px-2.5 !py-1">Clean Spacing</button>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`btn-secondary !text-[10px] !px-2.5 !py-1 ${showDiff ? "!border-purple-400/40" : ""}`}
              style={showDiff ? { background: "rgba(var(--accent), 0.08)", color: "rgb(var(--accent))" } : {}}
            >
              {showDiff ? "Hide Diff" : "Diff View"}
            </button>
          </div>

          {/* Diff */}
          {showDiff && getDiffHighlight()}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={handleCopy} className="btn-secondary !text-xs">
              {copied ? (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
            <button onClick={handleDownloadJSON} className="btn-secondary !text-xs">
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download JSON
              </span>
            </button>
            <button onClick={() => { setEditedText(""); }} className="btn-secondary !text-xs">Clear</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !isTranscribing && !error && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full p-3 mb-3" style={{ background: "var(--bg-tertiary)" }}>
            <svg className="h-6 w-6" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {hasAudio ? "Ready to transcribe" : "Record or upload audio first"}
          </p>
        </div>
      )}
    </div>
  );
}
