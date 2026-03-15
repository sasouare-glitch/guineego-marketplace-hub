import { useCallback, useRef } from "react";

export type AlertSoundType = "classic" | "urgent" | "soft" | "radar";

interface AlertSoundOptions {
  volume?: number; // 0-1
  soundType?: AlertSoundType;
  vibrate?: boolean;
}

const DEFAULT_OPTIONS: Required<AlertSoundOptions> = {
  volume: 0.5,
  soundType: "classic",
  vibrate: true,
};

/**
 * Sound patterns definition — each generates a distinct alert via Web Audio API.
 */
const SOUND_PATTERNS: Record<AlertSoundType, { label: string; tones: { freq: number; offset: number; dur: number; wave: OscillatorType }[] }> = {
  classic: {
    label: "Classique",
    tones: [
      { freq: 880, offset: 0, dur: 0.12, wave: "square" },
      { freq: 1100, offset: 0.15, dur: 0.12, wave: "square" },
      { freq: 880, offset: 0.45, dur: 0.12, wave: "square" },
      { freq: 1100, offset: 0.6, dur: 0.12, wave: "square" },
    ],
  },
  urgent: {
    label: "Urgent",
    tones: [
      { freq: 1200, offset: 0, dur: 0.08, wave: "sawtooth" },
      { freq: 1500, offset: 0.1, dur: 0.08, wave: "sawtooth" },
      { freq: 1200, offset: 0.2, dur: 0.08, wave: "sawtooth" },
      { freq: 1500, offset: 0.3, dur: 0.08, wave: "sawtooth" },
      { freq: 1200, offset: 0.5, dur: 0.08, wave: "sawtooth" },
      { freq: 1500, offset: 0.6, dur: 0.08, wave: "sawtooth" },
    ],
  },
  soft: {
    label: "Doux",
    tones: [
      { freq: 523, offset: 0, dur: 0.25, wave: "sine" },
      { freq: 659, offset: 0.3, dur: 0.25, wave: "sine" },
      { freq: 784, offset: 0.6, dur: 0.35, wave: "sine" },
    ],
  },
  radar: {
    label: "Radar",
    tones: [
      { freq: 1000, offset: 0, dur: 0.15, wave: "triangle" },
      { freq: 1000, offset: 0.25, dur: 0.15, wave: "triangle" },
      { freq: 1000, offset: 0.5, dur: 0.15, wave: "triangle" },
      { freq: 1400, offset: 0.75, dur: 0.3, wave: "triangle" },
    ],
  },
};

export const ALERT_SOUND_OPTIONS = Object.entries(SOUND_PATTERNS).map(
  ([key, val]) => ({ value: key as AlertSoundType, label: val.label })
);

export function useAlertSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);

  const playUrgentAlert = useCallback((opts?: AlertSoundOptions) => {
    const { volume, soundType, vibrate } = { ...DEFAULT_OPTIONS, ...opts };

    // Debounce: max once every 3 seconds
    const now = Date.now();
    if (now - lastPlayedRef.current < 3000) return;
    lastPlayedRef.current = now;

    if (volume <= 0) return;

    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const pattern = SOUND_PATTERNS[soundType] || SOUND_PATTERNS.classic;
      const t = ctx.currentTime;
      const clampedVol = Math.min(1, Math.max(0, volume)) * 0.3; // Max gain 0.3

      pattern.tones.forEach(({ freq, offset, dur, wave }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = wave;
        osc.frequency.value = freq;

        const start = t + offset;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(clampedVol, start + 0.02);
        gain.gain.setValueAtTime(clampedVol, start + dur - 0.05);
        gain.gain.linearRampToValueAtTime(0, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      });

      // Vibrate on mobile
      if (vibrate && "vibrate" in navigator) {
        navigator.vibrate([300, 100, 300, 100, 500]);
      }
    } catch (e) {
      console.warn("Could not play alert sound:", e);
    }
  }, []);

  /** Preview a sound type without debounce */
  const previewSound = useCallback((soundType: AlertSoundType, volume: number) => {
    lastPlayedRef.current = 0; // Reset debounce for preview
    playUrgentAlert({ volume, soundType, vibrate: false });
  }, [playUrgentAlert]);

  return { playUrgentAlert, previewSound };
}
