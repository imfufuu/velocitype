/* Core game logic — framework-free, driven by rAF from React. */

import { Sfx } from "./audio";
import { pickBoss, pickWord, tierForTime } from "./words";

export type Phase =
  | "menu"
  | "countdown"
  | "playing"
  | "paused"
  | "dying"
  | "gameover";

export type Difficulty = "cruise" | "arcade" | "pro";

export interface DifficultyConfig {
  label: string;
  tagline: string;
  hull: number;
  /** multiplier on word approach speed */
  speed: number;
  /** multiplier on spawn interval (higher = calmer) */
  spawn: number;
  /** seconds for the difficulty ramp to max out */
  rampSec: number;
  /** base seconds between boss words */
  bossDelay: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  cruise: {
    label: "CRUISE",
    tagline: "relaxed",
    hull: 5,
    speed: 0.82,
    spawn: 1.3,
    rampSec: 210,
    bossDelay: 34,
  },
  arcade: {
    label: "ARCADE",
    tagline: "standard",
    hull: 3,
    speed: 1,
    spawn: 1,
    rampSec: 150,
    bossDelay: 28,
  },
  pro: {
    label: "PRO",
    tagline: "brutal",
    hull: 2,
    speed: 1.16,
    spawn: 0.82,
    rampSec: 110,
    bossDelay: 24,
  },
};

export interface RunStats {
  score: number;
  wpm: number;
  bestWpm: number;
  accuracy: number;
  words: number;
  maxCombo: number;
  distance: number;
  timeMs: number;
}

export interface WordEnt {
  id: number;
  text: string;
  progress: number;
  t: number; // 0 = horizon, 1 = crash line
  lane: number; // -1..1 across road half-width
  boss: boolean;
  locked: boolean;
  flash: number; // red flash timer on wrong key
  lockFlash: number;
  /* cached by renderer each frame */
  sx: number;
  sy: number;
  sc: number;
  cw?: number[];
  tw?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  drag: number;
}

export interface Laser {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  max: number;
  color: string;
}

