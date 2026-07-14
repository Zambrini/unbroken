import { describe, expect, it } from 'vitest';
import {
  ARENA_BOUNDS,
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
