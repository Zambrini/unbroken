import {
  add,
  clamp,
  distance,
  distanceSquared,
  dot,
  scale,
  subtract,
  type Vec2,
} from './math';

export interface Circle {
  readonly center: Vec2;
  readonly radius: number;
}

export interface ThickLine {
  readonly from: Vec2;
  readonly to: Vec2;
  readonly halfWidth: number;
}

export interface Ring {
  readonly center: Vec2;
  readonly radius: number;
  readonly halfWidth: number;
}

export type BossShotOutcome = 'none' | 'hit' | 'core-sealed' | 'enter-break-range' | 'core-missed';

export function circlesIntersect(a: Circle, b: Circle): boolean {
  const combinedRadius = Math.max(0, a.radius) + Math.max(0, b.radius);
  return distanceSquared(a.center, b.center) <= combinedRadius * combinedRadius;
}

export function rayIntersectsCircle(origin: Vec2, direction: Vec2, circle: Circle): boolean {
  const directionLengthSquared = dot(direction, direction);
  const radius = Math.max(0, circle.radius);
  if (directionLengthSquared === 0) {
    return distanceSquared(origin, circle.center) <= radius * radius;
  }

  const projection = Math.max(0, dot(subtract(circle.center, origin), direction) / directionLengthSquared);
  const closest = add(origin, scale(direction, projection));
  return distanceSquared(closest, circle.center) <= radius * radius;
}

export function resolveBossShotCollision(options: {
  shot: Circle;
  core: Circle;
  armor: Circle;
  bossVulnerable: boolean;
  armed: boolean;
  coreAligned: boolean;
}): BossShotOutcome {
  const { shot, core, armor, bossVulnerable, armed, coreAligned } = options;
  if (circlesIntersect(shot, core)) {
    if (!bossVulnerable) return 'core-sealed';
    return armed ? 'hit' : 'enter-break-range';
  }

  if (!circlesIntersect(shot, armor)) return 'none';
  if (!bossVulnerable) return 'core-sealed';
  if (!armed) return 'enter-break-range';
  return coreAligned ? 'none' : 'core-missed';
}

export function closestPointOnSegment(point: Vec2, from: Vec2, to: Vec2): Vec2 {
  const segment = subtract(to, from);
  const segmentLengthSquared = dot(segment, segment);

  if (segmentLengthSquared === 0) {
    return from;
  }

  const amount = clamp(dot(subtract(point, from), segment) / segmentLengthSquared, 0, 1);
  return add(from, scale(segment, amount));
}

export function circleIntersectsLine(circle: Circle, line: ThickLine): boolean {
  const closest = closestPointOnSegment(circle.center, line.from, line.to);
  const combinedRadius = Math.max(0, circle.radius) + Math.max(0, line.halfWidth);
  return distanceSquared(circle.center, closest) <= combinedRadius * combinedRadius;
}

export function circleIntersectsRing(circle: Circle, ring: Ring): boolean {
  const radialDistance = distance(circle.center, ring.center);
  const combinedHalfWidth = Math.max(0, circle.radius) + Math.max(0, ring.halfWidth);
  return Math.abs(radialDistance - Math.max(0, ring.radius)) <= combinedHalfWidth;
}
