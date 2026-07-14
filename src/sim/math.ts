export interface Vec2 {
  x: number;
  y: number;
}

export interface ArenaBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

const EPSILON = 1e-9;

export function vec(x = 0, y = 0): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return vec(a.x + b.x, a.y + b.y);
}

export function subtract(a: Vec2, b: Vec2): Vec2 {
  return vec(a.x - b.x, a.y - b.y);
}

export function scale(value: Vec2, scalar: number): Vec2 {
  return vec(value.x * scalar, value.y * scalar);
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function lengthSquared(value: Vec2): number {
  return dot(value, value);
}

export function length(value: Vec2): number {
  return Math.sqrt(lengthSquared(value));
}

export function distanceSquared(a: Vec2, b: Vec2): number {
  return lengthSquared(subtract(a, b));
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.sqrt(distanceSquared(a, b));
}

export function normalize(value: Vec2): Vec2 {
  const magnitude = length(value);
  return magnitude <= EPSILON ? vec() : scale(value, 1 / magnitude);
}

export function lerp(a: Vec2, b: Vec2, amount: number): Vec2 {
  return vec(a.x + (b.x - a.x) * amount, a.y + (b.y - a.y) * amount);
}

export function fromAngle(radians: number, magnitude = 1): Vec2 {
  return vec(Math.cos(radians) * magnitude, Math.sin(radians) * magnitude);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampToArena(
  position: Vec2,
  bounds: ArenaBounds,
  radius = 0,
): Vec2 {
  const inset = Math.max(0, radius);
  const minX = bounds.minX + inset;
  const maxX = bounds.maxX - inset;
  const minY = bounds.minY + inset;
  const maxY = bounds.maxY - inset;

  return vec(
    minX <= maxX ? clamp(position.x, minX, maxX) : (bounds.minX + bounds.maxX) / 2,
    minY <= maxY ? clamp(position.y, minY, maxY) : (bounds.minY + bounds.maxY) / 2,
  );
}
