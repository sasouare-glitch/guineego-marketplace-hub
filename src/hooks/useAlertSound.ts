import { useCallback, useRef } from "react";

/**
 * Hook to play an urgent alert sound using Web Audio API.
 * No external audio file needed — generates a two-tone alert beep.
 */
export function useAlertSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);

  const playUrgentAlert = useCallback(() => {
    // Debounce: don't play more than once every 3 seconds
    const now = Date.now();
    if (now - lastPlayedRef.current < 3000) return;
    lastPlayedRef.current = now;

    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.setValueAtTime(0.15, startTime + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const t = ctx.currentTime;

      // Two-tone urgent beep pattern: beep-beep, pause, beep-beep
      playTone(880, t, 0.12);
      playTone(1100, t + 0.15, 0.12);
      playTone(880, t + 0.45, 0.12);
      playTone(1100, t + 0.6, 0.12);
    } catch (e) {
      console.warn("Could not play alert sound:", e);
    }
  }, []);

  return { playUrgentAlert };
}
