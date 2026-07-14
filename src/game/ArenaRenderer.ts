import { Application, Container, Graphics } from 'pixi.js';
import {
  COMBAT_TUNING,
  fromAngle,
  type PatternSample,
  type Vec2,
} from '../sim';

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;
export const WORLD_ORIGIN: Vec2 = { x: 800, y: 430 };
const COLORS = {
  void: 0x05070c,
  floor: 0x0a1020,
  floorHigh: 0x0d1829,
  cyan: 0x2ef2ff,
  cyanDim: 0x137f96,
  magenta: 0xff2bb5,
  red: 0xff334f,
  white: 0xf4f7ff,
  armor: 0x202536,
  armorHigh: 0x34394d,
} as const;

export interface ShotView {
  position: Vec2;
  previous: Vec2;
  readonly armed: boolean;
}

export interface TrailView {
  readonly position: Vec2;
  readonly angle: number;
  readonly alpha: number;
}

export interface ParticleView {
  readonly position: Vec2;
  readonly color: number;
  readonly size: number;
  readonly alpha: number;
}

export interface PatternLockView {
  readonly lanceAngle: number;
  readonly dashTarget: Vec2;
}

export interface RenderFrame {
  readonly nowMs: number;
  readonly version: 1 | 37;
  readonly bossVulnerable: boolean;
  readonly bossHealthRatio: number;
  readonly bossFlash: number;
  readonly playerPosition: Vec2;
  readonly playerAngle: number;
  readonly playerInvulnerable: boolean;
  readonly playerDashing: boolean;
  readonly playerIntegrity: number;
  readonly sample: PatternSample | null;
  readonly lock: PatternLockView;
  readonly shots: readonly ShotView[];
  readonly trails: readonly TrailView[];
  readonly particles: readonly ParticleView[];
  readonly pressure: boolean;
  readonly spectator: boolean;
  readonly shake: number;
}

