/* Word pools by difficulty tier (a-z only, lowercase) */

const TIER_1 = [
  "cat", "sun", "run", "sky", "jet", "orb", "arc", "fox", "owl", "zap",
  "ace", "bolt", "dash", "gear", "neon", "grid", "wave", "edge", "apex",
  "echo", "flux", "halo", "ion", "lux", "onyx", "pyre", "rift", "sage",
  "volt", "warp", "zero", "byte", "chip", "code", "data", "disk", "fire",
  "glow", "helm", "iris", "jolt", "kick", "loop", "maze", "node", "omen",
  "peak", "quad", "riot", "surge", "tide", "unit", "veer", "wind", "yarn",
  "zone", "atom", "beam", "core", "drift", "emit", "fizz", "gust", "hype",
];

const TIER_2 = [
  "turbo", "nitro", "racer", "speed", "laser", "pulse", "storm", "blaze",
  "comet", "drift", "ether", "flame", "ghost", "hyper", "input", "joker",
  "lumen", "meteor", "nova", "omega", "pixel", "quark", "radar", "sonic",
  "titan", "umbra", "vapor", "wheel", "xenon", "yield", "zeal", "arrow",
  "boost", "crash", "drive", "ember", "fiber", "glide", "hover", "infer",
  "jewel", "karma", "light", "metric", "north", "orbit", "prism", "quest",
  "rider", "sigma", "trace", "ultra", "vector", "wire", "proxy", "surge",
  "shift", "thrust", "torque", "valve", "spark", "clutch", "engine",
];

const TIER_3 = [
  "velocity", "throttle", "overdrive", "slipstream", "afterglow", "starfall",
  "downforce", "lightbeam", "megabyte", "firewall", "gridlock", "headwind",
  "ignition", "jettison", "kilowatt", "launcher", "midnight", "nanobots",
  "overtake", "phoenix", "quantum", "redshift", "scramble", "terminal",
  "uplink", "vortex", "wildfire", "yearzero", "zenith", "airborne",
  "backfire", "crosswind", "daybreak", "electron", "fluxgate", "gyrostat",
  "horizon", "impulse", "jetstream", "knockout", "longshot", "monsoon",
  "nightowl", "override", "payload", "quickfix", "raceways", "sideways",
  "tailwind", "unbroken", "vanguard", "wardrive", "xenolith", "fastlane",
];

const TIER_4 = [
  "accelerate", "blackholes", "centrifuge", "decathlete", "escapement",
  "fastfoward", "gravitator", "heavywater", "ionosphere", "jackrabbit",
  "kinematics", "lightspeed", "maneuvering", "nightshift", "oscillator",
  "propulsion", "quivering", "radioactiv", "supersonic", "timewarper",
  "ultraviole", "vanquished", "wavelength", "xylophones", "youngblood",
  "zipperhead", "antigravity", "boomeranged", "chromosphere", "dreadnought",
  "equilibrium", "farsighted", "grandprixes", "hypersonics", "interceptor",
  "juggernaut", "kaleidoscop", "labyrinthin", "magnetarize", "nightfallen",
];

export const BOSS = [
  "afterburner", "overclocked", "hyperspace", "nanosecond", "lightbending",
  "chronosurge", "gravitonic", "machbreaker", "photondrift", "quantumleap",
  "sonicboomer", "terminalave", "warpweaver", "zenithrising", "ultradynamo",
];

export const POOLS = [TIER_1, TIER_2, TIER_3, TIER_4];

export function tierForTime(elapsed: number): number {
  if (elapsed < 25) return 0;
  if (elapsed < 60) return 1;
  if (elapsed < 115) return 2;
  return 3;
}

export function pickWord(
  tier: number,
  recent: Set<string>,
  rng: () => number
): string {
  const pool = POOLS[Math.min(tier, POOLS.length - 1)];
  for (let i = 0; i < 14; i++) {
    const w = pool[Math.floor(rng() * pool.length)];
    if (!recent.has(w)) return w;
  }
  return pool[Math.floor(rng() * pool.length)];
}

export function pickBoss(rng: () => number): string {
  return BOSS[Math.floor(rng() * BOSS.length)];
}
