"use client";
// The sound engine. Every sound here is generated live in the browser (Web Audio), so there are
// no audio files to host and no copyright issues. Background "scapes" loop; "cues" play once.

let ctx: AudioContext | null = null;
let reverbBus: GainNode | null = null;

function audio(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Browsers only allow sound after a click/tap; call this from a click to "wake up" audio. */
export function unlockAudio() {
  audio();
}

// ---------- building blocks ----------

const noiseCache = new Map<string, AudioBuffer>();
function noiseBuffer(c: AudioContext, color: "white" | "pink" | "brown"): AudioBuffer {
  const hit = noiseCache.get(color);
  if (hit) return hit;
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (color === "white") d[i] = w;
    else if (color === "pink") {
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    } else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  noiseCache.set(color, buf);
  return buf;
}

function noise(c: AudioContext, color: "white" | "pink" | "brown", when = c.currentTime, duration?: number) {
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c, color);
  s.loop = true;
  s.start(when, Math.random() * 3);
  if (duration) s.stop(when + duration);
  return s;
}

function filter(c: AudioContext, type: BiquadFilterType, frequency: number, Q = 0.7) {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = Q;
  return f;
}

function gain(c: AudioContext, value: number) {
  const g = c.createGain();
  g.gain.value = value;
  return g;
}

