"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";

interface PipelineTimelineProps {
  currentStep?: "idle" | "stt" | "done";
}

export default function PipelineTimeline({ currentStep = "idle" }: PipelineTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showTunisianModal, setShowTunisianModal] = useState(false);

  const steps = [
    {
      id: "stt",
      label: "STT ",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" fill="currentColor" opacity={0.2} />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5m10 0H7m5 5v3" />
        </svg>
      ),
      description: "Whisper transcribes speech to text in English",
      active: currentStep === "stt" || currentStep === "done",
      future: false,
    },
    {
      id: "understand",
      label: "Understanding",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      ),
      description: "Intent & context extraction (future feature)",
      active: false,
      future: true,
    },
    {
      id: "response",
      label: "Response",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ),
      description: "Compose helpful response (future feature)",
      active: false,
      future: true,
    },
    {
      id: "tts",
      label: "TTS",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      ),
      description: "Browser TTS reads back the transcription",
      active: currentStep === "done",
      future: false,
    },
  ];

  return (
    <>
      <div className="w-full space-y-3">
        {/* Top row: English pipeline chips */}


        {/* Tunisian Dialog Pipeline — Coming Soon card */}
        <div
          className="rounded-2xl p-4 md:p-5"
          style={{
            background: "linear-gradient(135deg, var(--glass-bg-strong), var(--glass-bg))",
            border: "1px solid var(--glass-border)",
          }}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Tunisian Dialog Pipeline (Coming Soon)
                </p>
                {/* Info button */}
                <button
                  type="button"
                  onClick={() => setShowTunisianModal(true)}
                  className="flex-shrink-0 rounded-full p-1 transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: "rgba(var(--accent), 0.1)",
                    color: "rgb(var(--accent))",
                  }}
                  aria-label="More info about Tunisian Dialog Pipeline"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                After supervisor validation, we will enable the full dialog agent pipeline for Tunisian Arabic:
                transcribe → understand → prepare a response → speak back.
              </p>
            </div>

            <span
              className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(255,165,0,0.10)", color: "rgb(255,165,0)", border: "1px solid rgba(255,165,0,0.25)" }}
            >
              Coming Soon
            </span>
          </div>

          {/* 4 pipeline cards */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { title: "STT", subtitle: "Tunisian Speech → Text", note: "Whisper fine-tuned on Tunisian dialect" },
              { title: "Understanding", subtitle: "Intent & entities", note: "Detect intent, context, urgency" },
              { title: "Response", subtitle: "Compose reply", note: "Rules / Knowledge base + LLM" },
              { title: "TTS", subtitle: "Text → Voice", note: "Generate natural voice response" },
            ].map((card, i) => (
              <div
                key={card.title}
                className="rounded-2xl p-3 transition-all"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  opacity: 0.8,
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold tracking-wide" style={{ color: "var(--text-primary)" }}>
                    {card.title}
                  </p>
                  <svg className="h-4 w-4 opacity-50" fill="currentColor" viewBox="0 0 20 20" style={{ color: "var(--text-muted)" }}>
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--text-secondary)" }}>
                  {card.subtitle}
                </p>
                <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {card.note}
                </p>

                {/* Arrow between cards on desktop */}
                {i < 3 && (
                  <div className="hidden sm:flex justify-end mt-3">
                    <svg className="h-4 w-4 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--text-muted)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Modal — rendered via portal above everything */}
      {typeof document !== "undefined" && showTunisianModal && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 99999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
          onClick={() => setShowTunisianModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-scale-in"
            style={{ border: "1px solid var(--glass-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient top bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-blue)), rgb(var(--accent)))" }}
            />

            <div className="p-6 md:p-8" style={{ background: "var(--bg-secondary)" }}>
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowTunisianModal(false)}
                className="absolute top-4 right-4 rounded-full p-1.5 transition-all hover:scale-110 active:scale-95"
                style={{ background: "var(--glass-bg-strong)", color: "var(--text-muted)" }}
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="text-center space-y-3">
                <div
                  className="inline-flex items-center justify-center h-12 w-12 rounded-2xl mx-auto"
                  style={{
                    background: "linear-gradient(135deg, rgba(var(--accent), 0.15), rgba(var(--accent-blue), 0.15))",
                    border: "1px solid rgba(var(--accent), 0.2)",
                  }}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "rgb(var(--accent))" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                    Tunisian Dialog Agent
                  </h3>
                  <span
                    className="inline-block mt-1 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: "rgba(255,165,0,0.12)", color: "rgb(245,158,11)", border: "1px solid rgba(255,165,0,0.2)" }}
                  >
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
                  This mode is locked for now. We will enable the full Tunisian dialog pipeline:
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}> STT → Understanding → Response → TTS</span>.
                  We are still working on it.
                </p>
              </div>

              {/* Pipeline steps mini-preview */}
              <div className="mt-5 flex items-center justify-center gap-1.5 flex-wrap">
                {["STT", "Understanding", "Response", "TTS"].map((s, i) => (
                  <React.Fragment key={s}>
                    <span
                      className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                      style={{
                        background: "var(--glass-bg-strong)",
                        border: "1px solid var(--glass-border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {s}
                    </span>
                    {i < 3 && (
                      <svg className="h-3 w-3 flex-shrink-0 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--text-muted)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Feature list */}
              <div
                className="mt-5 rounded-2xl p-4 space-y-2.5"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
              >
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>What will be added:</p>
                {[
                  { icon: "🎤", text: "Fine-tuned Tunisian STT model (dialect + code-switch)" },
                  { icon: "🧠", text: "Intent detection + entity extraction for call scenarios" },
                  { icon: "💬", text: "Response generation using rules / knowledge base" },
                  { icon: "🔊", text: "TTS voice output for a complete conversational demo" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-2.5">
                    <span className="text-sm leading-none mt-0.5">{item.icon}</span>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowTunisianModal(false)}
                className="mt-6 w-full rounded-xl py-2.5 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-blue)))",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(var(--accent), 0.3)",
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
