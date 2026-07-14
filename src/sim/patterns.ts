import {
  add,
  clamp,
  clampToArena,
  length,
  normalize,
  scale,
  type ArenaBounds,
  type Vec2,
} from './math';

export const ROUND_DURATION_MS = 45_000;
export const ROUND_COUNTDOWN_MS = 3_000;

export const ARENA_BOUNDS: ArenaBounds = {
  minX: -520,
  maxX: 520,
  minY: -280,
  maxY: 280,
};

export const COMBAT_TUNING = {
  fixedStepMs: 1000 / 60,
  playerStart: { x: 330, y: 210 },
  playerRadius: 14,
  breakRange: 270,
  bossBodyRadius: 96,
  bossCoreRadius: 20,
  playerMoveSpeed: 260,
  dashDistance: 168,
  dashDurationMs: 140,
  dashCooldownMs: 2_400,
  shotRadius: 4,
  shotSpeed: 920,
  shotIntervalMs: 120,
} as const;

export type BossVersion = 'V01' | 'V37';
export type PatternKind = 'pulse' | 'lances' | 'compression' | 'dashCatch';
export type PatternPhase = 'telegraph' | 'active' | 'opening' | 'recovery';

export type PatternId =
  | 'v01-pulse'
  | 'v01-lances'
  | 'v01-compression'
  | 'v37-pulse'
  | 'v37-lances'
  | 'v37-compression'
  | 'v37-dash-catch';

interface BasePattern {
  readonly id: PatternId;
  readonly version: BossVersion;
  readonly kind: PatternKind;
  readonly telegraphMs: number;
  readonly activeMs: number;
  readonly openingMs: number;
  readonly recoveryMs: number;
  readonly damage: number;
}

export interface PulseRingDefinition {
  readonly delayMs: number;
  readonly startRadius: number;
  readonly endRadius: number;
  readonly halfWidth: number;
}

export interface PulsePattern extends BasePattern {
  readonly kind: 'pulse';
  readonly rings: readonly PulseRingDefinition[];
}

export interface LancePattern extends BasePattern {
  readonly kind: 'lances';
  readonly aim: 'snapshot';
  readonly count: number;
  readonly spreadRadians: number;
  readonly halfWidth: number;
  readonly reach: number;
}

export interface CompressionPattern extends BasePattern {
  readonly kind: 'compression';
  readonly axis: 'horizontal' | 'vertical';
  readonly closingInset: number;
  readonly safeGap: number;
}

export interface DashCatchPattern extends BasePattern {
  readonly kind: 'dashCatch';
  readonly lockMode: 'telegraph-start' | 'continuous';
  readonly projectionMs: number;
  readonly maxPredictionDistance: number;
  readonly markerRadius: number;
}

export type AttackPattern =
  | PulsePattern
  | LancePattern
  | CompressionPattern
  | DashCatchPattern;

const SHARED_PULSE = {
  telegraphMs: 780,
  activeMs: 900,
  openingMs: 1_100,
  recoveryMs: 250,
  damage: 1,
  rings: [{ delayMs: 0, startRadius: 70, endRadius: 620, halfWidth: 15 }],
} as const;

const SHARED_LANCES = {
  telegraphMs: 850,
  activeMs: 320,
  openingMs: 1_150,
  recoveryMs: 250,
  damage: 1,
  aim: 'snapshot' as const,
  count: 2,
  spreadRadians: 0.32,
  halfWidth: 16,
  reach: 700,
} as const;

const SHARED_COMPRESSION = {
  telegraphMs: 950,
  activeMs: 1_000,
  openingMs: 1_250,
  recoveryMs: 250,
  damage: 1,
  axis: 'horizontal' as const,
  closingInset: 180,
  safeGap: 190,
} as const;

export const V01_PATTERNS = [
  { ...SHARED_PULSE, id: 'v01-pulse', version: 'V01', kind: 'pulse' },
  { ...SHARED_LANCES, id: 'v01-lances', version: 'V01', kind: 'lances' },
  {
    ...SHARED_COMPRESSION,
    id: 'v01-compression',
    version: 'V01',
    kind: 'compression',
  },
] as const satisfies readonly AttackPattern[];

export const V37_PATTERNS = [
  { ...SHARED_PULSE, id: 'v37-pulse', version: 'V37', kind: 'pulse' },
  { ...SHARED_LANCES, id: 'v37-lances', version: 'V37', kind: 'lances' },
  {
    ...SHARED_COMPRESSION,
    id: 'v37-compression',
    version: 'V37',
    kind: 'compression',
  },
  {
    id: 'v37-dash-catch',
    version: 'V37',
    kind: 'dashCatch',
    telegraphMs: 720,
    activeMs: 900,
    openingMs: 1_150,
    recoveryMs: 250,
    damage: 1,
    lockMode: 'telegraph-start',
    projectionMs: 180,
    maxPredictionDistance: COMBAT_TUNING.dashDistance,
    markerRadius: 52,
  },
] as const satisfies readonly AttackPattern[];

export const PATTERNS: Readonly<Record<PatternId, AttackPattern>> = Object.fromEntries(
  [...V01_PATTERNS, ...V37_PATTERNS].map((pattern) => [pattern.id, pattern]),
) as Record<PatternId, AttackPattern>;

export interface MutationDefinition {
  readonly id: 'dash-catch';
  readonly label: 'DASH CATCH';
  readonly explanation: string;
}

export interface BossVersionScript {
  readonly version: BossVersion;
  readonly displayName: string;
  readonly roundDurationMs: number;
  readonly openingDelayMs: number;
  readonly bossHealth: number;
  readonly sequence: readonly PatternId[];
  readonly mutation?: MutationDefinition;
}

