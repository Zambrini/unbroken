import { describe, expect, it } from 'vitest';
import {
  circleIntersectsLine,
  circleIntersectsRing,
  circlesIntersect,
  closestPointOnSegment,
  vec,
} from '../../src/sim';

describe('collision helpers', () => {
  it('treats touching circles as a hit', () => {
    expect(
      circlesIntersect(
        { center: vec(0, 0), radius: 10 },
        { center: vec(15, 0), radius: 5 },
      ),
    ).toBe(true);
  });

  it('clamps line proximity to the segment endpoints', () => {
    expect(closestPointOnSegment(vec(30, 5), vec(0, 0), vec(20, 0))).toEqual(vec(20, 0));
    expect(
      circleIntersectsLine(
        { center: vec(30, 5), radius: 4 },
        { from: vec(0, 0), to: vec(20, 0), halfWidth: 2 },
      ),
    ).toBe(false);
  });

  it('detects a player touching a thick lance', () => {
    expect(
      circleIntersectsLine(
        { center: vec(25, 7), radius: 5 },
        { from: vec(0, 0), to: vec(50, 0), halfWidth: 2 },
      ),
    ).toBe(true);
  });

  it('detects only the dangerous band of a ring', () => {
    const ring = { center: vec(0, 0), radius: 50, halfWidth: 4 };
    expect(circleIntersectsRing({ center: vec(43, 0), radius: 3 }, ring)).toBe(true);
    expect(circleIntersectsRing({ center: vec(35, 0), radius: 3 }, ring)).toBe(false);
    expect(circleIntersectsRing({ center: vec(50, 0), radius: 1 }, ring)).toBe(true);
  });
});