/** A shared "room" echo, made from decaying noise. Gives music and bells a sense of space. */
function reverb(c: AudioContext): GainNode {
  if (reverbBus) return reverbBus;
  const seconds = 3;
  const ir = c.createBuffer(2, c.sampleRate * seconds, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  reverbBus = gain(c, 1);
  const wet = gain(c, 0.45);
  reverbBus.connect(conv).connect(wet).connect(c.destination);
  return reverbBus;
}

/** A slow wobble (LFO) that moves a setting up and down. */
function lfo(c: AudioContext, rate: number, depth: number, target: AudioParam) {
  const o = c.createOscillator();
  o.frequency.value = rate;
  const g = gain(c, depth);
  o.connect(g).connect(target);
  o.start();
  return o;
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** One musical note: a soft tone that fades away, like a struck string or bell. */
function note(c: AudioContext, out: AudioNode, freq: number, when: number, opts: { decay?: number; level?: number; type?: OscillatorType; attack?: number } = {}) {
  const { decay = 2, level = 0.2, type = "sine", attack = 0.008 } = opts;
  const g = gain(c, 0);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(level, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  g.connect(out);
  for (const [mult, lvl, t] of [[1, 1, type], [2, 0.25, "sine"], [3, 0.08, "sine"]] as const) {
    const o = c.createOscillator();
    o.type = t as OscillatorType;
    o.frequency.value = freq * mult;
    const og = gain(c, lvl);
    o.connect(og).connect(g);
    o.start(when);
    o.stop(when + attack + decay + 0.1);
  }
}

/** A short burst of filtered noise (rain drop, fire crackle, clock tick...). */
function burst(c: AudioContext, out: AudioNode, when: number, length: number, freq: number, level: number, type: BiquadFilterType = "bandpass") {
  const s = noise(c, "white", when, length + 0.02);
  const f = filter(c, type, freq, 2);
  const g = gain(c, 0);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(level, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + length);
  s.connect(f).connect(g).connect(out);
}

// ---------- background soundscapes ----------

export type ScapeHandle = { stop: () => void; setVolume: (v: number) => void };

export function startScape(id: string, volume: number): ScapeHandle {
  const c = audio();
  const master = gain(c, 0);
  master.connect(c.destination);
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(volume, c.currentTime + 2.5); // gentle fade-in
  const sources: AudioScheduledSourceNode[] = [];
  const timers: number[] = [];
  const keep = <T extends AudioScheduledSourceNode>(n: T) => (sources.push(n), n);
  const every = (ms: number, fn: (t: number) => void) => timers.push(window.setInterval(() => fn(c.currentTime + 0.05), ms));
  const toReverb = gain(c, 1);
  toReverb.connect(master);
  toReverb.connect(reverb(c));

  switch (id) {
    case "rain": {
      keep(noise(c, "pink")).connect(filter(c, "highpass", 400)).connect(filter(c, "lowpass", 5000)).connect(gain(c, 0.55)).connect(master);
      every(45, (t) => Math.random() < 0.5 && burst(c, master, t, 0.03, 2000 + Math.random() * 4000, 0.05 + Math.random() * 0.12));
      break;
    }
    case "ocean": {
      const waves = gain(c, 0.45);
      keep(noise(c, "brown")).connect(filter(c, "lowpass", 700)).connect(waves).connect(master);
      keep(lfo(c, 0.09, 0.35, waves.gain));
      const foam = gain(c, 0.08);
      keep(noise(c, "pink")).connect(filter(c, "highpass", 1400)).connect(foam).connect(master);
      keep(lfo(c, 0.09, 0.07, foam.gain));
      break;
    }
    case "wind": {
      const bp = filter(c, "bandpass", 500, 1.2);
      const g = gain(c, 0.6);
      keep(noise(c, "pink")).connect(bp).connect(g).connect(master);
      keep(lfo(c, 0.05, 300, bp.frequency));
      keep(lfo(c, 0.13, 0.35, g.gain));
      break;
    }
    case "fire": {
      keep(noise(c, "brown")).connect(filter(c, "lowpass", 350)).connect(gain(c, 0.7)).connect(master);
      every(40, (t) => Math.random() < 0.25 && burst(c, master, t, 0.005 + Math.random() * 0.02, 1500 + Math.random() * 3000, 0.05 + Math.random() * 0.3, "highpass"));
      break;
    }
    case "night": {
      keep(noise(c, "brown")).connect(filter(c, "lowpass", 250)).connect(gain(c, 0.18)).connect(master);
      const cricket = (pitch: number, pan: number) => {
        const p = c.createStereoPanner();
        p.pan.value = pan;
        p.connect(master);
        return (t: number) => {
          for (let i = 0; i < 3; i++) {
            const o = c.createOscillator();
            o.frequency.value = pitch;
            const g = gain(c, 0);
            const s = t + i * 0.06;
            g.gain.setValueAtTime(0, s);
            g.gain.linearRampToValueAtTime(0.05, s + 0.01);
            g.gain.linearRampToValueAtTime(0, s + 0.04);
            o.connect(g).connect(p);
            o.start(s);
            o.stop(s + 0.05);
          }
        };
      };
      const a = cricket(4300, -0.6), b = cricket(4700, 0.6);
      every(800, (t) => Math.random() < 0.85 && a(t));
      every(1100, (t) => Math.random() < 0.7 && b(t + 0.3));
      break;
    }
    case "dream": {
      const chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]];
      let k = 0;
      const pad = gain(c, 0.12);
      pad.connect(filter(c, "lowpass", 1400)).connect(toReverb);
      const play = (t: number) => {
        for (const n of chords[k++ % chords.length]) {
          for (const detune of [-6, 6]) {
            const o = c.createOscillator();
            o.type = "triangle";
            o.frequency.value = midi(n);
            o.detune.value = detune;
            const g = gain(c, 0);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.18, t + 3);
            g.gain.linearRampToValueAtTime(0, t + 9.5);
            o.connect(g).connect(pad);
            o.start(t);
            o.stop(t + 10);
          }
        }
      };
      play(c.currentTime + 0.05);
      every(8000, play);
      break;
    }
    case "musicbox": {
      const scale = [72, 74, 76, 79, 81, 84, 86, 88];
      every(420, (t) => {
        if (Math.random() < 0.65) note(c, toReverb, midi(scale[Math.floor(Math.random() * scale.length)]), t, { decay: 1.6, level: 0.12 });
      });
      break;
    }
    case "piano": {
      const chords = [[57, 64, 69, 72], [53, 60, 65, 69], [48, 55, 64, 67], [55, 62, 67, 71]];
      let step = 0;
      every(750, (t) => {
        const chord = chords[Math.floor(step / 8) % chords.length];
        if (step % 8 === 0) note(c, toReverb, midi(chord[0] - 12), t, { decay: 4, level: 0.16, type: "triangle" });
        if (step % 8 !== 7) note(c, toReverb, midi(chord[[1, 2, 3, 2][step % 4]]), t, { decay: 2.5, level: 0.1, type: "triangle" });
        step++;
      });
      break;
    }
  }

  return {
    setVolume: (v) => master.gain.setTargetAtTime(v, c.currentTime, 0.2),
    stop: () => {
      timers.forEach(clearInterval);
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.setTargetAtTime(0, c.currentTime, 0.5);
      window.setTimeout(() => {
        sources.forEach((s) => {
          try {
            s.stop();
          } catch {}
        });
        master.disconnect();
        toReverb.disconnect();
      }, 2500);
    },
  };
}

