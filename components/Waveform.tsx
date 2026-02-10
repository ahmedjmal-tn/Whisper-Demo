"use client";

import React, { useRef, useEffect } from "react";

interface WaveformProps {
  data: number[];
  isPlaying?: boolean;
  accentColor?: string;
  height?: number;
}

export default function Waveform({
  data,
  isPlaying = false,
  accentColor = "rgb(139, 92, 246)",
  height = 80,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barWidth = Math.max(2, (w / data.length) * 0.6);
    const gap = w / data.length;
    const midY = h / 2;

    ctx.clearRect(0, 0, w, h);

    data.forEach((value, i) => {
      const barH = Math.max(2, value * (h * 0.8));
      const x = i * gap + gap / 2 - barWidth / 2;

      // Gradient per bar
      const gradient = ctx.createLinearGradient(x, midY - barH / 2, x, midY + barH / 2);
      if (isPlaying) {
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.6)");
      } else {
        gradient.addColorStop(0, "rgba(139, 92, 246, 0.5)");
        gradient.addColorStop(1, "rgba(139, 92, 246, 0.15)");
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, midY - barH / 2, barWidth, barH, barWidth / 2);
      ctx.fill();
    });
  }, [data, isPlaying, accentColor, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
      aria-label="Audio waveform visualization"
    />
  );
}
