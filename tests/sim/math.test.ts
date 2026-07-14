import { describe, expect, it } from 'vitest';
import {
  add,
  clampToArena,
  distance,
  normalize,
  scale,
  subtract,
  vec,
} from '../../src/sim';

describe('Vec2 helpers', () => {
  it('compose without mutating their inputs', () => {
    const start = vec(3, 4);
    const moved = add(start, scale(normalize(start), 10));

    expect(start).toEqual({ x: 3, y: 4 });
    expect(moved).toEqual({ x: 9, y: 12 });
    expect(subtract(moved, start)).toEqual({ x: 6, y: 8 });
    expect(distance(start, moved)).toBe(10);
  });

  it('normalizes a zero vector safely', () => {
    expect(normalize(vec())).toEqual({ x: 0, y: 0 });
  });

  it('clamps the whole player circle inside the arena', () => {
    const bounds = { minX: -100, maxX: 100, minY: -50, maxY: 50 };
    expect(clampToArena(vec(200, -80), bounds, 10)).toEqual({ x: 90, y: -40 });
  });

  it('centers a circle that cannot fit on an axis', () => {
    const bounds = { minX: -10, maxX: 10, minY: -5, maxY: 5 };
    expect(clampToArena(vec(8, 4), bounds, 20)).toEqual({ x: 0, y: 0 });
  });
});
