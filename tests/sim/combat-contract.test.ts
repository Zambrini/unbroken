import { describe, expect, it } from 'vitest';
import {
  COMBAT_TUNING,
  V01_SCRIPT,
  V37_SCRIPT,
  add,
  buildVersionTimeline,
  clampOutsideCircle,
  length,
  rayIntersectsCircle,
  resolveBossShotCollision,
  vec,
} from '../../src/sim';

describe('punish contract', () => {
  it('starts outside break range while one committed dash reaches it faster than walking', () => {
    const startDistance = length(COMBAT_TUNING.playerStart);
    const distanceToBreak = startDistance - COMBAT_TUNING.breakRange;
    const minimumWalkMs = (distanceToBreak / COMBAT_TUNING.playerMoveSpeed) * 1_000;
    const dashEndDistance = startDistance - COMBAT_TUNING.dashDistance;
    const colliderDistance = COMBAT_TUNING.bossBodyRadius + COMBAT_TUNING.playerRadius;

    expect(COMBAT_TUNING.playerStart).toEqual(vec(330, 210));
    expect(startDistance).toBeGreaterThan(COMBAT_TUNING.breakRange);
    expect(dashEndDistance).toBeLessThan(COMBAT_TUNING.breakRange);
    expect(dashEndDistance).toBeGreaterThan(colliderDistance);
    expect(COMBAT_TUNING.breakRange - colliderDistance).toBeGreaterThanOrEqual(120);
    expect(minimumWalkMs - COMBAT_TUNING.dashDurationMs).toBeGreaterThan(250);
  });

  it('keeps the player outside HEIR and prevents fixed-step dash tunneling', () => {
    const colliderDistance = COMBAT_TUNING.bossBodyRadius + COMBAT_TUNING.playerRadius;
    const corrected = clampOutsideCircle(vec(12, 0), vec(), colliderDistance);
    const dashStep = (COMBAT_TUNING.dashDistance / COMBAT_TUNING.dashDurationMs)
      * COMBAT_TUNING.fixedStepMs;
    const dashSteps = Math.ceil(COMBAT_TUNING.dashDurationMs / COMBAT_TUNING.fixedStepMs);
    let position = vec(colliderDistance, 0);

    for (let index = 0; index < dashSteps; index += 1) {
      position = clampOutsideCircle(
        add(position, vec(-dashStep, 0)),
        vec(),
        colliderDistance,
        position,
      );
    }

    expect(length(corrected)).toBe(colliderDistance);
    expect(dashStep).toBeLessThan(colliderDistance * 2);
    expect(position.x).toBe(colliderDistance);
  });

  it('separates a core-aligned shot from an armor-only shot', () => {
    const expandedCore = COMBAT_TUNING.bossCoreRadius + COMBAT_TUNING.shotRadius;
    const expandedBody = COMBAT_TUNING.bossBodyRadius + COMBAT_TUNING.shotRadius;
    const direction = vec(0, -1);

    expect(rayIntersectsCircle(vec(0, 250), direction, { center: vec(), radius: expandedCore })).toBe(true);
    expect(rayIntersectsCircle(vec(40, 250), direction, { center: vec(), radius: expandedCore })).toBe(false);
    expect(rayIntersectsCircle(vec(40, 250), direction, { center: vec(), radius: expandedBody })).toBe(true);

    const core = { center: vec(), radius: COMBAT_TUNING.bossCoreRadius };
    const armor = { center: vec(), radius: COMBAT_TUNING.bossBodyRadius };
    const atCore = { center: vec(), radius: COMBAT_TUNING.shotRadius };
    const atArmor = { center: vec(40, 90), radius: COMBAT_TUNING.shotRadius };
    const resolve = (overrides: Partial<Parameters<typeof resolveBossShotCollision>[0]> = {}) => resolveBossShotCollision({
      shot: atArmor,
      core,
      armor,
      bossVulnerable: true,
      armed: true,
      coreAligned: false,
      ...overrides,
    });

    expect(resolve({ shot: atCore, coreAligned: true })).toBe('hit');
    expect(resolve()).toBe('core-missed');
    expect(resolve({ bossVulnerable: false, coreAligned: true })).toBe('core-sealed');
    expect(resolve({ armed: false, coreAligned: true })).toBe('enter-break-range');
  });

  it.each([V01_SCRIPT, V37_SCRIPT])(
    'recovers an evasive dash but commits an opening dash through every next active threat in $version',
    (script) => {
      const timeline = buildVersionTimeline(script);

      for (let index = 0; index < timeline.length - 1; index += 1) {
        const current = timeline[index];
        const next = timeline[index + 1];
        expect(current).toBeDefined();
        expect(next).toBeDefined();
        if (!current || !next) continue;

        const nextActiveStart = next.telegraphEndMs;
        expect(current.telegraphEndMs + COMBAT_TUNING.dashCooldownMs).toBeLessThanOrEqual(nextActiveStart);
        expect(current.activeEndMs + COMBAT_TUNING.dashCooldownMs).toBeGreaterThan(nextActiveStart);
      }
    },
  );
});
