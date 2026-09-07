import {
  Crosshair,
  Flame,
  Gauge,
  Home,
  Keyboard,
  Pause,
  Play,
  Rocket,
  RotateCcw,
  Save,
  Share2,
  Shield,
  Smartphone,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DIFFICULTIES,
  type Difficulty,
  type Game,
  type RunStats,
} from "../game/engine";
import type { ScoreEntry } from "../game/storage";

/* ---------------- shared bits ---------------- */

function Corners() {
  return (
    <>
      <span className="hud-corner border-t border-l" style={{ top: 6, left: 6 }} />
      <span className="hud-corner border-t border-r" style={{ top: 6, right: 6 }} />
      <span className="hud-corner border-b border-l" style={{ bottom: 6, left: 6 }} />
      <span className="hud-corner border-b border-r" style={{ bottom: 6, right: 6 }} />
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-display text-[10px] font-bold uppercase tracking-[0.34em]"
      style={{ color: "rgba(61,245,255,0.75)" }}
    >
      {children}
    </div>
  );
}

export function HighScoreTable({
  scores,
  highlightId,
  dense,
}: {
  scores: ScoreEntry[];
  highlightId?: string | null;
  dense?: boolean;
}) {
  return (
    <div className="w-full">
      {scores.map((s, i) => (
        <div
          key={s.id}
          className={`score-row flex items-center gap-3 px-3 ${
            dense ? "py-1.5" : "py-2"
          } ${s.id === highlightId ? "score-row--you" : ""}`}
        >
          <span
            className="font-display w-6 text-center text-xs font-bold"
            style={{
              color:
                i === 0
                  ? "#ffb54d"
                  : i === 1
                    ? "#cfe6ff"
                    : i === 2
                      ? "#d78bff"
                      : "rgba(93,120,168,0.9)",
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="font-ui flex-1 truncate text-sm font-bold tracking-[0.18em] text-mist">
            {s.name}
            {s.id === highlightId && (
              <span className="text-glow-cyan ml-2 font-display text-[9px] tracking-[0.22em] text-neon">
                YOU
              </span>
            )}
          </span>
          {s.diff && (
            <span
              className="font-display shrink-0 text-[8px] font-bold tracking-[0.2em]"
              style={{ color: "rgba(93,120,168,0.85)" }}
              title={DIFFICULTIES[s.diff].label}
            >
              {s.diff === "cruise" ? "C" : s.diff === "pro" ? "P" : "A"}
            </span>
          )}
          <span className="hidden font-display text-[10px] font-bold tracking-widest text-[rgba(93,120,168,1)] sm:block">
            {s.wpm} WPM
          </span>
          <span
            className="font-type text-sm font-bold"
            style={{ color: i === 0 ? "#ffb54d" : "#3df5ff" }}
          >
            {s.score.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- menu ---------------- */

export function MenuScreen({
  scores,
  isTouch,
  muted,
  difficulty,
  onPickDifficulty,
  onStart,
  onToggleMute,
}: {
  scores: ScoreEntry[];
  isTouch: boolean;
  muted: boolean;
  difficulty: Difficulty;
  onPickDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto">
      <div className="flex min-h-full flex-col items-center justify-center gap-7 px-4 py-8 lg:flex-row lg:gap-14">
        {/* left: brand + actions */}
        <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          <div
            className="animate-fade-up font-ui flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.42em]"
            style={{ color: "rgba(255,61,240,0.9)", animationDelay: "0ms" }}
          >
            <Rocket size={13} strokeWidth={2.5} />
            neon typing racer
          </div>

          <h1
            className="title-glitch animate-fade-up font-display mt-3 text-[clamp(2.8rem,8vw,5.4rem)] font-black italic leading-[0.92] tracking-tight"
            style={{ animationDelay: "70ms" }}
          >
            VELOCI
            <span className="title-sub" style={{ color: "#ff3df0" }}>
              TYPE
            </span>
          </h1>

          <p
            className="animate-fade-up font-ui mt-4 max-w-md text-[15px] font-semibold leading-relaxed"
            style={{ color: "rgba(207,230,255,0.75)", animationDelay: "140ms" }}
          >
            Words are falling down the highway. Type them before they cross the
            impact line — every keystroke fires your thrusters. Chain combos,
            charge nitro, outrun your own record.
          </p>

          {/* difficulty selector */}
          <div
            className="animate-fade-up mt-7 flex flex-col items-center gap-2.5 lg:items-start"
            style={{ animationDelay: "180ms" }}
          >
            <SectionLabel>difficulty</SectionLabel>
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start" role="group" aria-label="difficulty">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onPickDifficulty(d)}
                  aria-pressed={d === difficulty}
                  className={`diff-chip ${d === difficulty ? "diff-chip--on" : ""}`}
                >
                  <span className="font-display block text-[11px] font-black tracking-[0.22em]">
                    {DIFFICULTIES[d].label}
                  </span>
                  <span className="font-ui block text-[9px] font-bold uppercase tracking-[0.16em] opacity-70">
                    {DIFFICULTIES[d].hull} hull · {DIFFICULTIES[d].tagline}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div
            className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            style={{ animationDelay: "240ms" }}
          >
            <button className="btn-neon px-9 py-4 text-base" onClick={onStart}>
              <Play size={18} strokeWidth={2.8} />
              {isTouch ? "Tap to race" : "Start engine"}
            </button>
            <button
              className="btn-ghost px-5 py-4 text-xs"
              onClick={onToggleMute}
              aria-label="toggle sound"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {muted ? "Muted" : "Sound"}
            </button>
          </div>

          {/* how to play */}
          <div
            className="animate-fade-up mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
            style={{ animationDelay: "280ms" }}
          >
            {[
              {
                icon: isTouch ? Smartphone : Keyboard,
                title: isTouch ? "Tap & type" : "Type words",
                body: "First matching letter locks a target word.",
              },
              {
                icon: Shield,
                title: `${DIFFICULTIES[difficulty].hull} hull charges`,
                body: "A word hitting the line costs one. Lose all — wrecked.",
              },
              {
                icon: Zap,
                title: isTouch ? "Nitro button" : "SPACE = nitro",
                body: "Full bar gives 3s of triple-score boost.",
              },
            ].map((s) => (
              <div key={s.title} className="stat-cell px-3 py-3 text-left">
                <div className="flex items-center gap-2 text-neon">
                  <s.icon size={14} strokeWidth={2.4} />
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em]">
                    {s.title}
                  </span>
                </div>
                <p className="font-ui mt-1.5 text-xs font-semibold leading-snug text-[rgba(207,230,255,0.6)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          {!isTouch && (
            <div
              className="animate-fade-up mt-5 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(93,120,168,1)]"
              style={{ animationDelay: "340ms" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="kbd">A–Z</span> fire
              </span>
              <span className="flex items-center gap-1.5">
                <span className="kbd">SPACE</span> nitro
              </span>
              <span className="flex items-center gap-1.5">
                <span className="kbd">ESC</span> pause
              </span>
            </div>
          )}
        </div>

        {/* right: leaderboard */}
        <div
          className="animate-fade-up hud-panel w-full max-w-sm p-5"
          style={{ animationDelay: "240ms" }}
        >
          <Corners />
          <div className="flex items-center justify-between">
            <SectionLabel>
              <span className="flex items-center gap-2">
                <Trophy size={12} /> local leaderboard
              </span>
            </SectionLabel>
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.3em] text-[rgba(93,120,168,0.9)]">
              top 8
            </span>
          </div>
          <div className="my-3 h-px" style={{ background: "linear-gradient(90deg, rgba(61,245,255,0.4), transparent)" }} />
          <HighScoreTable scores={scores} />
          <p className="font-ui mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(93,120,168,0.7)]">
            stored on this device
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- HUD ---------------- */

export function Hud({
  game,
  isTouch,
  muted,
  onPause,
  onNitro,
  onToggleMute,
}: {
  game: Game;
  isTouch: boolean;
  muted: boolean;
  onPause: () => void;
  onNitro: () => void;
  onToggleMute: () => void;
}) {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const wpmRef = useRef<HTMLSpanElement>(null);
  const kmhRef = useRef<HTMLSpanElement>(null);
  const chainRef = useRef<HTMLDivElement>(null);
  const nitroFillRef = useRef<HTMLDivElement>(null);
  const nitroLabelRef = useRef<HTMLSpanElement>(null);
  const nitroBtnRef = useRef<HTMLButtonElement>(null);
  const shieldRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const hullMax = game.cfg.hull;

  useEffect(() => {
    const id = window.setInterval(() => {
      /* score */
      if (scoreRef.current)
        scoreRef.current.textContent = Math.floor(game.score).toLocaleString();
      if (distRef.current)
        distRef.current.textContent = `${Math.floor(game.distance).toLocaleString()}M`;
      if (wpmRef.current) wpmRef.current.textContent = String(game.wpmWindow);
      if (kmhRef.current) kmhRef.current.textContent = String(game.kmh);

      /* chain */
      if (chainRef.current) {
        const c = game.combo;
        chainRef.current.style.opacity = c >= 2 ? "1" : "0";
        chainRef.current.style.transform = c >= 2 ? "scale(1)" : "scale(0.85)";
        chainRef.current.textContent = `CHAIN x${game.mult
          .toFixed(2)
          .replace(/\.?0+$/, "")}`;
        chainRef.current.style.color = c >= 8 ? "#ff3df0" : "#ffb54d";
      }

      /* nitro */
      const pct = Math.min(100, game.nitro);
      if (nitroFillRef.current) {
        nitroFillRef.current.style.width = `${pct}%`;
        nitroFillRef.current.style.background =
          pct >= 100
            ? "linear-gradient(90deg,#ff3df0,#ff8df6)"
            : "linear-gradient(90deg,#17a9c4,#3df5ff)";
      }
      if (nitroLabelRef.current) {
        const ready = game.nitroReady;
        nitroLabelRef.current.textContent = game.boosting
          ? "BOOSTING"
          : ready
            ? "NITRO READY"
            : "NITRO";
        nitroLabelRef.current.style.color = ready || game.boosting ? "#ff3df0" : "rgba(174,249,255,0.8)";
        nitroLabelRef.current.classList.toggle("animate-pulse-soft", ready);
      }
      if (nitroBtnRef.current) {
        const ready = game.nitroReady;
        nitroBtnRef.current.style.opacity = ready ? "1" : "0.45";
        nitroBtnRef.current.style.boxShadow = ready
          ? "0 0 26px rgba(255,61,240,0.8)"
          : "none";
      }

      /* shields */
      shieldRefs.current.forEach((el, i) => {
        if (!el) return;
        const alive = i < game.shields;
        el.style.opacity = alive ? "1" : "0.16";
        el.style.color = alive ? "#3df5ff" : "#5d78a8";
      });
    }, 90);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* top-left: score */}
      <div className="absolute left-4 top-4 sm:left-6 sm:top-5">
        <SectionLabel>score</SectionLabel>
        <span
          ref={scoreRef}
          className="text-glow-cyan font-display block text-3xl font-black tracking-wide text-[#eafcff] sm:text-4xl"
        >
          0
        </span>
        <span
          ref={distRef}
          className="font-type text-[11px] font-bold tracking-[0.3em] text-[rgba(93,120,168,1)]"
        >
          0M
        </span>
      </div>

      {/* top-center: chain */}
      <div className="absolute left-1/2 top-[4.6rem] -translate-x-1/2 sm:top-5">
        <div
          ref={chainRef}
          className="font-display text-xl font-black tracking-[0.14em] transition-all duration-200 sm:text-2xl"
          style={{ opacity: 0, textShadow: "0 0 16px rgba(255,181,77,0.7)" }}
        >
          CHAIN x1
        </div>
      </div>

      {/* top-right: speed, wpm, buttons */}
      <div className="absolute right-4 top-4 flex items-start gap-4 sm:right-6 sm:top-5">
        <div className="text-right">
          <SectionLabel>
            <span className="flex items-center justify-end gap-1.5">
              <Gauge size={11} /> speed
            </span>
          </SectionLabel>
          <div className="font-display text-2xl font-black text-[#eafcff] sm:text-3xl">
            <span ref={kmhRef}>0</span>
            <span className="ml-1 text-[10px] font-bold text-[rgba(93,120,168,1)]">KM/H</span>
          </div>
          <div className="font-ui text-[11px] font-bold tracking-[0.2em] text-[rgba(174,249,255,0.75)]">
            <span ref={wpmRef}>0</span> WPM
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            className="btn-ghost pointer-events-auto h-9 w-9 p-0"
            onClick={onPause}
            aria-label="pause"
          >
            <Pause size={15} />
          </button>
          <button
            className="btn-ghost pointer-events-auto h-9 w-9 p-0"
            onClick={onToggleMute}
            aria-label="mute"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      {/* bottom-left: hull */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
        <SectionLabel>hull</SectionLabel>
        <div className="mt-1.5 flex gap-1.5">
          {Array.from({ length: hullMax }, (_, i) => (
            <span
              key={i}
              ref={(el) => {
                shieldRefs.current[i] = el;
              }}
              className="transition-opacity duration-300"
            >
              <Shield size={22} strokeWidth={2.2} fill="currentColor" />
            </span>
          ))}
        </div>
      </div>

      {/* bottom-right: nitro */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end sm:bottom-6 sm:right-6">
        <span
          ref={nitroLabelRef}
          className="font-display text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ color: "rgba(174,249,255,0.8)" }}
        >
          nitro
        </span>
        <div
          className="mt-1.5 h-3 w-40 overflow-hidden border sm:w-52"
          style={{
            borderColor: "rgba(61,245,255,0.35)",
            background: "rgba(5,8,18,0.7)",
            clipPath:
              "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
          }}
        >
          <div
            ref={nitroFillRef}
            className="h-full transition-[width] duration-150 ease-linear"
            style={{ width: "0%", background: "linear-gradient(90deg,#17a9c4,#3df5ff)" }}
          />
        </div>
        {!isTouch && (
          <span className="font-ui mt-1 text-[9px] font-bold uppercase tracking-[0.26em] text-[rgba(93,120,168,0.9)]">
            space to ignite
          </span>
        )}
        {isTouch && (
          <button
            ref={nitroBtnRef}
            className="btn-neon btn-neon--pink pointer-events-auto mt-3 px-6 py-3 text-xs"
            onPointerDown={(e) => {
              e.preventDefault();
              onNitro();
            }}
          >
            <Zap size={14} strokeWidth={2.8} />
            nitro
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- pause ---------------- */

export function PauseScreen({
  game,
  onResume,
  onRestart,
  onMenu,
}: {
  game: Game;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const [live, setLive] = useState({
    score: 0,
    wpm: 0,
    acc: 100,
    words: 0,
    timeMs: 0,
  });

  useEffect(() => {
    const tick = () =>
      setLive({
        score: Math.floor(game.score),
        wpm: game.wpmWindow,
        acc: game.accuracy,
        words: game.wordsTyped,
        timeMs: Math.round(game.elapsed * 1000),
      });
    tick();
    const id = window.setInterval(tick, 90);
    return () => window.clearInterval(id);
  }, [game]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(3,4,12,0.55)] px-4 backdrop-blur-[3px]">
      <div className="animate-pop hud-panel w-full max-w-sm p-7 text-center">
        <Corners />
        <SectionLabel>
          <span className="flex items-center justify-center gap-2">
            <Pause size={12} /> race paused
          </span>
        </SectionLabel>
        <div className="font-display mt-3 text-5xl font-black tracking-wide text-[#eafcff]">
          {live.score.toLocaleString()}
        </div>
        <div className="font-ui text-[11px] font-bold uppercase tracking-[0.3em] text-[rgba(93,120,168,1)]">
          points so far
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {[
            { icon: Gauge, label: "WPM", value: String(live.wpm) },
            { icon: Crosshair, label: "ACC", value: `${live.acc}%` },
            { icon: Keyboard, label: "WORDS", value: String(live.words) },
            { icon: Timer, label: "TIME", value: fmtTime(live.timeMs) },
          ].map((c) => (
            <div key={c.label} className="stat-cell flex flex-col items-center px-1 py-2">
              <c.icon size={12} className="text-neon" strokeWidth={2.4} />
              <span className="font-display mt-0.5 text-xs font-black text-[#eafcff]">
                {c.value}
              </span>
              <span className="font-ui text-[8px] font-bold uppercase tracking-[0.18em] text-[rgba(93,120,168,1)]">
                {c.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button className="btn-neon px-6 py-3.5 text-sm" onClick={onResume}>
            <Play size={16} strokeWidth={2.8} /> resume
          </button>
          <button className="btn-ghost px-6 py-3 text-xs" onClick={onRestart}>
            <RotateCcw size={14} /> restart run
          </button>
          <button className="btn-ghost btn-ghost--danger px-6 py-3 text-xs" onClick={onMenu}>
            <Home size={14} /> quit to menu
          </button>
        </div>
        <p className="font-ui mt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[rgba(93,120,168,0.8)]">
          esc resume · R restart
        </p>
      </div>
    </div>
  );
}

/* ---------------- game over ---------------- */

function useCountUp(target: number, dur = 950): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number): void => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setVal(Math.round(target * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return val;
}

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const SHARE_URL = "https://imfufuu.github.io/velocitype/";

export function GameOverScreen({
  stats,
  scores,
  highlightId,
  needsName,
  bestBefore,
  onSaveName,
  onRestart,
  onMenu,
}: {
  stats: RunStats;
  scores: ScoreEntry[];
  highlightId: string | null;
  needsName: boolean;
  /** best score on the board before this run — used for the "new record" badge */
  bestBefore: number;
  onSaveName: (name: string) => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const shown = useCountUp(stats.score);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);
  const isRecord = stats.score > 0 && stats.score > bestBefore;

  const shareRun = async () => {
    const text = `I wrecked the track with ${stats.score.toLocaleString()} pts in VELOCITYPE — ${stats.wpm} WPM · ${stats.accuracy}% accuracy · x${stats.maxCombo} max chain. Beat my run:`;
    const payload = `${text} ${SHARE_URL}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "VELOCITYPE — Neon Typing Racer",
          text: payload,
        });
        return;
      }
      await navigator.clipboard.writeText(payload);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[rgba(3,4,12,0.6)] backdrop-blur-[3px]">
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <div className="animate-pop hud-panel w-full max-w-lg p-6 sm:p-8">
          <Corners />
          <div className="text-center">
            <SectionLabel>
              <span className="flex items-center justify-center gap-2 text-[rgba(255,59,87,0.9)]">
                <Flame size={12} /> hull destroyed
              </span>
            </SectionLabel>
            <h2 className="font-display mt-2 text-4xl font-black italic tracking-tight text-[#eafcff] sm:text-5xl">
              RUN <span style={{ color: "#ff3b57", textShadow: "0 0 22px rgba(255,59,87,0.6)" }}>WRECKED</span>
            </h2>
            {isRecord && (
              <div
                className="animate-blink font-display mx-auto mt-2 inline-block px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]"
                style={{ background: "rgba(255,181,77,0.15)", color: "#ffb54d", border: "1px solid rgba(255,181,77,0.5)" }}
              >
                new record
              </div>
            )}
            <div className="text-glow-cyan font-display mt-3 text-5xl font-black text-[#eafcff] sm:text-6xl">
              {shown.toLocaleString()}
            </div>
            <div className="font-ui text-[11px] font-bold uppercase tracking-[0.3em] text-[rgba(93,120,168,1)]">
              final score
            </div>
          </div>

          {/* stat grid */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              { icon: Gauge, label: "WPM", value: String(stats.wpm) },
              { icon: Timer, label: "BEST", value: `${stats.bestWpm}w` },
              { icon: Crosshair, label: "ACC", value: `${stats.accuracy}%` },
              { icon: Zap, label: "CHAIN", value: `x${stats.maxCombo}` },
              { icon: Keyboard, label: "WORDS", value: String(stats.words) },
              { icon: Rocket, label: "TIME", value: fmtTime(stats.timeMs) },
            ].map((c) => (
              <div key={c.label} className="stat-cell flex flex-col items-center px-1 py-2.5">
                <c.icon size={13} className="text-neon" strokeWidth={2.4} />
                <span className="font-display mt-1 text-sm font-black text-[#eafcff]">
                  {c.value}
                </span>
                <span className="font-ui text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(93,120,168,1)]">
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {/* name entry */}
          {needsName && (
            <div className="animate-fade-up mt-5 flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 10))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveName(name.trim() || "YOU");
                }}
                placeholder="ENTER PILOT NAME"
                className="name-input font-display h-11 flex-1 px-4 text-sm font-bold tracking-[0.2em] placeholder:text-[rgba(93,120,168,0.6)]"
                autoFocus
              />
              <button
                className="btn-neon h-11 px-5 text-xs"
                onClick={() => onSaveName(name.trim() || "YOU")}
              >
                <Save size={14} /> save
              </button>
            </div>
          )}

          {/* leaderboard */}
          <div className="mt-5">
            <SectionLabel>
              <span className="flex items-center gap-2">
                <Trophy size={11} /> leaderboard
              </span>
            </SectionLabel>
            <div className="mb-2 mt-2 h-px" style={{ background: "linear-gradient(90deg, rgba(61,245,255,0.35), transparent)" }} />
            <HighScoreTable scores={scores.slice(0, 5)} highlightId={highlightId} dense />
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button className="btn-neon flex-1 px-6 py-3.5 text-sm" onClick={onRestart}>
              <RotateCcw size={16} strokeWidth={2.8} /> retry — R
            </button>
            <button
              className="btn-ghost flex-1 px-6 py-3.5 text-xs"
              onClick={shareRun}
              disabled={shared}
            >
              <Share2 size={14} /> {shared ? "copied!" : "share run"}
            </button>
            <button className="btn-ghost flex-1 px-6 py-3.5 text-xs" onClick={onMenu}>
              <Home size={14} /> menu — esc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
