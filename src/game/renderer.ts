/* Canvas renderer — retro-futurist neon highway.
 * Static layers (sky, sun, road, vignette+scanlines) are baked into
 * offscreen canvases on resize; the per-frame cost is a few drawImages
 * plus only the moving elements. Adaptive DPR keeps 60fps on weak GPUs. */

import { Game, WordEnt } from "./engine";

const C = {
  cyan: "#3df5ff",
  magenta: "#ff3df0",
  red: "#ff3b57",
};

interface Star {
  x: number;
  y: number;
  r: number;
  ph: number;
  sp: number;
}
interface Streak {
  x: number;
  y: number;
  len: number;
  spd: number;
}

const SKY_SCALE = 0.5; // skyBase is baked at half resolution (pure gradients)
const DPR_BY_QUALITY = [2, 1.5, 1];

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private appliedQ = 0;
  private stars: Star[] = [];
  private mtnA: number[] = [];
  private mtnB: number[] = [];
  private streaks: Streak[] = [];
  private skyBase: HTMLCanvasElement | null = null;
  private trackBase: HTMLCanvasElement | null = null;
  private vignette: HTMLCanvasElement | null = null;
  private fontCache = new Map<string, string>();
  private reducedMotion = false;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("no 2d context");
    this.ctx = ctx;
    this.appliedQ = 0;
    this.resize();
  }

  private readMotionPref(): void {
    try {
      this.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    } catch {
      this.reducedMotion = false;
    }
  }

  resize(): void {
    this.readMotionPref();
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      DPR_BY_QUALITY[this.appliedQ] ?? 1
    );
    this.dpr = dpr;
    this.w = Math.max(320, rect.width);
    this.h = Math.max(320, rect.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.bake();
  }

  /* ---------------- offscreen bakes ---------------- */

  private bake(): void {
    const { w, h } = this;
    const hz = Math.round(this.h * 0.315);

    /* stars + ridges live-shape caches */
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * hz * 0.9,
        r: Math.random() * 1.6 + 0.4,
        ph: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 2.4,
      });
    }
    const mkRidge = (amp: number, rough: number): number[] => {
      const pts: number[] = [];
      let y = 0;
      for (let x = 0; x <= 40; x++) {
        y += (Math.random() - 0.5) * rough;
        y = Math.max(-1, Math.min(1, y));
        pts.push(y * amp);
      }
      return pts;
    };
    this.mtnA = mkRidge(46, 0.65);
    this.mtnB = mkRidge(80, 0.5);
    this.streaks = [];
    for (let i = 0; i < 26; i++) this.streaks.push(this.newStreak(true));

    /* ---- sky base (gradient + sun + halo + horizon glow) at 0.5x ---- */
    const S = SKY_SCALE;
    const sky = document.createElement("canvas");
    sky.width = Math.max(2, Math.round(w * S));
    sky.height = Math.max(2, Math.round(h * S));
    const sc = sky.getContext("2d");
    if (sc) {
      const sw = sky.width;
      const shz = Math.round(hz * S);
      const g = sc.createLinearGradient(0, 0, 0, shz * 1.7);
      g.addColorStop(0, "#03040c");
      g.addColorStop(0.55, "#0a0e2a");
      g.addColorStop(1, "#241247");
      sc.fillStyle = g;
      sc.fillRect(0, 0, sw, Math.ceil(shz * 1.7) + 1);
      /* darken below so drawImage premixes with track base seamlessly */
      sc.fillStyle = "#120a2e";
      sc.fillRect(0, Math.ceil(shz * 1.7), sw, sky.height);

      /* sun */
      const r = Math.min(w, h) * 0.19 * S;
      const sy = shz - r * 0.14;
      const sx = sw / 2;
      const sun = sc.createLinearGradient(0, sy - r, 0, sy + r);
      sun.addColorStop(0, "#ffd36b");
      sun.addColorStop(0.55, "#ff7ad9");
      sun.addColorStop(1, "#ff3df0");
      sc.fillStyle = sun;
      sc.beginPath();
      sc.arc(sx, sy, r, 0, Math.PI * 2);
      sc.fill();
      /* slice cutouts with the sky gradient */
      sc.fillStyle = g;
      for (let i = 0; i < 7; i++) {
        const y = sy + r * (0.02 + i * 0.14);
        sc.fillRect(sx - r * 1.2, y, r * 2.4, 1 + i * 1.9 * S);
      }
      /* halo */
      const halo = sc.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 2.6);
      halo.addColorStop(0, "rgba(255,61,240,0.22)");
      halo.addColorStop(1, "rgba(255,61,240,0)");
      sc.fillStyle = halo;
      sc.fillRect(sx - r * 2.6, sy - r * 2.6, r * 5.2, r * 5.2);

      /* horizon glow */
      const glow = sc.createLinearGradient(0, shz - 26 * S, 0, shz + 4 * S);
      glow.addColorStop(0, "rgba(61,245,255,0)");
      glow.addColorStop(1, "rgba(61,245,255,0.28)");
      sc.fillStyle = glow;
      sc.fillRect(0, shz - 26 * S, sw, 30 * S);
    }
    this.skyBase = sky;

    /* ---- track base (floor, fan, road body, edges) at full res ---- */
    const track = document.createElement("canvas");
    track.width = this.canvas.width;
    track.height = this.canvas.height;
    const tc = track.getContext("2d");
    if (tc) {
      tc.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const cx = w / 2;
      /* floor */
      const floor = tc.createLinearGradient(0, hz, 0, h);
      floor.addColorStop(0, "#120a2e");
      floor.addColorStop(0.35, "#0a0a24");
      floor.addColorStop(1, "#05060f");
      tc.fillStyle = floor;
      tc.fillRect(0, hz, w, h - hz);
      /* vertical fan */
      tc.lineWidth = 1;
      for (let k = -10; k <= 10; k++) {
        const xB = cx + k * w * 0.115;
        const xT = cx + k * w * 0.0075;
        const a = Math.max(0, 0.13 - Math.abs(k) * 0.009);
        tc.strokeStyle = `rgba(61,140,255,${a.toFixed(3)})`;
        tc.beginPath();
        tc.moveTo(xT, hz);
        tc.lineTo(xB, h);
        tc.stroke();
      }
      /* road body */
      tc.beginPath();
      tc.moveTo(cx - this.roadHalf(0), hz);
      tc.lineTo(cx + this.roadHalf(0), hz);
      tc.lineTo(cx + this.roadHalf(1.08), h);
      tc.lineTo(cx - this.roadHalf(1.08), h);
      tc.closePath();
      const rg = tc.createLinearGradient(0, hz, 0, h);
      rg.addColorStop(0, "rgba(10,12,30,0.95)");
      rg.addColorStop(1, "rgba(6,8,20,0.97)");
      tc.fillStyle = rg;
      tc.fill();
      /* edges */
      const edge = (x0: number, x1: number, color: string): void => {
        tc.strokeStyle = color;
        tc.globalAlpha = 0.16;
        tc.lineWidth = 7;
        tc.beginPath();
        tc.moveTo(x0, hz);
        tc.lineTo(x1, h);
        tc.stroke();
        tc.globalAlpha = 0.95;
        tc.lineWidth = 2;
        tc.beginPath();
        tc.moveTo(x0, hz);
        tc.lineTo(x1, h);
        tc.stroke();
        tc.globalAlpha = 1;
      };
      edge(cx - this.roadHalf(0), cx - this.roadHalf(1.08), C.cyan);
      edge(cx + this.roadHalf(0), cx + this.roadHalf(1.08), C.magenta);
    }
    this.trackBase = track;

    /* ---- vignette + scanlines (full css-res, one drawImage per frame) ---- */
    const vg = document.createElement("canvas");
    vg.width = Math.round(w);
    vg.height = Math.round(h);
    const vc = vg.getContext("2d");
    if (vc) {
      const g = vc.createRadialGradient(
        w / 2, h * 0.42, h * 0.24, w / 2, h / 2, w * 0.72
      );
      g.addColorStop(0, "rgba(2,3,10,0)");
      g.addColorStop(1, "rgba(2,3,10,0.6)");
      vc.fillStyle = g;
      vc.fillRect(0, 0, w, h);
      vc.fillStyle = "rgba(255,255,255,0.024)";
      for (let y = 0; y < h; y += 4) vc.fillRect(0, y, w, 1);
    }
    this.vignette = vg;
  }

  private newStreak(anyY = false): Streak {
    const side = Math.random() < 0.5 ? 0 : 1;
    const margin = this.w * 0.18;
    return {
      x: side === 0 ? Math.random() * margin : this.w - Math.random() * margin,
      y: anyY ? Math.random() * this.h : -40,
      len: 40 + Math.random() * 140,
      spd: 900 + Math.random() * 1400,
    };
  }

  /* ------- perspective helpers ------- */
  private horizonY(): number {
    return this.h * 0.315;
  }
  private crashY(): number {
    return this.h * 0.845;
  }
  private yFromT(t: number): number {
    const hz = this.horizonY();
    if (t < 0) return hz + (this.crashY() - hz) * t;
    return hz + (this.crashY() - hz) * Math.pow(Math.min(t, 1.06), 1.62);
  }
  private scFromT(t: number): number {
    return 0.5 + 1.22 * Math.pow(Math.max(0, Math.min(t, 1.05)), 1.62);
  }
  private roadHalf(t: number): number {
    const z = Math.max(0, Math.min(t, 1.1));
    return this.w * (0.05 + 0.41 * Math.pow(z, 1.4));
  }
  private fontScale(): number {
    return Math.max(0.66, Math.min(Math.min(this.w / 1100, this.h / 720), 1.15));
  }

  private font(px: number): string {
    const key = String(Math.round(px));
    let f = this.fontCache.get(key);
    if (!f) {
      f = `700 ${key}px "JetBrains Mono", monospace`;
      this.fontCache.set(key, f);
    }
    return f;
  }

  /* =================== main render =================== */

  render(g: Game, dtReal: number): void {
    /* adaptive resolution */
    if (g.quality !== this.appliedQ) {
      this.appliedQ = g.quality;
      this.resize();
    }

    const ctx = this.ctx;
    const { w, h } = this;
    const hz = this.horizonY();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    /* shake */
    const speedMicro =
      g.phase === "playing" ? (g.kmh / 520) * 1.6 + (g.boosting ? 1.6 : 0) : 0;
    /* respect the user's motion preference */
    const motion = this.reducedMotion ? 0.18 : 1;
    const amp = (g.trauma * g.trauma * 24 + speedMicro) * motion;
    const t = g.time;
    const shX = (Math.sin(t * 61.3) + Math.sin(t * 41.7) * 0.6) * amp * 0.55;
    const shY = (Math.cos(t * 53.7) + Math.sin(t * 47.3) * 0.6) * amp * 0.45;
    ctx.translate(shX, shY);

    /* baked sky */
    if (this.skyBase) ctx.drawImage(this.skyBase, -40, -40, w + 80, h + 80);

    /* stars (live twinkle, cheap rects) */
    const starMax = g.quality === 2 ? 0 : g.quality === 1 ? 45 : this.stars.length;
    if (starMax > 0) {
      ctx.fillStyle = "#bfe9ff";
      for (let i = 0; i < starMax; i++) {
        const s = this.stars[i];
        ctx.globalAlpha = (0.25 + 0.75 * Math.abs(Math.sin(t * s.sp + s.ph))) * 0.8;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;
    }

    /* mountains parallax */
    this.drawRidge(this.mtnB, hz, "#0d0f2e", g.distance * 0.008);
    if (g.quality < 2) this.drawRidge(this.mtnA, hz, "#090b20", g.distance * 0.02);

    /* baked track + moving details */
    if (this.trackBase) ctx.drawImage(this.trackBase, 0, 0, w, h);
    this.drawTrackLive(g);

    this.drawHazard(g);
    this.drawWords(g);
    this.drawCar(g, dtReal);
    this.drawBeamsAndParticles(g);
    this.drawFloats(g);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawToasts(g);
    this.drawCountdown(g);

    /* flashes */
    if (g.flashCyan > 0) {
      ctx.fillStyle = `rgba(61,245,255,${(g.flashCyan * 0.16).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (g.flashRed > 0) {
      const grd = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
      grd.addColorStop(0, "rgba(255,59,87,0)");
      grd.addColorStop(1, `rgba(255,30,60,${(g.flashRed * 0.5).toFixed(3)})`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }

    if (this.vignette) ctx.drawImage(this.vignette, 0, 0, w, h);
  }

  /* =================== layers =================== */

  private drawRidge(pts: number[], baseY: number, color: string, offset: number): void {
    const ctx = this.ctx;
    const { w } = this;
    const seg = w / ((pts.length - 1) / 2);
    const off = -(offset % w);
    ctx.fillStyle = color;
    for (let rep = -1; rep <= 1; rep++) {
      ctx.beginPath();
      ctx.moveTo(off + rep * w, baseY + 4);
      for (let i = 0; i < pts.length; i += 2) {
        ctx.lineTo(off + rep * w + (i / 2) * seg, baseY - Math.abs(pts[i]));
      }
      ctx.lineTo(off + rep * w + w, baseY + 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  /** moving grid rows + lane dashes (drawn over the baked track) */
  private drawTrackLive(g: Game): void {
    const ctx = this.ctx;
    const { w, h } = this;
    const hz = this.horizonY();
    const cx = w / 2;

    /* horizontal rows moving toward viewer */
    const N = 14;
    const p = (g.distance * 0.0022) % 1;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const z = (i + p) / (N + 1);
      const y = hz + (h - hz) * Math.pow(z, 2.2);
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.strokeStyle = "rgba(61,140,255,0.20)";
    ctx.stroke();

    /* lane dashes */
    const count = 12;
    const p2 = (g.distance * 0.0019) % 1;
    ctx.fillStyle = "rgba(174,249,255,0.55)";
    ctx.beginPath();
    for (const side of [-1 / 3, 1 / 3]) {
      for (let i = 0; i < count; i++) {
        const z0 = (i + p2) / count;
        const z1 = z0 + 0.45 / count;
        if (z0 <= 0.02) continue;
        const y0 = this.yFromT(z0 * 1.06);
        const y1 = this.yFromT(Math.min(z1 * 1.06, 1.06));
        const x0 = cx + side * this.roadHalf(z0);
        const x1 = cx + side * this.roadHalf(z1);
        const wh = 1.2 + z0 * 3.4;
        ctx.moveTo(x0 - wh, y0);
        ctx.lineTo(x0 + wh, y0);
        ctx.lineTo(x1 + wh * 1.4, y1);
        ctx.lineTo(x1 - wh * 1.4, y1);
        ctx.closePath();
      }
    }
    ctx.fill();
  }

  private drawHazard(g: Game): void {
    const ctx = this.ctx;
    const { w } = this;
    const cx = w / 2;
    const y = this.crashY();
    const half = this.roadHalf(1) * 1.02;
    const fs = this.fontScale();
    const bandH = 26 * fs;

    const grad = ctx.createLinearGradient(0, y - bandH, 0, y + bandH * 0.6);
    grad.addColorStop(0, "rgba(255,59,87,0)");
    grad.addColorStop(0.6, "rgba(255,59,87,0.20)");
    grad.addColorStop(1, "rgba(255,59,87,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - half, y - bandH, half * 2, bandH * 1.6);

    ctx.strokeStyle = "rgba(255,120,140,0.65)";
    ctx.lineWidth = 2.5 * fs;
    const gap = 52 * fs;
    const off = (g.time * 120) % gap;
    ctx.beginPath();
    for (let x = cx - half + off - gap; x < cx + half; x += gap) {
      ctx.moveTo(x - 8 * fs, y - 9 * fs);
      ctx.lineTo(x + 6 * fs, y);
      ctx.lineTo(x - 8 * fs, y + 9 * fs);
    }
    ctx.stroke();

    ctx.font = `700 ${Math.round(11 * fs)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(255,120,140,0.55)";
    ctx.fillText("— IMPACT LINE —", cx, y - 10 * fs);
  }

  private measureWord(ctx: CanvasRenderingContext2D, w: WordEnt): void {
    const refPx = 46;
    ctx.font = this.font(refPx);
    w.cw = [];
    w.tw = 0;
    for (const ch of w.text) {
      const cw = ctx.measureText(ch).width / refPx;
      w.cw.push(cw);
      w.tw += cw;
    }
  }

  private drawWords(g: Game): void {
    const ctx = this.ctx;
    const { w: vw } = this;
    const cx = vw / 2;
    const fs = this.fontScale();

    const sorted = [...g.words].sort((a, b) => a.t - b.t);
    for (const word of sorted) {
      if (word.t < -0.02) continue;
      if (!word.cw) this.measureWord(ctx, word);

      const px = 46 * fs * this.scFromT(word.t) * 0.72;
      word.sc = px / 46;
      const x = cx + word.lane * this.roadHalf(Math.max(0.12, word.t));
      const y = this.yFromT(word.t);
      word.sx = x;
      word.sy = y;

      const tw = (word.tw ?? 1) * px;
      const padX = 14 * word.sc;
      const padY = 9 * word.sc;
      const accent = word.boss ? C.magenta : C.cyan;

      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(x, y + 18 * word.sc, tw * 0.5 + padX, 9 * word.sc, 0, 0, Math.PI * 2);
      ctx.fill();

      if (word.boss) {
        ctx.fillStyle = "rgba(255,61,240,0.10)";
        const r = tw * 0.6 + 26 * word.sc;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const cdX = x - tw / 2 - padX;
      const cdY = y - (px * 0.5 + padY);
      const cdW = tw + padX * 2;
      const cdH = px + padY * 2;
      ctx.fillStyle = word.boss ? "rgba(26,6,26,0.78)" : "rgba(5,10,24,0.78)";
      this.rr(cdX, cdY, cdW, cdH, 6 * word.sc);
      ctx.fill();
      ctx.strokeStyle = word.locked
        ? accent
        : `rgba(94,125,180,${(0.25 + 0.45 * Math.min(word.t, 0.7)).toFixed(2)})`;
      ctx.lineWidth = word.locked ? 2 : 1;
      ctx.stroke();

      if (word.locked) {
        const bl = 9 * word.sc;
        const pulse = 1 + Math.sin(g.time * 12) * 0.12;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.4 * pulse;
        const bx = cdX - 6 * word.sc * pulse;
        const by = cdY - 6 * word.sc * pulse;
        const bw = cdW + 12 * word.sc * pulse;
        const bh = cdH + 12 * word.sc * pulse;
        ctx.beginPath();
        ctx.moveTo(bx, by + bl); ctx.lineTo(bx, by); ctx.lineTo(bx + bl, by);
        ctx.moveTo(bx + bw - bl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bl);
        ctx.moveTo(bx + bw, by + bh - bl); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw - bl, by + bh);
        ctx.moveTo(bx + bl, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + bh - bl);
        ctx.stroke();
      }

      ctx.font = this.font(px);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let lx = x - tw / 2;
      for (let i = 0; i < word.text.length; i++) {
        const chw = (word.cw?.[i] ?? 0.6) * px;
        if (i < word.progress) ctx.fillStyle = accent;
        else if (word.flash > 0) ctx.fillStyle = C.red;
        else if (i === word.progress && word.locked) ctx.fillStyle = "#ffffff";
        else ctx.fillStyle = word.boss ? "#ffd7fb" : "#dcebff";
        ctx.fillText(word.text[i], lx, y + px * 0.03);
        if (word.locked && i === word.progress && Math.sin(g.time * 10) > 0) {
          ctx.fillRect(lx, y + px * 0.52, chw * 0.92, Math.max(2, px * 0.06));
        }
        lx += chw;
      }

      if (word.progress > 0) {
        const frac = word.progress / word.text.length;
        ctx.fillStyle = "rgba(94,125,180,0.35)";
        ctx.fillRect(cdX, cdY + cdH + 3 * word.sc, cdW, 2.5 * word.sc);
        ctx.fillStyle = accent;
        ctx.fillRect(cdX, cdY + cdH + 3 * word.sc, cdW * frac, 2.5 * word.sc);
      }
    }
  }

  private drawCar(g: Game, dtReal: number): void {
    const ctx = this.ctx;
    const { w, h } = this;
    const cx = w / 2;
    const u = Math.max(0.7, Math.min(h * 0.155, 138) / 100);
    const cy = h * 0.885 + g.carSpeedBob;
    g.carCX = cx;
    g.carCY = cy;
    g.carNoseX = cx;
    g.carNoseY = cy - 52 * u;

    const showCar = g.phase !== "dying" || g.phaseTime < 0.05;

    /* speed streaks */
    const intensity =
      g.phase === "playing"
        ? Math.max(0, (g.kmh - 300) / 220) + (g.boosting ? 0.9 : 0)
        : 0;
    if (intensity > 0.05 && g.quality < 2) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of this.streaks) {
        s.y += s.spd * dtReal * (0.6 + intensity);
        if (s.y - s.len > h) Object.assign(s, this.newStreak());
        const a = Math.min(0.35, 0.12 * intensity + Math.random() * 0.05);
        ctx.strokeStyle = `rgba(174,249,255,${a.toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - s.len * intensity);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (!showCar) return;

    /* underglow */
    const glow = ctx.createRadialGradient(cx, cy + 20 * u, 4, cx, cy + 20 * u, 52 * u);
    glow.addColorStop(0, g.boosting ? "rgba(255,61,240,0.5)" : "rgba(61,245,255,0.4)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 20 * u, 56 * u, 18 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(g.carTilt * 0.04 + Math.sin(g.time * 1.8) * 0.012);

    /* thruster flames */
    ctx.globalCompositeOperation = "lighter";
    for (const side of [-1, 1]) {
      const fx = side * 13 * u;
      const flick = 0.72 + 0.5 * Math.abs(Math.sin(g.time * 43 + side * 2.7));
      const len = (g.boosting ? 52 : g.phase === "playing" ? 22 : 12) * u * flick;
      const grad = ctx.createLinearGradient(0, 44 * u, 0, 44 * u + len);
      grad.addColorStop(0, g.boosting ? "rgba(255,255,255,0.95)" : "rgba(190,250,255,0.9)");
      grad.addColorStop(0.35, g.boosting ? "rgba(255,61,240,0.75)" : "rgba(61,245,255,0.6)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(fx - 6 * u, 44 * u);
      ctx.lineTo(fx + 6 * u, 44 * u);
      ctx.lineTo(fx, 44 * u + len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    /* hull */
    const hull = ctx.createLinearGradient(0, -52 * u, 0, 48 * u);
    hull.addColorStop(0, "#1a2145");
    hull.addColorStop(0.5, "#10152e");
    hull.addColorStop(1, "#080a18");
    ctx.beginPath();
    ctx.moveTo(0, -52 * u);
    ctx.lineTo(9 * u, -30 * u);
    ctx.lineTo(15 * u, -8 * u);
    ctx.lineTo(30 * u, 12 * u);
    ctx.lineTo(27 * u, 40 * u);
    ctx.lineTo(10 * u, 46 * u);
    ctx.lineTo(-10 * u, 46 * u);
    ctx.lineTo(-27 * u, 40 * u);
    ctx.lineTo(-30 * u, 12 * u);
    ctx.lineTo(-15 * u, -8 * u);
    ctx.lineTo(-9 * u, -30 * u);
    ctx.closePath();
    ctx.fillStyle = hull;
    ctx.fill();
    ctx.strokeStyle = g.boosting ? "rgba(255,61,240,0.95)" : "rgba(61,245,255,0.9)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    /* canopy */
    const canopy = ctx.createLinearGradient(0, -30 * u, 0, 4 * u);
    canopy.addColorStop(0, "rgba(160,240,255,0.95)");
    canopy.addColorStop(1, "rgba(40,90,160,0.55)");
    ctx.beginPath();
    ctx.ellipse(0, -14 * u, 6.5 * u, 16 * u, 0, 0, Math.PI * 2);
    ctx.fillStyle = canopy;
    ctx.fill();

    /* accents + tail light */
    ctx.strokeStyle = "rgba(61,245,255,0.5)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-22 * u, 8 * u);
    ctx.lineTo(-16 * u, 34 * u);
    ctx.moveTo(22 * u, 8 * u);
    ctx.lineTo(16 * u, 34 * u);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,61,240,0.95)";
    ctx.fillRect(-20 * u, 40 * u, 40 * u, 3 * u);

    ctx.restore();

    /* recovery shield */
    if (g.recovery > 0 && g.phase === "playing") {
      const a = (0.35 + 0.35 * Math.sin(g.time * 16)) * Math.min(1, g.recovery);
      ctx.strokeStyle = `rgba(61,245,255,${a.toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 64 * u, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawBeamsAndParticles(g: Game): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const l of g.lasers) {
      const a = l.life / l.max;
      ctx.strokeStyle = l.color;
      ctx.globalAlpha = a * 0.35;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.globalAlpha = a * 0.9;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const p of g.particles) {
      const a = Math.max(0, p.life / p.max);
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = a;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.028, p.y - p.vy * 0.028);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const r of g.rings) {
      const a = (r.life / r.max) * 0.8;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = a;
      ctx.lineWidth = r.width * (r.life / r.max);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawFloats(g: Game): void {
    const ctx = this.ctx;
    for (const f of g.floats) {
      const a = Math.min(1, (f.life / f.max) * 2);
      ctx.globalAlpha = a;
      ctx.font = `800 ${Math.round(f.size)}px "Orbitron", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawToasts(g: Game): void {
    const ctx = this.ctx;
    const { w, h } = this;
    let y = h * 0.15;
    for (const toast of g.toasts.slice(0, 2)) {
      const inA = Math.min(1, (toast.max - toast.life) * 6);
      const outA = Math.min(1, toast.life * 2);
      const a = Math.min(inA, outA);
      const scale = 1 + (1 - inA) * 0.25;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(w / 2, y);
      ctx.scale(scale, scale);
      ctx.font = `900 ${Math.round(30 * this.fontScale())}px "Orbitron", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = toast.color;
      ctx.fillText(toast.text, 0, 0);
      ctx.font = `600 ${Math.round(13 * this.fontScale())}px "Rajdhani", sans-serif`;
      ctx.fillStyle = "rgba(207,230,255,0.85)";
      ctx.fillText(toast.sub.toUpperCase(), 0, 26 * this.fontScale());
      ctx.restore();
      y += 64;
    }
  }

  private drawCountdown(g: Game): void {
    const ctx = this.ctx;
    const { w, h } = this;
    const fs = this.fontScale();

    if (g.phase === "countdown") {
      const idx = Math.min(2, g.countdownIdx);
      const num = 3 - idx;
      if (num >= 1 && g.countdownIdx >= 0) {
        const frac = (g.phaseTime % 0.55) / 0.55;
        const scale = 1.35 - frac * 0.4;
        ctx.save();
        ctx.translate(w / 2, h * 0.4);
        ctx.scale(scale, scale);
        ctx.font = `900 ${Math.round(92 * fs)}px "Orbitron", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(61,245,255,0.25)";
        ctx.fillText(String(num), 0, 4);
        ctx.fillStyle = "#eafcff";
        ctx.fillText(String(num), 0, 0);
        ctx.restore();
      }
    } else if (g.phase === "playing" && g.goFlash > 0) {
      const k = 1 - g.goFlash / 0.65;
      ctx.save();
      ctx.translate(w / 2, h * 0.4);
      ctx.scale(0.9 + k * 0.35, 0.9 + k * 0.35);
      ctx.globalAlpha = 1 - k;
      ctx.font = `900 ${Math.round(96 * fs)}px "Orbitron", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#3df5ff";
      ctx.fillText("GO!", 0, 0);
      ctx.restore();
    }
  }

  private rr(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