// ---------- one-off sound effects ----------

export function playCue(id: string, volume = 0.8) {
  const c = audio();
  const t = c.currentTime + 0.05;
  const out = gain(c, volume);
  out.connect(c.destination);
  const wet = gain(c, 1);
  wet.connect(out);
  wet.connect(reverb(c));

  switch (id) {
    case "chime":
      [84, 88, 91].forEach((n, i) => note(c, wet, midi(n), t + i * 0.18, { decay: 2.5, level: 0.15 }));
      break;
    case "bell":
      for (const [mult, lvl] of [[1, 0.3], [2, 0.18], [2.4, 0.12], [3, 0.08], [4.2, 0.05], [5.4, 0.03]]) {
        note(c, wet, 196 * mult, t, { decay: 5, level: lvl, attack: 0.004 });
      }
      break;
    case "heartbeat":
      for (const beat of [0, 0.28, 1, 1.28]) {
        const o = c.createOscillator();
        o.frequency.setValueAtTime(90, t + beat);
        o.frequency.exponentialRampToValueAtTime(40, t + beat + 0.15);
        const g = gain(c, 0);
        g.gain.setValueAtTime(0, t + beat);
        g.gain.linearRampToValueAtTime(beat % 1 ? 0.5 : 0.8, t + beat + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + beat + 0.2);
        o.connect(g).connect(out);
        o.start(t + beat);
        o.stop(t + beat + 0.25);
      }
      break;
    case "thunder": {
      burst(c, out, t, 0.25, 3000, 0.4, "highpass");
      const s = noise(c, "brown", t, 5);
      const g = gain(c, 0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, t + 4.8);
      s.connect(filter(c, "lowpass", 220)).connect(g).connect(out);
      break;
    }
    case "whoosh": {
      const s = noise(c, "white", t, 1.3);
      const f = filter(c, "bandpass", 300, 1.5);
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(3000, t + 0.6);
      f.frequency.exponentialRampToValueAtTime(400, t + 1.2);
      const g = gain(c, 0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.5);
      g.gain.linearRampToValueAtTime(0, t + 1.2);
      s.connect(f).connect(g).connect(out);
      break;
    }
    case "birds":
      for (let i = 0; i < 6; i++) {
        const s = t + i * 0.22 + Math.random() * 0.1;
        const o = c.createOscillator();
        const base = 2800 + Math.random() * 900;
        o.frequency.setValueAtTime(base, s);
        o.frequency.exponentialRampToValueAtTime(base * 1.5, s + 0.08);
        const g = gain(c, 0);
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(0.12, s + 0.02);
        g.gain.linearRampToValueAtTime(0, s + 0.1);
        o.connect(g).connect(wet);
        o.start(s);
        o.stop(s + 0.12);
      }
      break;
    case "clock":
      for (let i = 0; i < 6; i++) burst(c, out, t + i * 0.5, 0.02, i % 2 ? 2500 : 3200, 0.5);
      break;
    case "page": {
      const s = noise(c, "white", t, 0.5);
      const g = gain(c, 0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.12);
      g.gain.linearRampToValueAtTime(0.05, t + 0.25);
      g.gain.linearRampToValueAtTime(0, t + 0.45);
      s.connect(filter(c, "bandpass", 2200, 0.8)).connect(g).connect(out);
      break;
    }
  }
  window.setTimeout(() => out.disconnect(), 7000);
}
