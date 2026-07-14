import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ACTOR_ASSET_URLS,
  selectHeirActorAsset,
} from '../../src/game/ActorAssets';
import { COMBAT_TUNING } from '../../src/sim';

const ACTORS = [
  { key: 'challenger', file: 'challenger.png', width: 192, height: 192 },
  { key: 'heirV01Sealed', file: 'heir-v01-sealed.png', width: 512, height: 512 },
  { key: 'heirV01Open', file: 'heir-v01-open.png', width: 512, height: 512 },
  { key: 'heirV37Sealed', file: 'heir-v37-sealed.png', width: 640, height: 640 },
  { key: 'heirV37Open', file: 'heir-v37-open.png', width: 640, height: 640 },
] as const;

const actorPath = (file: string) => fileURLToPath(
  new URL(`../../src/assets/actors/${file}`, import.meta.url),
);

describe('Blender actor asset contract', () => {
  it('preloads exactly the five approved runtime sprites', () => {
    expect(Object.keys(ACTOR_ASSET_URLS)).toEqual(ACTORS.map(({ key }) => key));
  });

  it.each([
    [1, false, 'heirV01Sealed'],
    [1, true, 'heirV01Open'],
    [37, false, 'heirV37Sealed'],
    [37, true, 'heirV37Open'],
  ] as const)('maps V.%s vulnerable=%s to %s', (version, vulnerable, expected) => {
    expect(selectHeirActorAsset(version, vulnerable)).toBe(expected);
  });

  it('keeps every PNG transparent, exact-sized, and within the encoded budget', () => {
    let totalBytes = 0;

    ACTORS.forEach(({ file, width, height }) => {
      const path = actorPath(file);
      const bytes = readFileSync(path);
      totalBytes += statSync(path).size;

      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(bytes.subarray(12, 16).toString('ascii')).toBe('IHDR');
      expect(bytes.readUInt32BE(16)).toBe(width);
      expect(bytes.readUInt32BE(20)).toBe(height);
      expect(bytes[25]).toBe(6);
    });

    expect(totalBytes).toBeLessThanOrEqual(0.9 * 1024 * 1024);
  });

  it('does not drift the collision and dash contract while replacing visuals', () => {
    expect(COMBAT_TUNING.playerRadius).toBe(14);
    expect(COMBAT_TUNING.bossBodyRadius).toBe(132);
    expect(COMBAT_TUNING.bossCoreRadius).toBe(20);
    expect(COMBAT_TUNING.breakRange).toBe(270);
    expect(COMBAT_TUNING.dashCooldownMs).toBe(2_400);
  });
});
