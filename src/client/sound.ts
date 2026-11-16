// Small synthesised sounds. Silent until the first tap, mutable, and suspended while the page is hidden.
// Placeholders: the final sounds are recorded or picked by a human.

let audio: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean): void {
  muted = value;
  if (!audio) return;
  if (muted) void audio.suspend();
  else void audio.resume();
}

export function isMuted(): boolean {
  return muted;
}

/** Call from a user gesture: browsers only allow audio after one. */
export function unlockAudio(): void {
  if (!audio) {
    try {
      audio = new AudioContext();
    } catch {
      audio = null;
    }
  }
  if (audio && audio.state === 'suspended' && !muted) void audio.resume();
}

document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) void audio.suspend();
  else if (!muted) void audio.resume();
});

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.12,
  delay = 0
): void {
  if (!audio || muted) return;
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

/** A tone that slides from one pitch to another: the body of a "boing". */
function slide(from: number, to: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, delay = 0): void {
  if (!audio || muted) return;
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

export const sound = {
  /** A hop: higher and longer the harder it is. `power` is 0 to 1. */
  hop(power: number): void {
    slide(220 + power * 120, 520 + power * 520, 0.16 + power * 0.08, 'sine', 0.1);
  },
  stick(hard: number): void {
    slide(190 + hard * 60, 70, 0.12, 'triangle', 0.1 + hard * 0.08);
    tone(900 + Math.random() * 200, 0.04, 'square', 0.02);
  },
  bounce(): void {
    tone(520, 0.06, 'triangle', 0.06);
  },
  boing(): void {
    slide(180, 760, 0.28, 'sine', 0.14);
    slide(360, 1520, 0.28, 'sine', 0.05);
  },
  web(): void {
    tone(1320, 0.12, 'sine', 0.06);
    tone(1760, 0.2, 'sine', 0.04, 0.05);
  },
  ouch(): void {
    slide(420, 110, 0.22, 'sawtooth', 0.08);
  },
  splash(): void {
    slide(700, 140, 0.25, 'triangle', 0.09);
    tone(180, 0.3, 'sine', 0.08, 0.04);
  },
  win(): void {
    [523, 659, 784, 1047].forEach((freq, i) => tone(freq, 0.35, 'triangle', 0.09, i * 0.09));
  },
  star(which: number): void {
    tone(880 + which * 220, 0.22, 'sine', 0.09);
    tone(1760 + which * 440, 0.3, 'sine', 0.035, 0.03);
  },
  tap(): void {
    tone(660, 0.05, 'sine', 0.05);
  },
};
