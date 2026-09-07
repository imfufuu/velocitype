import { useEffect, useRef, useState } from "react";
import { Sfx } from "../game/audio";
import { Game, type RunStats, type Difficulty } from "../game/engine";
import { Renderer } from "../game/renderer";
import {
  addScore,
  getDifficulty,
  getScores,
  qualifies,
  ScoreEntry,
  setDifficulty,
} from "../game/storage";
import { GameOverScreen, Hud, MenuScreen, PauseScreen } from "./Overlays";

export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const gameRef = useRef<Game | null>(null);
  const sfxRef = useRef<Sfx | null>(null);

  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<string>("menu");
  const [stats, setStats] = useState<RunStats | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>(() => getScores());
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [needsName, setNeedsName] = useState(false);
  const [difficulty, setDifficultyState] = useState<Difficulty>(getDifficulty);
  const [bestBefore, setBestBefore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isTouch] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window)
  );

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const focusKeyboard = () => {
    if (isTouch && hiddenInputRef.current) {
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  };

  const startRun = () => {
    const g = gameRef.current;
    const sfx = sfxRef.current;
    if (!g || !sfx) return;
    sfx.unlock();
    sfx.ui();
    setHighlightId(null);
    setNeedsName(false);
    setBestBefore(Math.max(0, ...getScores().map((s) => s.score)));
    focusKeyboard();
    g.startRun();
  };

  const onPickDifficulty = (d: Difficulty) => {
    setDifficultyState(d);
    setDifficulty(d);
    if (gameRef.current) gameRef.current.difficulty = d;
    sfxRef.current?.unlock();
    sfxRef.current?.ui();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sfx = new Sfx();
    sfxRef.current = sfx;
    setMuted(sfx.muted);

    const g = new Game(sfx, (p, runStats) => {
      setPhase(p);
      if (p === "gameover" && runStats) {
        setStats(runStats);
        setScores(getScores());
        setNeedsName(qualifies(runStats.score));
        setHighlightId(null);
      }
    });
    g.touchUi = isTouch;
    gameRef.current = g;
    setGame(g);
    setScores(getScores());

    const renderer = new Renderer(canvas);
    const ctx = canvas.getContext("2d");
    /* debug/test hook — dev builds only */
    if (import.meta.env.DEV) {
      (window as unknown as { __game: Game }).__game = g;
    }

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      g.update(dt);
      if (ctx) renderer.render(g, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /* ---- resize ---- */
    const onResize = () => renderer.resize();
    const ro = new ResizeObserver(onResize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", onResize);

    /* ---- physical keyboard ---- */
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        active.tagName === "INPUT" &&
        active !== hiddenInputRef.current
      ) {
        if (e.key === "Escape") (active as HTMLInputElement).blur();
        return; // typing a pilot name
      }
      if (e.repeat && e.key.length === 1) return;

      switch (g.phase) {
        case "playing":
          if (e.key === "Escape") {
            e.preventDefault();
            g.togglePause();
          } else if (e.key === " ") {
            e.preventDefault();
            g.activateNitro();
          } else if (
            e.key.length === 1 &&
            /^[a-zA-Z]$/.test(e.key) &&
            !e.metaKey &&
            !e.ctrlKey &&
            !e.altKey
          ) {
            e.preventDefault();
            g.inputChar(e.key);
          }
          break;
        case "countdown":
          if (e.key === "Escape") g.togglePause();
          break;
        case "paused":
          if (e.key === "Escape" || e.key === "Enter") g.togglePause();
          else if (e.key.toLowerCase() === "r") startRunVia(sfx, g);
          else if (e.key.toLowerCase() === "m") toggleMuteVia(sfx);
          break;
        case "menu":
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            startRunVia(sfx, g);
          } else if (e.key.toLowerCase() === "m") toggleMuteVia(sfx);
          break;
        case "gameover":
          if (e.key.toLowerCase() === "r" || e.key === "Enter") {
            e.preventDefault();
            startRunVia(sfx, g);
          } else if (e.key === "Escape") g.toMenu();
          else if (e.key.toLowerCase() === "m") toggleMuteVia(sfx);
          break;
      }
    };

    const startRunVia = (s: Sfx, game: Game) => {
      s.unlock();
      s.ui();
      setHighlightId(null);
      setNeedsName(false);
      setBestBefore(Math.max(0, ...getScores().map((sc) => sc.score)));
      if (isTouch) focusKeyboard();
      game.startRun();
    };
    const toggleMuteVia = (s: Sfx) => setMuted(s.toggleMute());

    window.addEventListener("keydown", onKeyDown);

    /* ---- auto-pause when tab hidden ---- */
    const onVis = () => {
      if (document.hidden) g.pauseIfPlaying();
    };
    const onBlurWindow = () => g.pauseIfPlaying();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlurWindow);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlurWindow);
      sfx.destroy();
      gameRef.current = null;
      sfxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTouch]);

  /* ---- shrink playfield above the soft keyboard ---- */
  useEffect(() => {
    if (!isTouch || !window.visualViewport) return;
    const vv = window.visualViewport;
    const apply = () => {
      const el = wrapRef.current;
      if (!el) return;
      el.style.height = `${vv.height}px`;
      el.style.top = `${vv.offsetTop}px`;
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
    };
  }, [isTouch]);

  /* ---- hidden input: soft-keyboard pipeline (mobile) ---- */
  const onSoftInput = (chars: string) => {
    const g = gameRef.current;
    if (!g) return;
    for (const ch of chars) {
      const c = ch.toLowerCase();
      if (c >= "a" && c <= "z") g.inputChar(c);
      else if (c === " ") g.activateNitro();
    }
  };

  const keepFocus = () => {
    if (
      isTouch &&
      (phaseRef.current === "playing" || phaseRef.current === "countdown")
    ) {
      window.setTimeout(() => hiddenInputRef.current?.focus({ preventScroll: true }), 40);
    }
  };

  const toggleMute = () => {
    const sfx = sfxRef.current;
    if (!sfx) return;
    sfx.unlock();
    setMuted(sfx.toggleMute());
  };

  const saveName = (name: string) => {
    if (!stats) return;
    const { list, entry } = addScore({
      name,
      score: stats.score,
      wpm: stats.wpm,
      acc: stats.accuracy,
      words: stats.words,
      diff: difficulty,
    });
    setScores(list);
    setHighlightId(entry.id);
    setNeedsName(false);
    sfxRef.current?.toast();
  };

  const showHud =
    phase === "countdown" ||
    phase === "playing" ||
    phase === "paused" ||
    phase === "dying";

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 overflow-hidden bg-ink"
      onPointerDown={() => {
        if (phaseRef.current === "playing") keepFocus();
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="VELOCITYPE game field: words falling down a neon highway toward your racer"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* hidden input drives the mobile soft keyboard */}
      <input
        ref={hiddenInputRef}
        type="text"
        aria-label="typing input"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: 8,
          height: 8,
          opacity: 0.02,
          fontSize: 16,
          border: "none",
          padding: 0,
          zIndex: 1,
        }}
        onChange={(e) => {
          const v = e.currentTarget.value;
          e.currentTarget.value = "";
          onSoftInput(v);
        }}
        onBlur={keepFocus}
        onFocus={(e) => (e.currentTarget.value = "")}
      />

      {showHud && game && (
        <Hud
          game={game}
          isTouch={isTouch}
          muted={muted}
          onPause={() => game.togglePause()}
          onNitro={() => gameRef.current?.activateNitro()}
          onToggleMute={toggleMute}
        />
      )}

      {phase === "menu" && (
        <MenuScreen
          scores={scores}
          isTouch={isTouch}
          muted={muted}
          difficulty={difficulty}
          onPickDifficulty={onPickDifficulty}
          onStart={startRun}
          onToggleMute={toggleMute}
        />
      )}

      {phase === "paused" && game && (
        <PauseScreen
          game={game}
          onResume={() => {
            game.togglePause();
            keepFocus();
          }}
          onRestart={startRun}
          onMenu={() => game.toMenu()}
        />
      )}

      {phase === "gameover" && stats && (
        <GameOverScreen
          stats={stats}
          scores={scores}
          highlightId={highlightId}
          needsName={needsName}
          bestBefore={bestBefore}
          onSaveName={saveName}
          onRestart={startRun}
          onMenu={() => gameRef.current?.toMenu()}
        />
      )}
    </div>
  );
}
