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

export function circlesIntersect(a: Circle, b: Circle): boolean {
  const combinedRadius = Math.max(0, a.radius) + Math.max(0, b.radius);
  return distanceSquared(a.center, b.center) <= combinedRadius * combinedRadius;
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
