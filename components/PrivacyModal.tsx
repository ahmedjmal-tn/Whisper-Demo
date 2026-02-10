"use client";

import React, { useState, useEffect, useRef } from "react";

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  const [visible, setVisible] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!visible && !open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        open ? "bg-black/40 backdrop-blur-sm opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="About and Privacy"
    >
      <div
        className={`w-full max-w-lg panel-card p-6 space-y-5 transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            About & Privacy
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              What is this?
            </h3>
            <p>
              A demo application for English Speech-to-Text using OpenAI&apos;s Whisper model
              (via Hugging Face), and Text-to-Speech using the browser&apos;s built-in Web Speech API.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Privacy
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Audio is sent to Hugging Face servers for transcription only.</li>
              <li>No audio or text is stored on any server after processing.</li>
              <li>TTS runs entirely in your browser — no data leaves your device.</li>
              <li>No cookies, no analytics, no tracking.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Credits
            </h3>
            <p>
              Built by students of the <strong>International Institute of Technology (IIT), Sfax</strong>.
              This demo focuses on English. Tunisian Arabic mode will be enabled after supervisor
              validation and model fine-tuning.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {["Next.js 14", "TypeScript", "TailwindCSS", "Whisper Large V3", "Web Speech API", "Gradio"].map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: "rgba(var(--accent), 0.1)", color: "rgb(var(--accent))" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <button onClick={onClose} className="btn-primary w-full">
          Got it
        </button>
      </div>
    </div>
  );
}