export class ArenaRenderer {
  private readonly app = new Application();
  private readonly root = new Container();
  private readonly graphics = new Graphics();
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private readonly mount: HTMLElement) {}

  async init(): Promise<void> {
    await this.app.init({
      resizeTo: this.mount,
      backgroundColor: COLORS.void,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    this.app.canvas.setAttribute('aria-hidden', 'true');
    this.mount.appendChild(this.app.canvas);
    this.root.addChild(this.graphics);
    this.app.stage.addChild(this.root);
  }

  render(frame: RenderFrame): void {
    const scale = Math.min(this.app.screen.width / WORLD_WIDTH, this.app.screen.height / WORLD_HEIGHT);
    const shake = this.reducedMotion ? 0 : frame.shake;
    const shakeX = shake > 0 ? Math.sin(frame.nowMs * 0.19) * shake : 0;
    const shakeY = shake > 0 ? Math.cos(frame.nowMs * 0.23) * shake * 0.65 : 0;
    this.root.scale.set(scale);
    this.root.position.set(
      (this.app.screen.width - WORLD_WIDTH * scale) / 2 + shakeX,
      (this.app.screen.height - WORLD_HEIGHT * scale) / 2 + shakeY,
    );

    const g = this.graphics;
    g.clear();
    g.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(COLORS.void);
    this.drawAudience(g, frame);
    this.drawArena(g, frame);
    this.drawFixtures(g, frame.nowMs);
    this.drawHazards(g, frame);
    this.drawTrails(g, frame.trails);
    this.drawBoss(g, frame);
    this.drawShots(g, frame.shots);
    this.drawPlayer(g, frame);
    this.drawParticles(g, frame.particles);
    if (frame.pressure) this.drawPressure(g, frame.nowMs);
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }

  private drawAudience(g: Graphics, frame: RenderFrame): void {
    const pulse = 0.25 + (Math.sin(frame.nowMs * (frame.pressure ? 0.016 : 0.006)) + 1) * 0.14;
    const rows = [46, 74, 826, 854];
    rows.forEach((y, row) => {
      for (let x = 108; x <= 1492; x += 22) {
        const index = Math.floor((x - 108) / 22) + row * 7;
        const lit = (index * 17 + Math.floor(frame.nowMs / 170)) % 11 < (frame.spectator ? 5 : 3);
        const color = index % 5 === 0 ? COLORS.cyan : index % 3 === 0 ? COLORS.white : COLORS.magenta;
        g.rect(x, y, 10, 4).fill({ color, alpha: lit ? pulse + 0.32 : 0.09 });
      }
    });
    for (let y = 136; y <= 744; y += 21) {
      const lit = (y * 13 + Math.floor(frame.nowMs / 190)) % 9 < 3;
      g.rect(82, y, 5, 10).fill({ color: lit ? COLORS.cyan : COLORS.magenta, alpha: lit ? pulse : 0.08 });
      g.rect(1513, y, 5, 10).fill({ color: lit ? COLORS.magenta : COLORS.cyan, alpha: lit ? pulse : 0.08 });
    }
  }

  private drawArena(g: Graphics, frame: RenderFrame): void {
    const arena = [
      188, 180,
      332, 94,
      1268, 94,
      1412, 180,
      1412, 720,
      1268, 806,
      332, 806,
      188, 720,
    ];
    g.poly(arena).fill(COLORS.floor).stroke({ color: COLORS.magenta, alpha: 0.64, width: 3 });
    g.poly([210, 196, 348, 116, 1252, 116, 1390, 196, 1390, 704, 1252, 784, 348, 784, 210, 704])
      .stroke({ color: COLORS.cyanDim, alpha: 0.28, width: 1 });

    [105, 210, 320].forEach((radius, index) => {
      g.circle(WORLD_ORIGIN.x, WORLD_ORIGIN.y, radius)
        .stroke({ color: COLORS.cyan, alpha: 0.13 - index * 0.018, width: 1 });
    });
    g.moveTo(280, WORLD_ORIGIN.y).lineTo(1320, WORLD_ORIGIN.y)
      .stroke({ color: COLORS.cyan, alpha: 0.18, width: 1 });
    g.moveTo(WORLD_ORIGIN.x, 150).lineTo(WORLD_ORIGIN.x, 710)
      .stroke({ color: COLORS.cyan, alpha: 0.14, width: 1 });
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      const inner = fromAngle(angle, 306);
      const outer = fromAngle(angle, 318);
      g.moveTo(WORLD_ORIGIN.x + inner.x, WORLD_ORIGIN.y + inner.y)
        .lineTo(WORLD_ORIGIN.x + outer.x, WORLD_ORIGIN.y + outer.y)
        .stroke({ color: COLORS.cyan, alpha: 0.42, width: 2 });
    }
    if (frame.bossVulnerable) {
      this.dashedCircle(g, WORLD_ORIGIN.x, WORLD_ORIGIN.y, COMBAT_TUNING.breakRange, 18, 12, COLORS.cyan, 0.25);
    }
  }

  private drawFixtures(g: Graphics, nowMs: number): void {
    const pulse = 0.7 + Math.sin(nowMs * 0.004) * 0.18;

    // Forked relay pylon, upper-left.
    g.poly([346, 178, 368, 162, 390, 178, 384, 216, 352, 216])
      .fill(COLORS.armor).stroke({ color: COLORS.cyanDim, width: 2 });
    this.bloomLine(g, { x: 368, y: 176 }, { x: 368, y: 132 }, COLORS.cyan, 4, pulse);
    this.bloomLine(g, { x: 368, y: 143 }, { x: 347, y: 122 }, COLORS.cyan, 4, pulse);
    this.bloomLine(g, { x: 368, y: 143 }, { x: 389, y: 122 }, COLORS.cyan, 4, pulse);

    // Prism shield node, upper-right.
    g.poly([1212, 150, 1248, 126, 1284, 150, 1274, 194, 1222, 194])
      .fill(COLORS.armor).stroke({ color: COLORS.magenta, alpha: 0.6, width: 2 });
    g.poly([1248, 136, 1267, 154, 1248, 184, 1229, 154])
      .stroke({ color: COLORS.magenta, alpha: pulse, width: 3 });
    g.moveTo(1248, 136).lineTo(1248, 184).stroke({ color: COLORS.magenta, alpha: 0.55, width: 2 });

    // Three camera masts, lower-left.
    [340, 382, 424].forEach((x, index) => {
      const height = 54 + index * 11;
      g.moveTo(x, 700).lineTo(x + 5, 700 - height).stroke({ color: COLORS.white, alpha: 0.45, width: 3 });
      g.circle(x, 704, 8).fill(COLORS.armorHigh).stroke({ color: COLORS.cyanDim, width: 1 });
      g.poly([x - 4, 700 - height, x + 14, 694 - height, x + 18, 703 - height, x, 708 - height])
        .fill(COLORS.white).stroke({ color: COLORS.cyanDim, width: 1 });
    });

    // Maintenance pod, lower-right.
    g.poly([1212, 656, 1268, 642, 1301, 674, 1287, 724, 1224, 730, 1198, 696])
      .fill(COLORS.armor).stroke({ color: COLORS.red, alpha: 0.65, width: 2 });
    g.poly([1249, 666, 1270, 702, 1228, 702])
      .stroke({ color: COLORS.red, alpha: pulse, width: 3 });
    g.moveTo(1240, 728).bezierCurveTo(1240, 754, 1210, 760, 1207, 788)
      .stroke({ color: COLORS.red, alpha: 0.72, width: 4 });
    g.moveTo(1260, 730).bezierCurveTo(1262, 756, 1235, 772, 1237, 800)
      .stroke({ color: COLORS.red, alpha: 0.5, width: 3 });
  }

  private drawHazards(g: Graphics, frame: RenderFrame): void {
    const sample = frame.sample;
    if (!sample) return;
    const { pattern, phase, phaseProgress } = sample;

    switch (pattern.kind) {
      case 'pulse': {
        const ring = pattern.rings[0];
        if (!ring) return;
        if (phase === 'telegraph') {
          const radius = 115 + phaseProgress * 205;
          this.dashedCircle(g, WORLD_ORIGIN.x, WORLD_ORIGIN.y, radius, 15, 11, COLORS.magenta, 0.76);
          g.circle(WORLD_ORIGIN.x, WORLD_ORIGIN.y, radius)
            .fill({ color: COLORS.magenta, alpha: 0.028 + phaseProgress * 0.035 });
        } else if (phase === 'active') {
          const radius = ring.startRadius + (ring.endRadius - ring.startRadius) * phaseProgress;
          this.bloomCircle(g, WORLD_ORIGIN.x, WORLD_ORIGIN.y, radius, COLORS.red, ring.halfWidth * 1.5, 0.92);
        }
        break;
      }
      case 'lances': {
        const angles = this.lanceAngles(frame.lock.lanceAngle, pattern.count, pattern.spreadRadians);
        angles.forEach((angle) => {
          const direction = fromAngle(angle, pattern.reach);
          const from = { x: WORLD_ORIGIN.x - direction.x, y: WORLD_ORIGIN.y - direction.y };
          const to = { x: WORLD_ORIGIN.x + direction.x, y: WORLD_ORIGIN.y + direction.y };
          if (phase === 'telegraph') {
            this.dashedLine(g, from, to, 18, 11, COLORS.magenta, 0.72);
          } else if (phase === 'active') {
            this.bloomLine(g, from, to, COLORS.red, pattern.halfWidth * 2, 0.92);
          }
        });
        break;
      }
      case 'compression': {
        const finalX = pattern.safeGap / 2;
        const activeX = 520 - (520 - finalX) * phaseProgress;
        const positions = phase === 'telegraph' ? [-finalX, finalX] : [-activeX, activeX];
        positions.forEach((x) => {
          const from = this.toScreen({ x, y: -280 });
          const to = this.toScreen({ x, y: 280 });
          if (phase === 'telegraph') this.dashedLine(g, from, to, 20, 12, COLORS.magenta, 0.72);
          if (phase === 'active') this.bloomLine(g, from, to, COLORS.red, 18, 0.9);
        });
        if (phase === 'telegraph') {
          g.rect(WORLD_ORIGIN.x - finalX, WORLD_ORIGIN.y - 280, finalX * 2, 560)
            .fill({ color: COLORS.cyan, alpha: 0.035 });
        }
        break;
      }
      case 'dashCatch': {
        const target = this.toScreen(frame.lock.dashTarget);
        const crossSize = 440;
        const lineA = {
          from: { x: target.x - crossSize, y: target.y - crossSize * 0.58 },
          to: { x: target.x + crossSize, y: target.y + crossSize * 0.58 },
        };
        const lineB = {
          from: { x: target.x - crossSize, y: target.y + crossSize * 0.58 },
          to: { x: target.x + crossSize, y: target.y - crossSize * 0.58 },
        };
        if (phase === 'telegraph') {
          this.dashedCircle(g, WORLD_ORIGIN.x, WORLD_ORIGIN.y, 285, 18, 12, COLORS.magenta, 0.7);
          this.dashedLine(g, lineA.from, lineA.to, 18, 12, COLORS.magenta, 0.72);
          this.dashedLine(g, lineB.from, lineB.to, 18, 12, COLORS.magenta, 0.72);
          g.circle(target.x, target.y, pattern.markerRadius).fill({ color: COLORS.magenta, alpha: 0.06 });
        } else if (phase === 'active') {
          if (phaseProgress < 0.58) {
            const progress = phaseProgress / 0.58;
            this.bloomCircle(g, WORLD_ORIGIN.x, WORLD_ORIGIN.y, 105 + progress * 220, COLORS.red, 18, 0.95);
            this.dashedLine(g, lineA.from, lineA.to, 18, 12, COLORS.magenta, 0.62);
            this.dashedLine(g, lineB.from, lineB.to, 18, 12, COLORS.magenta, 0.62);
          } else {
            const alpha = 0.72 + ((phaseProgress - 0.58) / 0.42) * 0.24;
            this.bloomLine(g, lineA.from, lineA.to, COLORS.red, 17, alpha);
            this.bloomLine(g, lineB.from, lineB.to, COLORS.red, 17, alpha);
          }
        }
        break;
      }
    }
  }

  private drawBoss(g: Graphics, frame: RenderFrame): void {
    const openOffset = frame.bossVulnerable ? 31 : 0;
    const rotation = frame.nowMs * (frame.pressure ? 0.00042 : 0.00023);
    const flashMix = frame.bossFlash > 0 ? COLORS.white : COLORS.armor;

    if (frame.version === 37) {
      for (let index = 0; index < 6; index += 1) {
        const angle = rotation * 0.42 + index * (Math.PI / 3);
        const center = {
          x: WORLD_ORIGIN.x + Math.cos(angle) * 112,
          y: WORLD_ORIGIN.y + Math.sin(angle) * 112,
        };
        const points = this.orientedWedge(center, angle, 42, 17);
        g.poly(points).fill(COLORS.armor).stroke({ color: COLORS.magenta, alpha: 0.72, width: 2 });
      }
      [-1, 1].forEach((side) => {
        const x = WORLD_ORIGIN.x + side * 128;
        g.poly([x - 24, WORLD_ORIGIN.y - 24, x + 24, WORLD_ORIGIN.y - 18, x + 28, WORLD_ORIGIN.y + 18, x - 24, WORLD_ORIGIN.y + 24])
          .fill(COLORS.armorHigh).stroke({ color: COLORS.red, alpha: 0.75, width: 2 });
        g.circle(x + side * 19, WORLD_ORIGIN.y, 7).fill(COLORS.red);
      });
    }

    for (let index = 0; index < 4; index += 1) {
      const angle = rotation + index * (Math.PI / 2);
      const distance = 62 + openOffset;
      const center = {
        x: WORLD_ORIGIN.x + Math.cos(angle) * distance,
        y: WORLD_ORIGIN.y + Math.sin(angle) * distance,
      };
      const points = this.orientedPetal(center, angle, frame.version === 37 ? 62 : 56, frame.version === 37 ? 35 : 31);
      g.poly(points).fill(flashMix).stroke({ color: COLORS.magenta, alpha: 0.88, width: 3 });
      const seamStart = {
        x: center.x - Math.cos(angle) * 14,
        y: center.y - Math.sin(angle) * 14,
      };
      const seamEnd = {
        x: center.x + Math.cos(angle) * 28,
        y: center.y + Math.sin(angle) * 28,
      };
      g.moveTo(seamStart.x, seamStart.y).lineTo(seamEnd.x, seamEnd.y)
        .stroke({ color: COLORS.magenta, alpha: 0.92, width: 2 });
    }

    g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, 46))
      .fill(COLORS.armorHigh).stroke({ color: COLORS.magenta, alpha: 0.75, width: 3 });
    const coreSize = frame.bossVulnerable ? 20 + Math.sin(frame.nowMs * 0.018) * 3 : 13;
    if (frame.bossVulnerable) {
      g.circle(WORLD_ORIGIN.x, WORLD_ORIGIN.y, coreSize + 13)
        .fill({ color: COLORS.cyan, alpha: 0.08 });
      g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, coreSize + 8))
        .stroke({ color: COLORS.cyan, alpha: 0.72, width: 2 });
    }
    g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, coreSize))
      .fill(COLORS.white).stroke({ color: frame.bossVulnerable ? COLORS.cyan : COLORS.magenta, width: 2 });
  }

  private drawPlayer(g: Graphics, frame: RenderFrame): void {
    const position = this.toScreen(frame.playerPosition);
    const size = frame.playerDashing ? 24 : 21;
    const points = this.shipPoints(position, frame.playerAngle, size);
    const alpha = frame.playerInvulnerable && !frame.playerDashing
      ? 0.5 + (Math.sin(frame.nowMs * 0.05) + 1) * 0.22
      : 1;
    const aim = fromAngle(frame.playerAngle, 44);
    g.moveTo(position.x, position.y).lineTo(position.x + aim.x, position.y + aim.y)
      .stroke({ color: COLORS.cyan, alpha: 0.68, width: 2 });
    if (frame.playerDashing) {
      g.circle(position.x, position.y, 31).stroke({ color: COLORS.cyan, alpha: 0.38, width: 3 });
    }
    g.poly(points).fill({ color: COLORS.white, alpha }).stroke({ color: COLORS.cyan, alpha, width: 3 });
    const centerBack = fromAngle(frame.playerAngle + Math.PI, size * 0.42);
    g.circle(position.x + centerBack.x, position.y + centerBack.y, 4)
      .fill({ color: COLORS.cyan, alpha: 0.9 });
  }

  private drawTrails(g: Graphics, trails: readonly TrailView[]): void {
    trails.forEach((trail) => {
      const position = this.toScreen(trail.position);
      g.poly(this.shipPoints(position, trail.angle, 20))
        .fill({ color: COLORS.cyan, alpha: trail.alpha * 0.12 })
        .stroke({ color: COLORS.cyan, alpha: trail.alpha * 0.48, width: 2 });
    });
  }

  private drawShots(g: Graphics, shots: readonly ShotView[]): void {
    shots.forEach((shot) => {
      const from = this.toScreen(shot.previous);
      const to = this.toScreen(shot.position);
      const color = shot.armed ? COLORS.cyan : COLORS.cyanDim;
      this.bloomLine(g, from, to, color, shot.armed ? 4 : 2, shot.armed ? 0.9 : 0.44);
      g.circle(to.x, to.y, shot.armed ? 4 : 3).fill({ color, alpha: 0.96 });
    });
  }

  private drawParticles(g: Graphics, particles: readonly ParticleView[]): void {
    particles.forEach((particle) => {
      const position = this.toScreen(particle.position);
      g.circle(position.x, position.y, particle.size)
        .fill({ color: particle.color, alpha: particle.alpha });
    });
  }

  private drawPressure(g: Graphics, nowMs: number): void {
    const alpha = 0.12 + (Math.sin(nowMs * 0.012) + 1) * 0.035;
    g.rect(0, 0, WORLD_WIDTH, 28).fill({ color: COLORS.red, alpha });
    g.rect(0, WORLD_HEIGHT - 28, WORLD_WIDTH, 28).fill({ color: COLORS.red, alpha });
    g.rect(0, 0, 28, WORLD_HEIGHT).fill({ color: COLORS.red, alpha });
    g.rect(WORLD_WIDTH - 28, 0, 28, WORLD_HEIGHT).fill({ color: COLORS.red, alpha });
  }

  private lanceAngles(center: number, count: number, spread: number): number[] {
    if (count <= 1) return [center];
    return Array.from({ length: count }, (_, index) => center + (index - (count - 1) / 2) * spread);
  }

  private toScreen(position: Vec2): Vec2 {
    return { x: WORLD_ORIGIN.x + position.x, y: WORLD_ORIGIN.y + position.y };
  }

  private diamond(x: number, y: number, radius: number): number[] {
    return [x, y - radius, x + radius, y, x, y + radius, x - radius, y];
  }

  private shipPoints(center: Vec2, angle: number, size: number): number[] {
    const nose = fromAngle(angle, size);
    const left = fromAngle(angle + 2.38, size * 0.78);
    const notch = fromAngle(angle + Math.PI, size * 0.34);
    const right = fromAngle(angle - 2.38, size * 0.78);
    return [
      center.x + nose.x, center.y + nose.y,
      center.x + left.x, center.y + left.y,
      center.x + notch.x, center.y + notch.y,
      center.x + right.x, center.y + right.y,
    ];
  }

  private orientedPetal(center: Vec2, angle: number, length: number, width: number): number[] {
    const forward = fromAngle(angle, length * 0.52);
    const back = fromAngle(angle + Math.PI, length * 0.48);
    const side = fromAngle(angle + Math.PI / 2, width);
    return [
      center.x + forward.x, center.y + forward.y,
      center.x + side.x * 0.7, center.y + side.y * 0.7,
      center.x + back.x + side.x, center.y + back.y + side.y,
      center.x + back.x - side.x, center.y + back.y - side.y,
      center.x - side.x * 0.7, center.y - side.y * 0.7,
    ];
  }

  private orientedWedge(center: Vec2, angle: number, length: number, width: number): number[] {
    const tip = fromAngle(angle, length);
    const rear = fromAngle(angle + Math.PI, length * 0.72);
    const side = fromAngle(angle + Math.PI / 2, width);
    return [
      center.x + tip.x, center.y + tip.y,
      center.x + rear.x + side.x, center.y + rear.y + side.y,
      center.x + rear.x - side.x, center.y + rear.y - side.y,
    ];
  }

  private dashedCircle(
    g: Graphics,
    x: number,
    y: number,
    radius: number,
    dash: number,
    gap: number,
    color: number,
    alpha: number,
  ): void {
    const circumference = Math.PI * 2 * radius;
    const count = Math.max(12, Math.floor(circumference / (dash + gap)));
    const step = (Math.PI * 2) / count;
    const ratio = dash / (dash + gap);
    for (let index = 0; index < count; index += 1) {
      const start = index * step;
      g.moveTo(x + Math.cos(start) * radius, y + Math.sin(start) * radius)
        .arc(x, y, radius, start, start + step * ratio)
        .stroke({ color, alpha, width: 4 });
    }
  }

  private dashedLine(
    g: Graphics,
    from: Vec2,
    to: Vec2,
    dash: number,
    gap: number,
    color: number,
    alpha: number,
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0) return;
    const count = Math.ceil(distance / (dash + gap));
    for (let index = 0; index < count; index += 1) {
      const start = Math.min(distance, index * (dash + gap));
      const end = Math.min(distance, start + dash);
      g.moveTo(from.x + (dx * start) / distance, from.y + (dy * start) / distance)
        .lineTo(from.x + (dx * end) / distance, from.y + (dy * end) / distance)
        .stroke({ color, alpha, width: 4 });
    }
  }

  private bloomCircle(
    g: Graphics,
    x: number,
    y: number,
    radius: number,
    color: number,
    width: number,
    alpha: number,
  ): void {
    g.circle(x, y, radius).stroke({ color, alpha: alpha * 0.16, width: width + 16 });
    g.circle(x, y, radius).stroke({ color, alpha: alpha * 0.38, width: width + 7 });
    g.circle(x, y, radius).stroke({ color, alpha, width });
  }

  private bloomLine(
    g: Graphics,
    from: Vec2,
    to: Vec2,
    color: number,
    width: number,
    alpha: number,
  ): void {
    g.moveTo(from.x, from.y).lineTo(to.x, to.y)
      .stroke({ color, alpha: alpha * 0.16, width: width + 16 });
    g.moveTo(from.x, from.y).lineTo(to.x, to.y)
      .stroke({ color, alpha: alpha * 0.35, width: width + 7 });
    g.moveTo(from.x, from.y).lineTo(to.x, to.y)
      .stroke({ color, alpha, width });
  }
}
