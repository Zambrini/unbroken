import { describe, expect, it } from 'vitest';
import {
  ARENA_BOUNDS,
  ARENA_FLOOR_POLYGON,
  COMBAT_TUNING,
  PATTERNS,
  V01_PATTERNS,
  V01_SCRIPT,
  V37_PATTERNS,
  V37_SCRIPT,
  buildVersionTimeline,
  predictDashCatchTarget,
  sampleTimeline,
  validatePattern,
  validateVersionScript,
  vec,
  type CompressionPattern,
  type DashCatchPattern,
} from '../../src/sim';

describe('authored version scripts', () => {
  it('pass the fairness contract', () => {
    expect(validateVersionScript(V01_SCRIPT)).toEqual([]);
    expect(validateVersionScript(V37_SCRIPT)).toEqual([]);
  });

  it('changes one named rule in V.37', () => {
    expect(V01_SCRIPT.sequence).not.toContain('v37-dash-catch');
    expect(V37_PATTERNS.some((pattern) => pattern.kind === 'dashCatch')).toBe(true);
    expect(V37_SCRIPT.mutation?.label).toBe('DASH CATCH');
    expect(V37_SCRIPT.bossHealth).toBe(V01_SCRIPT.bossHealth);

    const inheritedKinds = ['pulse', 'lances', 'compression'] as const;
    for (const kind of inheritedKinds) {
      const baseline = V01_PATTERNS.find((pattern) => pattern.kind === kind);
      const evolved = V37_PATTERNS.find((pattern) => pattern.kind === kind);
      expect(evolved?.telegraphMs).toBe(baseline?.telegraphMs);
      expect(evolved?.activeMs).toBe(baseline?.activeMs);
      expect(evolved?.damage).toBe(baseline?.damage);
    }
  });

  it('builds a deterministic, non-overlapping 45-second timeline', () => {
    const first = buildVersionTimeline(V37_SCRIPT);
    const second = buildVersionTimeline(V37_SCRIPT);

    expect(first).toEqual(second);
    expect(first.some((window) => PATTERNS[window.patternId].kind === 'dashCatch')).toBe(true);
    expect(first.every((window) => window.activeEndMs <= V37_SCRIPT.roundDurationMs)).toBe(true);
    for (let index = 1; index < first.length; index += 1) {
      expect(first[index]?.startMs).toBe(first[index - 1]?.endMs);
    }
  });

  it('samples exact phase boundaries', () => {
    const timeline = buildVersionTimeline(V01_SCRIPT);
    const first = timeline[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    expect(sampleTimeline(timeline, first.startMs)?.phase).toBe('telegraph');
    expect(sampleTimeline(timeline, first.telegraphEndMs)?.phase).toBe('active');
    expect(sampleTimeline(timeline, first.activeEndMs)?.phase).toBe('opening');
    expect(sampleTimeline(timeline, first.openingEndMs)?.phase).toBe('recovery');
  });

  it('keeps visual containment separate from the authored attack contract', () => {
    const signature = (patterns: typeof V01_PATTERNS | typeof V37_PATTERNS) => patterns.map((pattern) => ({
      kind: pattern.kind,
      telegraphMs: pattern.telegraphMs,
      activeMs: pattern.activeMs,
      openingMs: pattern.openingMs,
      recoveryMs: pattern.recoveryMs,
      damage: pattern.damage,
    }));

    expect(V01_SCRIPT.sequence).toEqual(['v01-pulse', 'v01-lances', 'v01-compression']);
    expect(V37_SCRIPT.sequence).toEqual([
      'v37-pulse',
      'v37-lances',
      'v37-dash-catch',
      'v37-compression',
      'v37-dash-catch',
    ]);
    expect(signature(V01_PATTERNS)).toEqual([
      { kind: 'pulse', telegraphMs: 780, activeMs: 900, openingMs: 1_100, recoveryMs: 250, damage: 1 },
      { kind: 'lances', telegraphMs: 850, activeMs: 320, openingMs: 1_150, recoveryMs: 250, damage: 1 },
      { kind: 'compression', telegraphMs: 950, activeMs: 1_000, openingMs: 1_250, recoveryMs: 250, damage: 1 },
    ]);
    expect(signature(V37_PATTERNS)).toEqual([
      { kind: 'pulse', telegraphMs: 780, activeMs: 900, openingMs: 1_100, recoveryMs: 250, damage: 1 },
      { kind: 'lances', telegraphMs: 850, activeMs: 320, openingMs: 1_150, recoveryMs: 250, damage: 1 },
      { kind: 'compression', telegraphMs: 950, activeMs: 1_000, openingMs: 1_250, recoveryMs: 250, damage: 1 },
      { kind: 'dashCatch', telegraphMs: 720, activeMs: 900, openingMs: 1_150, recoveryMs: 250, damage: 1 },
    ]);
  });

  it('keeps every reachable player circle inside the visible hazard mask', () => {
    const radius = COMBAT_TUNING.playerRadius;
    const reachableCorners = [
      vec(ARENA_BOUNDS.minX + radius, ARENA_BOUNDS.minY + radius),
      vec(ARENA_BOUNDS.maxX - radius, ARENA_BOUNDS.minY + radius),
      vec(ARENA_BOUNDS.maxX - radius, ARENA_BOUNDS.maxY - radius),
      vec(ARENA_BOUNDS.minX + radius, ARENA_BOUNDS.maxY - radius),
    ];
    const cross = (edge: ReturnType<typeof vec>, offset: ReturnType<typeof vec>) => edge.x * offset.y - edge.y * offset.x;
    let minimumClearance = Number.POSITIVE_INFINITY;

    for (const point of reachableCorners) {
      for (let index = 0; index < ARENA_FLOOR_POLYGON.length; index += 1) {
        const start = ARENA_FLOOR_POLYGON[index];
        const end = ARENA_FLOOR_POLYGON[(index + 1) % ARENA_FLOOR_POLYGON.length];
        if (!start || !end) continue;
        const edge = vec(end.x - start.x, end.y - start.y);
        const centerSide = Math.sign(cross(edge, vec(-start.x, -start.y)));
        const pointSide = cross(edge, vec(point.x - start.x, point.y - start.y));
        minimumClearance = Math.min(
          minimumClearance,
          (pointSide * centerSide) / Math.hypot(edge.x, edge.y),
        );
      }
    }

    expect(minimumClearance).toBeGreaterThanOrEqual(radius);
  });
});

describe('DASH CATCH', () => {
  const pattern = PATTERNS['v37-dash-catch'] as DashCatchPattern;

  it('locks the authored dash endpoint from one snapshot', () => {
    const target = predictDashCatchTarget(
      { position: vec(0, 0), velocity: vec(20, 0), dashDirection: vec(1, 0) },
      pattern,
    );

    expect(target).toEqual(vec(COMBAT_TUNING.dashDistance, 0));
  });

  it('uses velocity when no dash is active and clamps to the arena', () => {
    const target = predictDashCatchTarget(
      { position: vec(510, 270), velocity: vec(2_000, 2_000) },
      pattern,
    );

    expect(target).toEqual(
      vec(
        ARENA_BOUNDS.maxX - COMBAT_TUNING.playerRadius,
        ARENA_BOUNDS.maxY - COMBAT_TUNING.playerRadius,
      ),
    );
  });
});

describe('fairness failures', () => {
  it('rejects a compression gap with no forgiving route', () => {
    const unsafe: CompressionPattern = {
      ...(PATTERNS['v01-compression'] as CompressionPattern),
      safeGap: COMBAT_TUNING.playerRadius * 2,
    };
    expect(validatePattern(unsafe).map((entry) => entry.code)).toContain(
      'compression-gap-too-small',
    );
  });

  it('rejects a late, oversized, over-predictive DASH CATCH', () => {
    const unfair: DashCatchPattern = {
      ...(PATTERNS['v37-dash-catch'] as DashCatchPattern),
      telegraphMs: 300,
      markerRadius: 100,
      maxPredictionDistance: 500,
      lockMode: 'continuous',
    };
    const codes = validatePattern(unfair).map((entry) => entry.code);
    expect(codes).toContain('dash-catch-telegraph-too-short');
    expect(codes).toContain('dash-catch-marker-too-large');
    expect(codes).toContain('dash-catch-prediction-too-far');
    expect(codes).toContain('dash-catch-retargets');
  });
});
