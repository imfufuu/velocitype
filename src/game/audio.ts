/* Synthesized SFX + adaptive engine hum. No audio assets needed. */

interface Ready {
  ctx: AudioContext;
  master: GainNode;
}

interface EngineNodes {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: EngineNodes | null = null;
  private _muted = false;

  constructor() {
    try {
      this._muted = localStorage.getItem("velocitype.muted") === "1";
    } catch {
      /* ignore */
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  private get r(): Ready | null {
    return this.ctx && this.master ? { ctx: this.ctx, master: this.master } : null;
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    try {
      localStorage.setItem("velocitype.muted", this._muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    const r = this.r;
    if (r) {
      r.master.gain.setTargetAtTime(this._muted ? 0 : 1, r.ctx.currentTime, 0.02);
    }
    return this._muted;
  }

  private tone(opts: {
    freq: number;
    freqEnd?: number;
    type?: OscillatorType;
    dur: number;
    vol: number;
    delay?: number;
  }): void {
    const r = this.r;
    if (!r) return;
    const { freq, freqEnd, type = "square", dur, vol, delay = 0 } = opts;
    const t0 = r.ctx.currentTime + delay;
    const osc = r.ctx.createOscillator();
    const gain = r.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    }
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(r.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(opts: {
    dur: number;
    vol: number;
    freq: number;
    q?: number;
    type?: BiquadFilterType;
    delay?: number;
  }): void {
    const r = this.r;
    if (!r) return;
    const { dur, vol, freq, q = 1, type = "lowpass", delay = 0 } = opts;
    const t0 = r.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(r.ctx.sampleRate * dur));
    const buffer = r.ctx.createBuffer(1, len, r.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = r.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = r.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = r.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(r.master);
    src.start(t0);
  }

  /* ------- game events ------- */

  key(streak = 0): void {
    const f = 540 + Math.min(streak, 24) * 18 + Math.random() * 40;
    this.tone({ freq: f, type: "square", dur: 0.05, vol: 0.07 });
    this.noise({ dur: 0.03, vol: 0.05, freq: 5000, type: "highpass" });
  }

  fumble(): void {
    this.tone({ freq: 190, freqEnd: 80, type: "sawtooth", dur: 0.14, vol: 0.16 });
    this.noise({ dur: 0.08, vol: 0.1, freq: 700 });
  }

  lockOn(): void {
    this.tone({ freq: 920, type: "triangle", dur: 0.06, vol: 0.1 });
  }

  complete(boss = false, combo = 0): void {
    const base = boss ? 392 : 523;
    const lift = Math.min(combo, 12) * 12;
    this.tone({ freq: base + lift, type: "triangle", dur: 0.09, vol: 0.16 });
    this.tone({
      freq: (base + lift) * 1.5,
      type: "triangle",
      dur: 0.12,
      vol: 0.14,
      delay: 0.05,
    });
    if (boss) {
      this.tone({ freq: base * 2, type: "square", dur: 0.16, vol: 0.08, delay: 0.1 });
    }
    this.noise({ dur: 0.16, vol: 0.14, freq: 3200, type: "bandpass", q: 0.8 });
  }

  crash(): void {
    this.noise({ dur: 0.5, vol: 0.5, freq: 420 });
    this.tone({ freq: 220, freqEnd: 38, type: "sawtooth", dur: 0.45, vol: 0.34 });
    this.tone({ freq: 110, freqEnd: 30, type: "square", dur: 0.5, vol: 0.2, delay: 0.05 });
  }

  death(): void {
    this.crash();
    this.noise({ dur: 0.9, vol: 0.4, freq: 260, delay: 0.25 });
    this.tone({ freq: 330, freqEnd: 24, type: "sawtooth", dur: 1.1, vol: 0.22, delay: 0.2 });
  }

  nitro(): void {
    this.tone({ freq: 180, freqEnd: 980, type: "sawtooth", dur: 0.5, vol: 0.15 });
    this.noise({ dur: 0.6, vol: 0.16, freq: 2000, type: "bandpass", q: 0.6 });
  }

  count(go: boolean): void {
    this.tone({
      freq: go ? 880 : 440,
      type: "sine",
      dur: go ? 0.32 : 0.14,
      vol: go ? 0.22 : 0.16,
    });
  }

  ui(): void {
    this.tone({ freq: 740, type: "square", dur: 0.04, vol: 0.06 });
  }

  toast(): void {
    this.tone({ freq: 660, type: "triangle", dur: 0.08, vol: 0.12 });
    this.tone({ freq: 990, type: "triangle", dur: 0.1, vol: 0.1, delay: 0.06 });
  }

  /* ------- engine hum ------- */

  engineStart(): void {
    const r = this.r;
    if (!r || this.nodes) return;
    const osc1 = r.ctx.createOscillator();
    const osc2 = r.ctx.createOscillator();
    const gain = r.ctx.createGain();
    const filter = r.ctx.createBiquadFilter();
    osc1.type = "sawtooth";
    osc2.type = "sawtooth";
    osc1.frequency.value = 55;
    osc2.frequency.value = 56.7;
    filter.type = "lowpass";
    filter.frequency.value = 240;
    gain.gain.value = 0;
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(r.master);
    osc1.start();
    osc2.start();
    gain.gain.setTargetAtTime(0.055, r.ctx.currentTime, 0.4);
    this.nodes = { osc1, osc2, gain, filter };
  }

  engineLevel(x01: number, boost: boolean): void {
    const r = this.r;
    if (!r || !this.nodes) return;
    const t = r.ctx.currentTime;
    const x = Math.min(1, Math.max(0, x01));
    const f = 48 + x * 110 + (boost ? 46 : 0);
    this.nodes.osc1.frequency.setTargetAtTime(f, t, 0.08);
    this.nodes.osc2.frequency.setTargetAtTime(f * 1.034 + 1.2, t, 0.08);
    this.nodes.filter.frequency.setTargetAtTime(200 + x * 640 + (boost ? 500 : 0), t, 0.1);
    this.nodes.gain.gain.setTargetAtTime(0.045 + x * 0.03 + (boost ? 0.02 : 0), t, 0.12);
  }

  engineStop(): void {
    const r = this.r;
    if (!r || !this.nodes) return;
    const nodes = this.nodes;
    this.nodes = null;
    nodes.gain.gain.setTargetAtTime(0.0001, r.ctx.currentTime, 0.15);
    window.setTimeout(() => {
      try {
        nodes.osc1.stop();
        nodes.osc2.stop();
        nodes.gain.disconnect();
      } catch {
        /* already stopped */
      }
    }, 600);
  }

  destroy(): void {
    this.engineStop();
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;
      this.master = null;
      this.nodes = null;
      void ctx.close().catch(() => {
        /* already closed */
      });
    }
  }
}
