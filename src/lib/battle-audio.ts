"use client";
// Original chiptune music and sound effects for battles, synthesised live with the Web Audio API
// (no audio files, nothing copyrighted). Browsers only allow sound after a tap, so call unlock()
// from a click handler first. The mute setting is remembered on this device.

type Track = "lobby" | "battle" | "final";

const KEY = "fb-sound";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let current: Track | null = null;
let step = 0;
let nextAt = 0;

export const soundOn = () => typeof window !== "undefined" && localStorage.getItem(KEY) !== "off";
export function setSoundOn(on: boolean) {
  localStorage.setItem(KEY, on ? "on" : "off");
  if (master && ctx) master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.05);
  if (on && current) { const t = current; current = null; playMusic(t); }
  if (!on) stopMusic(true);
}

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = soundOn() ? 0.9 : 0; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
  }
  return ctx;
}

/** Call from a tap/click so the browser lets us play sound. */
export function unlock() { const c = audio(); if (c && c.state === "suspended") c.resume(); }

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function tone(at: number, midi: number, dur: number, type: OscillatorType, vol: number, out: AudioNode, slideTo?: number) {
  const c = ctx!; const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(hz(midi), at);
  if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(hz(slideTo), at + dur);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(out); o.start(at); o.stop(at + dur + 0.02);
}

let noiseBuf: AudioBuffer | null = null;
function noise(at: number, dur: number, vol: number, out: AudioNode, highpass = 6000) {
  const c = ctx!;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = highpass;
  const g = c.createGain(); g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(out); s.start(at); s.stop(at + dur + 0.02);
}
const kick = (at: number, out: AudioNode, vol = 0.9) => tone(at, 50, 0.16, "sine", vol, out, 28);

// ---------------------------------------------------------------- music patterns (16 steps per bar)
// chord roots per bar (A minor-ish loop), all original
const PROG = [57, 53, 48, 55]; // A, F, C, G
const SONGS: Record<Track, { bpm: number; play: (at: number, s: number, bar: number, out: AudioNode) => void }> = {
  lobby: {
    bpm: 96,
    play(at, s, bar, out) {
      const root = PROG[bar % 4];
      if (s % 8 === 0) tone(at, root - 12, 0.5, "triangle", 0.35, out);
      if (s % 4 === 2) noise(at, 0.04, 0.05, out, 8000);
      if (s === 0 || s === 8) [0, 3, 7].forEach((iv) => tone(at, root + 12 + iv, 0.9, "sine", 0.06, out));
      const mel = [0, 7, 12, 7, 3, 7, 10, 7];
      if (s % 2 === 0) tone(at, root + 12 + mel[(s / 2) % 8], 0.18, "square", 0.025, out);
    },
  },
  battle: {
    bpm: 150,
    play(at, s, bar, out) {
      const root = PROG[bar % 4];
      if (s % 4 === 0) kick(at, out);
      if (s % 8 === 4) noise(at, 0.12, 0.18, out, 1800); // snare
      if (s % 2 === 1) noise(at, 0.03, 0.06, out, 9000); // hats
      const bass = [0, 0, 12, 0, 0, 12, 0, 10, 0, 0, 12, 0, 7, 0, 10, 12];
      tone(at, root - 24 + bass[s], 0.11, "sawtooth", 0.11, out);
      const arp = [0, 3, 7, 12, 7, 3, 7, 15];
      tone(at, root + 12 + arp[s % 8], 0.09, "square", 0.035, out);
    },
  },
  final: {
    bpm: 172,
    play(at, s, bar, out) {
      const root = PROG[bar % 4] + 2;
      if (s % 4 === 0 || s === 14) kick(at, out, 1);
      if (s % 8 === 4) noise(at, 0.12, 0.22, out, 1600);
      noise(at, 0.025, 0.05, out, 10000);
      tone(at, root - 24 + (s % 2 ? 12 : 0), 0.09, "sawtooth", 0.12, out);
      const arp = [0, 7, 12, 15, 19, 15, 12, 7];
      tone(at, root + 12 + arp[s % 8], 0.07, "square", 0.04, out);
      if (s === 0) tone(at, root + 24, 0.4, "triangle", 0.05, out, root + 31);
    },
  },
};

export function playMusic(track: Track) {
  if (current === track) return;
  current = track;
  const c = audio(); if (!c || !soundOn()) return;
  if (timer) clearInterval(timer);
  musicBus!.gain.cancelScheduledValues(c.currentTime);
  musicBus!.gain.setTargetAtTime(0.32, c.currentTime, 0.1);
  step = 0; nextAt = c.currentTime + 0.08;
  const song = SONGS[track];
  timer = setInterval(() => {
    const spb = 60 / song.bpm / 4; // seconds per 16th
    while (nextAt < c.currentTime + 0.15) {
      song.play(nextAt, step % 16, Math.floor(step / 16), musicBus!);
      nextAt += spb; step++;
    }
  }, 40);
}

export function stopMusic(keepTrack = false) {
  if (timer) clearInterval(timer);
  timer = null;
  if (!keepTrack) current = null;
}

// ---------------------------------------------------------------- sound effects
export type Sfx = "cut" | "tick" | "lock" | "correct" | "wrong" | "round" | "final" | "victory" | "defeat" | "draw" | "emote" | "join";
export function sfx(name: Sfx) {
  const c = audio(); if (!c || !soundOn()) return;
  const t = c.currentTime + 0.01; const out = master!;
  switch (name) {
    case "tick": tone(t, 84, 0.05, "square", 0.08, out); break;
    case "cut": tone(t, 96, 0.18, "sawtooth", 0.1, out, 72); noise(t, 0.12, 0.12, out, 3000); break;
    case "lock": tone(t, 72, 0.06, "square", 0.1, out); tone(t + 0.06, 79, 0.08, "square", 0.1, out); break;
    case "correct": [72, 76, 79, 84].forEach((n, i) => tone(t + i * 0.07, n, 0.16, "square", 0.12, out)); break;
    case "wrong": tone(t, 52, 0.35, "sawtooth", 0.14, out, 40); break;
    case "join": tone(t, 67, 0.08, "triangle", 0.15, out); tone(t + 0.08, 74, 0.12, "triangle", 0.15, out); break;
    case "emote": tone(t, 88, 0.06, "sine", 0.12, out, 96); break;
    case "round": noise(t, 0.35, 0.18, out, 900); tone(t, 60, 0.25, "sawtooth", 0.1, out, 72); break;
    case "final": noise(t, 0.5, 0.22, out, 700); [60, 63, 67, 72].forEach((n, i) => tone(t + i * 0.09, n, 0.22, "sawtooth", 0.1, out)); break;
    case "victory": stopMusic(); [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tone(t + i * 0.12, n, i === 6 ? 0.9 : 0.16, "square", 0.13, out)); kick(t, out); kick(t + 0.72, out); break;
    case "defeat": stopMusic(); [67, 63, 60, 55].forEach((n, i) => tone(t + i * 0.22, n, 0.3, "triangle", 0.14, out)); break;
    case "draw": stopMusic(); [72, 72, 76].forEach((n, i) => tone(t + i * 0.15, n, 0.2, "triangle", 0.12, out)); break;
  }
}
