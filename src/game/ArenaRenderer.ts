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
  armorShadow: 0x0d111c,
  armor: 0x202536,
  armorHigh: 0x34394d,
  armorFace: 0x3f465f,
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
    this.drawBossBackdrop(g);
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
    const openOffset = frame.bossVulnerable ? 4 : 0;
    const rotation = frame.nowMs * (frame.pressure ? 0.00042 : 0.00023);
    const hit = Math.min(1, frame.bossFlash / 75);
    const plateDistance = 67 + openOffset + hit * 3;

    if (frame.version === 37) {
      // The inherited rig stays physically secondary: solid emitters remain
      // inside the body while their thin energy rails carry the larger outline.
      for (let index = 0; index < 6; index += 1) {
        const angle = rotation * 0.42 + index * (Math.PI / 3);
        const railFrom = fromAngle(angle, 102);
        const railTo = fromAngle(angle, 158);
        this.bloomLine(
          g,
          { x: WORLD_ORIGIN.x + railFrom.x, y: WORLD_ORIGIN.y + railFrom.y },
          { x: WORLD_ORIGIN.x + railTo.x, y: WORLD_ORIGIN.y + railTo.y },
          COLORS.magenta,
          2,
          0.38,
        );
        const center = {
          x: WORLD_ORIGIN.x + Math.cos(angle) * 90,
          y: WORLD_ORIGIN.y + Math.sin(angle) * 90,
        };
        const shadowCenter = { x: center.x + 4, y: center.y + 5 };
        g.poly(this.orientedWedge(shadowCenter, angle, 28, 18))
          .fill({ color: COLORS.armorShadow, alpha: 0.9 });
        g.poly(this.orientedWedge(center, angle, 28, 18))
          .fill(COLORS.armor).stroke({ color: COLORS.magenta, alpha: 0.78, width: 2 });
        g.poly(this.orientedWedge(center, angle, 20, 9))
          .fill(COLORS.armorFace).stroke({ color: COLORS.magenta, alpha: 0.42, width: 1 });
      }
      [0, Math.PI].forEach((angle) => {
        const direction = fromAngle(angle, 91);
        const center = { x: WORLD_ORIGIN.x + direction.x, y: WORLD_ORIGIN.y + direction.y };
        const points = this.orientedPetal(center, angle, 54, 26);
        g.poly(points).fill(COLORS.armorHigh).stroke({ color: COLORS.red, alpha: 0.8, width: 2 });
        const emitter = fromAngle(angle, 20);
        g.circle(center.x + emitter.x, center.y + emitter.y, 8)
          .fill(COLORS.armorShadow).stroke({ color: COLORS.red, alpha: 0.86, width: 2 });
        g.circle(center.x + emitter.x, center.y + emitter.y, 4).fill(COLORS.red);
      });
    }

    g.circle(WORLD_ORIGIN.x, WORLD_ORIGIN.y, 77)
      .fill(COLORS.armorShadow).stroke({ color: COLORS.magenta, alpha: 0.4, width: 2 });
    g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, 82))
      .fill(COLORS.armor).stroke({ color: COLORS.magenta, alpha: 0.5, width: 2 });

    for (let index = 0; index < 4; index += 1) {
      const angle = rotation + index * (Math.PI / 2);
      const inner = fromAngle(angle, 35);
      const outer = fromAngle(angle, 79);
      g.moveTo(WORLD_ORIGIN.x + inner.x, WORLD_ORIGIN.y + inner.y)
        .lineTo(WORLD_ORIGIN.x + outer.x, WORLD_ORIGIN.y + outer.y)
        .stroke({ color: COLORS.armorShadow, alpha: 1, width: 20 });
      g.moveTo(WORLD_ORIGIN.x + inner.x, WORLD_ORIGIN.y + inner.y)
        .lineTo(WORLD_ORIGIN.x + outer.x, WORLD_ORIGIN.y + outer.y)
        .stroke({ color: COLORS.armorHigh, alpha: 1, width: 11 });
      const center = {
        x: WORLD_ORIGIN.x + Math.cos(angle) * plateDistance,
        y: WORLD_ORIGIN.y + Math.sin(angle) * plateDistance,
      };
      const shadowCenter = { x: center.x + 5, y: center.y + 6 };
      g.poly(this.orientedPetal(shadowCenter, angle, 88, 44))
        .fill({ color: COLORS.armorShadow, alpha: 0.96 });
      g.poly(this.orientedPetal(center, angle, 88, 44))
        .fill(COLORS.armor).stroke({ color: COLORS.magenta, alpha: 0.92, width: 3 });
      const faceOffset = fromAngle(angle, 4);
      const faceCenter = { x: center.x + faceOffset.x, y: center.y + faceOffset.y };
      g.poly(this.orientedPetal(faceCenter, angle, 62, 27))
        .fill(hit > 0 ? COLORS.white : COLORS.armorFace)
        .stroke({ color: hit > 0 ? COLORS.cyan : COLORS.armorHigh, alpha: 0.92, width: 2 });
      const seamStart = {
        x: center.x - Math.cos(angle) * 20,
        y: center.y - Math.sin(angle) * 20,
      };
      const seamEnd = {
        x: center.x + Math.cos(angle) * 31,
        y: center.y + Math.sin(angle) * 31,
      };
      g.moveTo(seamStart.x, seamStart.y).lineTo(seamEnd.x, seamEnd.y)
        .stroke({ color: COLORS.magenta, alpha: 0.92, width: 2 });
      const bolt = fromAngle(angle, -18);
      g.circle(center.x + bolt.x, center.y + bolt.y, 3)
        .fill(COLORS.white).stroke({ color: COLORS.magenta, alpha: 0.7, width: 1 });
    }

    g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, 60))
      .fill(COLORS.armorShadow).stroke({ color: COLORS.magenta, alpha: 0.82, width: 3 });
    g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, 49))
      .fill(COLORS.armorHigh).stroke({ color: COLORS.armorFace, alpha: 0.9, width: 2 });
    const coreSize = frame.bossVulnerable ? 20 + Math.sin(frame.nowMs * 0.018) * 3 : 13;
    if (frame.bossVulnerable) {
      g.circle(WORLD_ORIGIN.x, WORLD_ORIGIN.y, coreSize + 22)
        .fill({ color: COLORS.cyan, alpha: 0.09 });
      this.bloomCircle(g, WORLD_ORIGIN.x, WORLD_ORIGIN.y, coreSize + 13, COLORS.cyan, 3, 0.76);
      g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, coreSize + 9))
        .stroke({ color: COLORS.cyan, alpha: 0.9, width: 3 });
    }
    g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, coreSize))
      .fill(frame.bossVulnerable ? COLORS.white : COLORS.armorShadow)
      .stroke({ color: frame.bossVulnerable ? COLORS.cyan : COLORS.magenta, width: 3 });
    if (!frame.bossVulnerable) {
      g.poly(this.diamond(WORLD_ORIGIN.x, WORLD_ORIGIN.y, 6)).fill({ color: COLORS.magenta, alpha: 0.72 });
    }
    if (hit > 0) {
      this.bloomCircle(g, WORLD_ORIGIN.x, WORLD_ORIGIN.y, 50 + hit * 13, COLORS.white, 3, hit * 0.9);
      for (let index = 0; index < 8; index += 1) {
        const angle = index * (Math.PI / 4) + rotation * 0.4;
        const from = fromAngle(angle, 28);
        const to = fromAngle(angle, 60 + hit * 16);
        g.moveTo(WORLD_ORIGIN.x + from.x, WORLD_ORIGIN.y + from.y)
          .lineTo(WORLD_ORIGIN.x + to.x, WORLD_ORIGIN.y + to.y)
          .stroke({ color: index % 2 === 0 ? COLORS.white : COLORS.cyan, alpha: hit, width: 3 });
      }
    }
  }

  private drawBossBackdrop(g: Graphics): void {
    g.circle(
      WORLD_ORIGIN.x + 7,
      WORLD_ORIGIN.y + 9,
      COMBAT_TUNING.bossBodyRadius + 9,
    ).fill({ color: COLORS.void, alpha: 0.72 });
  }

  private drawPlayer(g: Graphics, frame: RenderFrame): void {
    const position = this.toScreen(frame.playerPosition);
    const size = frame.playerDashing ? 29 : 25;
    const alpha = frame.playerInvulnerable && !frame.playerDashing
      ? 0.5 + (Math.sin(frame.nowMs * 0.05) + 1) * 0.22
      : 1;
    const aimStart = fromAngle(frame.playerAngle, size * 0.72);
    const aimEnd = fromAngle(frame.playerAngle, 58);
    g.moveTo(position.x + aimStart.x, position.y + aimStart.y)
      .lineTo(position.x + aimEnd.x, position.y + aimEnd.y)
      .stroke({ color: COLORS.cyan, alpha: 0.68, width: 2 });
    if (frame.playerDashing) {
      const rear = fromAngle(frame.playerAngle + Math.PI, size * 0.42);
      const farRear = fromAngle(frame.playerAngle + Math.PI, size * 2.2);
      this.bloomLine(
        g,
        { x: position.x + rear.x, y: position.y + rear.y },
        { x: position.x + farRear.x, y: position.y + farRear.y },
        COLORS.cyan,
        5,
        0.82,
      );
      g.circle(position.x, position.y, 37).stroke({ color: COLORS.cyan, alpha: 0.46, width: 3 });
    }
    const shadowPosition = { x: position.x + 4, y: position.y + 5 };
    g.poly(this.shipPoints(shadowPosition, frame.playerAngle, size + 2))
      .fill({ color: COLORS.void, alpha: 0.86 });
    g.poly(this.shipPoints(position, frame.playerAngle, size))
      .fill({ color: COLORS.armorShadow, alpha }).stroke({ color: COLORS.cyan, alpha, width: 4 });
    g.poly(this.shipPoints(position, frame.playerAngle, size * 0.72))
      .fill({ color: COLORS.white, alpha }).stroke({ color: COLORS.armorFace, alpha, width: 1 });
    const centerBack = fromAngle(frame.playerAngle + Math.PI, size * 0.42);
    const engineSide = fromAngle(frame.playerAngle + Math.PI / 2, 5);
    [-1, 1].forEach((side) => {
      g.circle(
        position.x + centerBack.x + engineSide.x * side,
        position.y + centerBack.y + engineSide.y * side,
        3.5,
      ).fill({ color: COLORS.cyan, alpha: 0.94 });
    });
  }

  private drawTrails(g: Graphics, trails: readonly TrailView[]): void {
    trails.forEach((trail) => {
      const position = this.toScreen(trail.position);
      const rear = fromAngle(trail.angle + Math.PI, 7);
      const farRear = fromAngle(trail.angle + Math.PI, 38);
      this.bloomLine(
        g,
        { x: position.x + rear.x, y: position.y + rear.y },
        { x: position.x + farRear.x, y: position.y + farRear.y },
        COLORS.cyan,
        3,
        trail.alpha * 0.48,
      );
      g.poly(this.shipPoints(position, trail.angle, 24))
        .fill({ color: COLORS.cyan, alpha: trail.alpha * 0.1 })
        .stroke({ color: COLORS.cyan, alpha: trail.alpha * 0.58, width: 3 });
      g.poly(this.shipPoints(position, trail.angle, 17))
        .fill({ color: COLORS.white, alpha: trail.alpha * 0.08 });
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
