/**
 * Audio metrics: duration, loudness (RMS dB), clipping detection.
 * Uses Web Audio API — runs client-side only.
 */

export interface AudioMetrics {
  duration: number;       // seconds
  rmsDb: number;          // RMS loudness in dB
  peak: number;           // 0..1
  clipping: boolean;      // peak >= 0.99
  sampleRate: number;
  channels: number;
}

/**
 * Analyze an audio blob and return metrics.
 */
export async function analyzeAudio(blob: Blob): Promise<AudioMetrics> {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      sumSquares += channelData[i] * channelData[i];
      if (abs > peak) peak = abs;
    }

    const rms = Math.sqrt(sumSquares / channelData.length);
    const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

    return {
      duration: audioBuffer.duration,
      rmsDb: Math.round(rmsDb * 10) / 10,
      peak: Math.round(peak * 1000) / 1000,
      clipping: peak >= 0.99,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
    };
  } finally {
    await ctx.close();
  }
}

/**
 * Get the raw samples (mono, downsampled) for waveform rendering.
 */
export async function getWaveformData(
  blob: Blob,
  targetSamples = 200
): Promise<number[]> {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);

    const blockSize = Math.floor(channelData.length / targetSamples);
    const samples: number[] = [];

    for (let i = 0; i < targetSamples; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j] || 0);
      }
      samples.push(sum / blockSize);
    }

    // Normalize to 0..1
    const max = Math.max(...samples, 0.001);
    return samples.map((s) => s / max);
  } finally {
    await ctx.close();
  }
}