export interface Ring {
  x: number;
  y: number;
  r: number;
  vr: number;
  life: number;
  max: number;
  color: string;
  width: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface Toast {
  text: string;
  sub: string;
  life: number;
  max: number;
  color: string;
}

interface PhaseEvent {
  (phase: Phase, stats?: RunStats): void;
}

const COUNTDOWN_LEN = 1.65;
const MAX_PARTICLES = 420;
const NITRO_MAX = 100;
const BOOST_TIME = 3.4;
const SPEED_MILESTONES = [25, 60, 115];

/* deterministic-ish rng */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Game {
  phase: Phase = "menu";
  /** when true, UI copy refers to touch controls */
  touchUi = false;
  /** active difficulty preset (set by the host before each run) */
  difficulty: Difficulty = "arcade";
  private pausedFrom: Phase = "playing";
  private sfx: Sfx;
  private onPhase: PhaseEvent;
  private rng = mulberry32((Date.now() % 100000) | 0);

  /* world */
  time = 0; // world clock (always advances, drives twinkle etc.)
  distance = 0; // meters travelled (drives parallax)
  elapsed = 0; // run time in seconds
  phaseTime = 0;
  countdownIdx = -1;
  goFlash = 0;

  /* player */
  score = 0;
  combo = 0;
  maxCombo = 0;
  nitro = 0;
  boost = 0; // boost time remaining
  shields = 3;
  hits = 0;
  misses = 0;
  wordsTyped = 0;
  bestWpm = 0;
  charTimes: number[] = [];

  /* entities */
  words: WordEnt[] = [];
  particles: Particle[] = [];
  lasers: Laser[] = [];
  rings: Ring[] = [];
  floats: FloatText[] = [];
  toasts: Toast[] = [];
  private nextId = 1;
  private recent: string[] = [];
  private recentSet = new Set<string>();

  /* pacing */
  private spawnTimer = 0;
  private bossTimer = 14; // first boss arrives ~50s in
  recovery = 0; // post-crash slowdown window (read by renderer)
  private milestones = new Set<number>();

  /* juice */
  trauma = 0;
  flashCyan = 0;
  flashRed = 0;
  carTilt = 0;
  private carTiltVel = 0;
  carSpeedBob = 0;

  /* filled by renderer each frame */
  carNoseX = 0;
  carNoseY = 0;
  carCX = 0;
  carCY = 0;

  /* adaptive quality: 0 = full, 1 = reduced, 2 = potato */
  quality = 0;
  private frameAcc = 0;
  private frameCount = 0;

  private deathBursts = 0;

  constructor(sfx: Sfx, onPhase: PhaseEvent) {
    this.sfx = sfx;
    this.onPhase = onPhase;
  }

  /* ---------------- getters for UI ---------------- */

  /** active difficulty preset */
  get cfg(): DifficultyConfig {
    return DIFFICULTIES[this.difficulty];
  }

  get mult(): number {
    return 1 + Math.min(this.combo, 12) * 0.25;
  }

  get ramp(): number {
    return Math.min(this.elapsed / this.cfg.rampSec, 1);
  }

  /** word approach speed (t-units per second) */
  get wordSpeed(): number {
    let u = (0.115 + this.ramp * 0.24) * this.cfg.speed;
    if (this.recovery > 0) u *= 0.62;
    return u;
  }

  get kmh(): number {
    let v = 72 + this.ramp * 420;
    if (this.boost > 0) v *= 1.52;
    if (this.recovery > 0) v *= 0.72;
    return Math.round(v);
  }

  get wpmWindow(): number {
    return Math.round(this.charTimes.length * 1.5); // chars in last 8s → wpm
  }

  get accuracy(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 100 : Math.round((this.hits / total) * 100);
  }

  get boosting(): boolean {
    return this.boost > 0;
  }

  get nitroReady(): boolean {
    return this.nitro >= NITRO_MAX && this.boost <= 0;
  }

  /* ---------------- lifecycle ---------------- */

  private resetRun(): void {
    this.elapsed = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.nitro = 0;
    this.boost = 0;
    this.shields = this.cfg.hull;
    this.hits = 0;
    this.misses = 0;
    this.wordsTyped = 0;
    this.bestWpm = 0;
    this.charTimes = [];
    this.words = [];
    this.particles = [];
    this.lasers = [];
    this.rings = [];
    this.floats = [];
    this.toasts = [];
    this.spawnTimer = 0.2;
    this.bossTimer = this.cfg.bossDelay;
    this.recovery = 0;
    this.timescaleSet(1);
    this.trauma = 0;
    this.flashCyan = 0;
    this.flashRed = 0;
    this.milestones.clear();
    this.deathBursts = 0;
    this.distance = 0;
  }

  startRun(): void {
    this.resetRun();
    this.phase = "countdown";
    this.phaseTime = 0;
    this.countdownIdx = -1;
    this.onPhase("countdown");
  }

  toMenu(): void {
    this.resetRun();
    this.phase = "menu";
    this.sfx.engineStop();
    this.onPhase("menu");
  }

  togglePause(): void {
    if (this.phase === "playing" || this.phase === "countdown") {
      this.pausedFrom = this.phase;
      this.phase = "paused";
      this.sfx.engineStop();
      this.onPhase("paused");
    } else if (this.phase === "paused") {
      this.phase = this.pausedFrom;
      if (this.phase === "playing") this.sfx.engineStart();
      this.onPhase(this.phase);
    }
  }

  pauseIfPlaying(): void {
    if (this.phase === "playing" || this.phase === "countdown") this.togglePause();
  }

  /* ---------------- spawning ---------------- */

  private rememberWord(w: string): void {
    this.recent.push(w);
    this.recentSet.add(w);
    if (this.recent.length > 22) {
      const old = this.recent.shift();
      if (old) this.recentSet.delete(old);
    }
  }

  spawnWord(boss: boolean, initialT?: number): void {
    if (this.words.length >= 7) return;
    const text = boss
      ? pickBoss(this.rng)
      : pickWord(tierForTime(this.elapsed), this.recentSet, this.rng);
    this.rememberWord(text);
    let lane = this.rng() * 1.16 - 0.58;
    /* de-clump: shove away from nearby words */
    for (const w of this.words) {
      if (Math.abs(w.t - (initialT ?? 0)) < 0.22 && Math.abs(w.lane - lane) < 0.34) {
        lane += lane > 0 ? -0.55 : 0.55;
        lane = Math.max(-0.58, Math.min(0.58, lane));
      }
    }
    this.words.push({
      id: this.nextId++,
      text,
      progress: 0,
      t: initialT ?? -0.04,
      lane,
      boss,
      locked: false,
      flash: 0,
      lockFlash: 0,
      sx: 0,
      sy: 0,
      sc: 1,
    });
  }

  /* ---------------- input ---------------- */

  inputChar(raw: string): void {
    if (this.phase !== "playing") return;
    const ch = raw.toLowerCase();
    if (ch < "a" || ch > "z") return;

    /* active lock first */
    const locked = this.words.find((w) => w.locked);
    if (locked) this.typeOn(locked, ch);
    else {
      /* lock onto the most advanced word starting with ch */
      let best: WordEnt | null = null;
      for (const w of this.words) {
        if (w.progress === 0 && w.text[0] === ch && w.t > 0.02) {
          if (!best || w.t > best.t) best = w;
        }
      }
      if (best) {
        best.locked = true;
        best.lockFlash = 0.3;
        this.sfx.lockOn();
        this.typeOn(best, ch);
      } else {
        /* no matching word: only punish if there was something to type */
        if (this.words.some((w) => w.t > 0.02)) this.fumble(null);
      }
    }
  }

  private typeOn(w: WordEnt, ch: string): void {
    const expected = w.text[w.progress];
    if (ch !== expected) {
      this.fumble(w);
      return;
    }
    w.progress++;
    this.hits++;
    this.score += Math.round(2 * this.mult);
    this.nitro = Math.min(NITRO_MAX, this.nitro + 2.2);
    this.sfx.key(this.charTimes.length);
    this.charTimes.push(this.elapsed);
    this.spawnLaser(w);
    this.spawnImpact(w, 2);

    if (w.progress >= w.text.length) this.completeWord(w);
  }

  private fumble(w: WordEnt | null): void {
    this.misses++;
    this.combo = Math.max(0, this.combo - 1);
    this.trauma = Math.min(1, this.trauma + 0.09);
    this.carTiltVel += (this.rng() - 0.5) * 6;
    if (w) w.flash = 0.18;
    this.sfx.fumble();
  }

  activateNitro(): void {
    if (this.phase !== "playing" || !this.nitroReady) return;
    this.nitro = 0;
    this.boost = BOOST_TIME;
    this.trauma = Math.min(1, this.trauma + 0.22);
    this.flashCyan = Math.max(this.flashCyan, 0.25);
    this.sfx.nitro();
    this.pushToast("NITRO BOOST", "score x3  ·  pedal down", "#3df5ff");
  }

  /* ---------------- word outcomes ---------------- */

  private completeWord(w: WordEnt): void {
    const base = w.text.length * 10;
    const points = Math.round(
      base * this.mult * (w.boss ? 3 : 1) * (this.boosting ? 1.5 : 1)
    );
    this.score += points;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.wordsTyped++;
    this.nitro = Math.min(NITRO_MAX, this.nitro + (w.boss ? 30 : 12));
    this.trauma = Math.min(1, this.trauma + (w.boss ? 0.3 : 0.15));
    this.flashCyan = Math.max(this.flashCyan, w.boss ? 0.22 : 0.09);
    this.sfx.complete(w.boss, this.combo);

    const color = w.boss ? "#ff3df0" : "#3df5ff";
    this.burst(w.sx, w.sy, color, w.boss ? 44 : 24, w.boss ? 340 : 230, 3);
    this.rings.push({
      x: w.sx,
      y: w.sy,
      r: 6,
      vr: w.boss ? 620 : 420,
      life: 0.45,
      max: 0.45,
      color,
      width: w.boss ? 5 : 3,
    });
    this.floats.push({
      x: w.sx,
      y: w.sy - 14 * w.sc,
      text: `+${points}`,
      life: 0.9,
      max: 0.9,
      color,
      size: w.boss ? 30 : 20,
    });

    if (this.combo > 0 && this.combo % 6 === 0) {
      this.pushToast(`COMBO x${this.mult.toFixed(2).replace(/\.?0+$/, "")}`, "keep the chain alive", "#ffb54d");
      this.sfx.toast();
    }
    if (this.nitroReady) {
      this.pushToast(
        "NITRO READY",
        this.touchUi ? "tap the nitro button" : "hit SPACE to ignite",
        "#ff3df0"
      );
    }
    this.words = this.words.filter((x) => x !== w);
  }

  private crashWord(w: WordEnt): void {
    this.words = this.words.filter((x) => x !== w);
    this.shields--;
    this.combo = 0;
    this.recovery = 1.6;
    this.trauma = 1;
    this.flashRed = 0.55;
    this.boost = 0;
    this.sfx.crash();

    const x = w.sx || this.carCX;
    const y = (w.sy || this.carCY) - 10;
    this.burst(x, y, "#ff3b57", 34, 320, 3.4);
    this.burst(x, y, "#ffb54d", 18, 220, 2.6);
    this.rings.push({ x, y, r: 10, vr: 700, life: 0.5, max: 0.5, color: "#ff3b57", width: 5 });
    this.floats.push({ x, y: y - 60, text: "HULL BREACH", life: 1.1, max: 1.1, color: "#ff3b57", size: 22 });

    if (this.shields <= 0) this.beginDeath();
  }

  private beginDeath(): void {
    this.phase = "dying";
    this.phaseTime = 0;
    this.timescaleSet(0.35);
    this.sfx.death();
    this.sfx.engineStop();
    this.onPhase("dying");
  }

  private timescale = 1;
  private timescaleSet(v: number): void {
    this.timescale = v;
  }

  /* ---------------- juice helpers ---------------- */

  private pushToast(text: string, sub: string, color: string): void {
    /* keep at most 1 duplicate of same message */
    if (this.toasts.some((t) => t.text === text)) return;
    this.toasts.push({ text, sub, life: 2.2, max: 2.2, color });
  }

  burst(x: number, y: number, color: string, count: number, speed: number, size: number): void {
    const scale = this.quality === 0 ? 1 : this.quality === 1 ? 0.6 : 0.35;
    const n = Math.round(count * scale);
    for (let i = 0; i < n; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const a = this.rng() * Math.PI * 2;
      const v = speed * (0.35 + this.rng() * 0.85);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.25,
        life: 0.5 + this.rng() * 0.55,
        max: 0.9,
        size: size * (0.6 + this.rng() * 0.9),
        color,
        drag: 0.9,
      });
    }
  }

  private spawnLaser(w: WordEnt): void {
    this.lasers.push({
      x1: this.carNoseX,
      y1: this.carNoseY,
      x2: w.sx + (this.rng() - 0.5) * 30 * w.sc,
      y2: w.sy,
      life: 0.09,
      max: 0.09,
      color: w.boss ? "#ff3df0" : "#3df5ff",
    });
  }

  private spawnImpact(w: WordEnt, count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      this.particles.push({
        x: w.sx + (this.rng() - 0.5) * 40 * w.sc,
        y: w.sy + (this.rng() - 0.5) * 16 * w.sc,
        vx: (this.rng() - 0.5) * 160,
        vy: -this.rng() * 160 - 40,
        life: 0.25 + this.rng() * 0.2,
        max: 0.4,
        size: 1.6 + this.rng() * 1.6,
        color: w.boss ? "#ff3df0" : "#aef9ff",
        drag: 0.92,
      });
    }
  }

  /* ---------------- per-frame update ---------------- */

  update(dtReal: number): void {
    this.time += dtReal;

    /* adaptive quality: watch average frame time */
    this.frameAcc += dtReal;
    this.frameCount++;
    if (this.frameCount >= 90) {
      const avg = this.frameAcc / this.frameCount;
      if (avg > 0.024 && this.quality < 2) this.quality++;
      else if (avg < 0.012 && this.quality > 0) this.quality--;
      this.frameAcc = 0;
      this.frameCount = 0;
    }

    /* decay juice regardless of phase */
    this.trauma = Math.max(0, this.trauma - dtReal * 1.5);
    this.flashCyan = Math.max(0, this.flashCyan - dtReal * 2.2);
    this.flashRed = Math.max(0, this.flashRed - dtReal * 1.6);
    this.carTiltVel -= this.carTilt * 90 * dtReal;
    this.carTiltVel *= Math.pow(0.0001, dtReal);
    this.carTilt += this.carTiltVel * dtReal;
    this.carSpeedBob = Math.sin(this.time * 7) * 1.5;

    if (this.phase === "menu") {
      this.distance += dtReal * 460;
      return;
    }
    if (this.phase === "paused" || this.phase === "gameover") return;

    if (this.phase === "countdown") {
      const prev = this.countdownIdx;
      this.phaseTime += dtReal;
      this.countdownIdx = Math.floor(this.phaseTime / 0.55);
      if (this.countdownIdx !== prev && this.countdownIdx < 3) this.sfx.count(false);
      this.distance += dtReal * 600;
      if (this.phaseTime >= COUNTDOWN_LEN) {
        this.phase = "playing";
        this.sfx.count(true);
        this.sfx.engineStart();
        this.goFlash = 0.65;
        /* three gimme words so the player is typing instantly */
        this.spawnWord(false, 0.34);
        this.spawnWord(false, 0.06);
        this.spawnWord(false, -0.22);
        this.onPhase("playing");
      }
      return;
    }

    const dt = dtReal * this.timescale;

    if (this.phase === "dying") {
      this.phaseTime += dtReal;
      const wanted = this.phaseTime > 0.05 ? (this.phaseTime > 0.45 ? 3 : 2) : 1;
      while (this.deathBursts < wanted) {
        this.deathBursts++;
        this.burst(
          this.carCX + (this.rng() - 0.5) * 90,
          this.carCY + (this.rng() - 0.5) * 50,
          this.deathBursts % 2 ? "#ff3b57" : "#ffb54d",
          42,
          380,
          4
        );
        this.rings.push({
          x: this.carCX,
          y: this.carCY,
          r: 8,
          vr: 800,
          life: 0.6,
          max: 0.6,
          color: "#ff3b57",
          width: 6,
        });
        this.trauma = 1;
      }
      this.updateFx(dt);
      this.distance += dt * this.kmh * 0.4;
      if (this.phaseTime >= 1.7) {
        this.timescaleSet(1);
        this.phase = "gameover";
        this.onPhase("gameover", this.finalStats());
      }
      return;
    }

    /* ------- playing ------- */
    this.elapsed += dt;
    this.goFlash = Math.max(0, this.goFlash - dtReal);
    this.distance += dt * this.kmh;
    this.recovery = Math.max(0, this.recovery - dt);
    this.boost = Math.max(0, this.boost - dt);

    /* passive distance score */
    this.score += dt * (4 + this.ramp * 9) * (this.boosting ? 3 : 1);

    /* wpm sliding window (8s) */
    const cutoff = this.elapsed - 8;
    while (this.charTimes.length && this.charTimes[0] < cutoff) this.charTimes.shift();
    this.bestWpm = Math.max(this.bestWpm, this.wpmWindow);

    /* difficulty milestones */
    for (const m of SPEED_MILESTONES) {
      if (this.elapsed >= m && !this.milestones.has(m)) {
        this.milestones.add(m);
        this.pushToast("SPEED UP", "words incoming faster", "#ffb54d");
        this.sfx.toast();
        this.trauma = Math.min(1, this.trauma + 0.15);
      }
    }

    /* spawning */
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.words.length < 7) {
      this.spawnWord(false);
      const base = (1.14 - this.ramp * 0.6) * this.cfg.spawn;
      this.spawnTimer = (this.recovery > 0 ? base * 1.6 : base) * (0.85 + this.rng() * 0.4);
    }
    if (this.elapsed > 35) {
      this.bossTimer -= dt;
      if (this.bossTimer <= 0) {
        if (!this.words.some((w) => w.boss)) {
          this.spawnWord(true, -0.02);
          this.pushToast("TURBO WORD", "long word · triple score", "#ff3df0");
          this.sfx.toast();
        }
        this.bossTimer = this.cfg.bossDelay * (0.85 + this.rng() * 0.5);
      }
    }

    /* advance words, resolve crashes */
    const u = this.wordSpeed;
    for (let i = this.words.length - 1; i >= 0; i--) {
      const w = this.words[i];
      w.t += u * (w.boss ? 0.84 : 1) * dt;
      w.flash = Math.max(0, w.flash - dt);
      w.lockFlash = Math.max(0, w.lockFlash - dt);
      if (w.t >= 1) this.crashWord(w);
    }

    /* engine hum follows speed */
    this.sfx.engineLevel(this.ramp, this.boosting);

    this.updateFx(dt);
  }

  private updateFx(dt: number): void {
    /* particles */
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy = p.vy * d + 240 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    /* lasers */
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.life -= dt;
      if (l.life <= 0) this.lasers.splice(i, 1);
    }
    /* rings */
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      r.r += r.vr * dt;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    /* floats */
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.y -= 44 * dt;
      if (f.life <= 0) this.floats.splice(i, 1);
    }
    /* toasts */
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i];
      t.life -= dt;
      if (t.life <= 0) this.toasts.splice(i, 1);
    }
  }

  finalStats(): RunStats {
    const mins = Math.max(this.elapsed / 60, 0.05);
    return {
      score: Math.floor(this.score),
      wpm: Math.round(this.hits / 5 / mins),
      bestWpm: this.bestWpm,
      accuracy: this.accuracy,
      words: this.wordsTyped,
      maxCombo: this.maxCombo,
      distance: Math.floor(this.distance),
      timeMs: Math.round(this.elapsed * 1000),
    };
  }
}