export const V01_SCRIPT: BossVersionScript = {
  version: 'V01',
  displayName: 'HEIR // V.01',
  roundDurationMs: ROUND_DURATION_MS,
  openingDelayMs: 450,
  bossHealth: 30,
  sequence: ['v01-pulse', 'v01-lances', 'v01-compression'],
};

export const V37_SCRIPT: BossVersionScript = {
  version: 'V37',
  displayName: 'HEIR // V.37',
  roundDurationMs: ROUND_DURATION_MS,
  openingDelayMs: 450,
  bossHealth: 30,
  sequence: [
    'v37-pulse',
    'v37-lances',
    'v37-dash-catch',
    'v37-compression',
    'v37-dash-catch',
  ],
  mutation: {
    id: 'dash-catch',
    label: 'DASH CATCH',
    explanation: 'Locks one visible strike on the predicted dash endpoint.',
  },
};

export const VERSION_SCRIPTS: Readonly<Record<BossVersion, BossVersionScript>> = {
  V01: V01_SCRIPT,
  V37: V37_SCRIPT,
};

export interface PatternWindow {
  readonly occurrence: number;
  readonly patternId: PatternId;
  readonly startMs: number;
  readonly telegraphEndMs: number;
  readonly activeEndMs: number;
  readonly openingEndMs: number;
  readonly endMs: number;
}

export interface PatternSample {
  readonly window: PatternWindow;
  readonly pattern: AttackPattern;
  readonly phase: PatternPhase;
  readonly phaseProgress: number;
}

export function patternDuration(pattern: AttackPattern): number {
  return pattern.telegraphMs + pattern.activeMs + pattern.openingMs + pattern.recoveryMs;
}

export function buildVersionTimeline(
  script: BossVersionScript,
  patterns: Readonly<Record<PatternId, AttackPattern>> = PATTERNS,
): readonly PatternWindow[] {
  if (script.sequence.length === 0) {
    return [];
  }

  const timeline: PatternWindow[] = [];
  let cursorMs = script.openingDelayMs;
  let occurrence = 0;

  while (cursorMs < script.roundDurationMs) {
    const sequenceIndex = occurrence % script.sequence.length;
    const patternId = script.sequence[sequenceIndex];
    if (patternId === undefined) {
      break;
    }

    const pattern = patterns[patternId];
    const telegraphEndMs = cursorMs + pattern.telegraphMs;
    const activeEndMs = telegraphEndMs + pattern.activeMs;
    if (activeEndMs > script.roundDurationMs) {
      break;
    }

    const openingEndMs = Math.min(
      activeEndMs + pattern.openingMs,
      script.roundDurationMs,
    );
    const endMs = Math.min(
      cursorMs + patternDuration(pattern),
      script.roundDurationMs,
    );

    timeline.push({
      occurrence,
      patternId,
      startMs: cursorMs,
      telegraphEndMs,
      activeEndMs,
      openingEndMs,
      endMs,
    });

    cursorMs = endMs;
    occurrence += 1;
  }

  return timeline;
}

export function sampleTimeline(
  timeline: readonly PatternWindow[],
  elapsedMs: number,
  patterns: Readonly<Record<PatternId, AttackPattern>> = PATTERNS,
): PatternSample | null {
  const window = timeline.find(
    (candidate) => elapsedMs >= candidate.startMs && elapsedMs < candidate.endMs,
  );
  if (window === undefined) {
    return null;
  }

  const pattern = patterns[window.patternId];
  let phase: PatternPhase;
  let phaseStartMs: number;
  let phaseEndMs: number;

  if (elapsedMs < window.telegraphEndMs) {
    phase = 'telegraph';
    phaseStartMs = window.startMs;
    phaseEndMs = window.telegraphEndMs;
  } else if (elapsedMs < window.activeEndMs) {
    phase = 'active';
    phaseStartMs = window.telegraphEndMs;
    phaseEndMs = window.activeEndMs;
  } else if (elapsedMs < window.openingEndMs) {
    phase = 'opening';
    phaseStartMs = window.activeEndMs;
    phaseEndMs = window.openingEndMs;
  } else {
    phase = 'recovery';
    phaseStartMs = window.openingEndMs;
    phaseEndMs = window.endMs;
  }

  const phaseDurationMs = phaseEndMs - phaseStartMs;
  const phaseProgress = phaseDurationMs <= 0
    ? 1
    : clamp((elapsedMs - phaseStartMs) / phaseDurationMs, 0, 1);

  return { window, pattern, phase, phaseProgress };
}

export interface DashCatchSnapshot {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly dashDirection?: Vec2;
}

export function predictDashCatchTarget(
  snapshot: DashCatchSnapshot,
  pattern: DashCatchPattern,
  bounds: ArenaBounds = ARENA_BOUNDS,
  targetRadius = COMBAT_TUNING.playerRadius,
): Vec2 {
  const dashDirection = snapshot.dashDirection;
  const hasDashDirection = dashDirection !== undefined && length(dashDirection) > 0;
  const projectedOffset = hasDashDirection
    ? scale(normalize(dashDirection), pattern.maxPredictionDistance)
    : scale(snapshot.velocity, pattern.projectionMs / 1_000);
  const cappedOffset = length(projectedOffset) > pattern.maxPredictionDistance
    ? scale(normalize(projectedOffset), pattern.maxPredictionDistance)
    : projectedOffset;

  return clampToArena(add(snapshot.position, cappedOffset), bounds, targetRadius);
}
