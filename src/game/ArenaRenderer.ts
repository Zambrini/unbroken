import { Application, Container, Graphics } from 'pixi.js';
import {
  ARENA_FLOOR_POLYGON,
  COMBAT_TUNING,
  fromAngle,
  type PatternSample,
  type Vec2,
} from '../sim';

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;
export const WORLD_ORIGIN: Vec2 = { x: 800, y: 430 };
const ARENA_FLOOR_SCREEN = ARENA_FLOOR_POLYGON.flatMap(({ x, y }) => [
  WORLD_ORIGIN.x + x,
  WORLD_ORIGIN.y + y,
]);
const ARENA_SHELL_OUTER = [
  118, 142,
  294, 38,
  1306, 38,
  1482, 142,
  1482, 758,
  1306, 862,
  294, 862,
  118, 758,
];
const ARENA_SHELL_MIDDLE = [
  148, 158,
  312, 60,
  1288, 60,
  1452, 158,
  1452, 742,
  1288, 840,
  312, 840,
  148, 742,
];
const ARENA_BEVEL_OUTER = [
  170, 170,
  322, 80,
  1278, 80,
  1430, 170,
  1430, 730,
  1278, 820,
  322, 820,
  170, 730,
];
const COLORS = {
  void: 0x05070c,
  shellVoid: 0x070a11,
  shellShadow: 0x0a0e18,
  shell: 0x121927,
  shellFace: 0x1b2434,
  floor: 0x0a1020,
  floorLow: 0x09111e,
  floorPanel: 0x0c1626,
  floorHigh: 0x0d1829,
  audienceSeat: 0x20283b,
  audienceNeutral: 0x9baabf,
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

interface AudienceRun {
  readonly from: Vec2;
  readonly to: Vec2;
  readonly outward: Vec2;
  readonly seats: number;
  readonly rows: number;
}

const AUDIENCE_RUNS: readonly AudienceRun[] = [
  { from: { x: 350, y: 72 }, to: { x: 1250, y: 72 }, outward: { x: 0, y: -1 }, seats: 44, rows: 2 },
  { from: { x: 189, y: 157 }, to: { x: 315, y: 82 }, outward: { x: -0.52, y: -0.86 }, seats: 10, rows: 2 },
  { from: { x: 1285, y: 82 }, to: { x: 1411, y: 157 }, outward: { x: 0.52, y: -0.86 }, seats: 10, rows: 2 },
  { from: { x: 168, y: 204 }, to: { x: 168, y: 696 }, outward: { x: -1, y: 0 }, seats: 23, rows: 2 },
  { from: { x: 1432, y: 204 }, to: { x: 1432, y: 696 }, outward: { x: 1, y: 0 }, seats: 23, rows: 2 },
  { from: { x: 189, y: 743 }, to: { x: 315, y: 818 }, outward: { x: -0.52, y: 0.86 }, seats: 10, rows: 2 },
  { from: { x: 1285, y: 818 }, to: { x: 1411, y: 743 }, outward: { x: 0.52, y: 0.86 }, seats: 10, rows: 2 },
  { from: { x: 350, y: 828 }, to: { x: 1250, y: 828 }, outward: { x: 0, y: 1 }, seats: 44, rows: 2 },
];

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

interface FramePacingSample {
  readonly frames: number;
  readonly mean: number;
  readonly cadence: number;
  readonly p95: number;
  readonly max: number;
  readonly missedFrames: number;
  readonly worstFrameRatio: number;
}

export class ArenaRenderer {
  private readonly app = new Application();
  private readonly root = new Container();
  private readonly staticWorldGraphics = new Graphics();
  private readonly ambientGraphics = new Graphics();
  private readonly hazardLayer = new Container();
  private readonly hazardGraphics = new Graphics();
  private readonly hazardMask = new Graphics();
  private readonly staticRailGraphics = new Graphics();
  private readonly foregroundGraphics = new Graphics();
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || new URLSearchParams(window.location.search).get('motion') === 'reduce';

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
    this.hazardMask.poly(ARENA_FLOOR_SCREEN).fill(COLORS.white);
    this.hazardLayer.addChild(this.hazardGraphics, this.hazardMask);
    this.hazardLayer.mask = this.hazardMask;
    this.root.addChild(
      this.staticWorldGraphics,
      this.ambientGraphics,
      this.hazardLayer,
      this.staticRailGraphics,
      this.foregroundGraphics,
    );
    this.app.stage.addChild(this.root);
    this.drawStaticWorld(this.staticWorldGraphics);
    this.drawStaticRail(this.staticRailGraphics);
    this.app.canvas.dataset.reducedMotion = String(this.reducedMotion);
    if (new URLSearchParams(window.location.search).get('profile') === '1') {
      void this.measureFramePacing(180, 30).then((sample) => {
        this.app.canvas.dataset.framePacing = JSON.stringify(sample);
      });
    }
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

    const ambient = this.ambientGraphics;
    const hazards = this.hazardGraphics;
    const foreground = this.foregroundGraphics;
    ambient.clear();
    hazards.clear();
    foreground.clear();

    this.drawAudienceLights(ambient, frame);
    this.drawArenaSignals(ambient, frame);
    this.drawFixtureLights(ambient, frame.nowMs);
    this.drawHazards(hazards, frame);
    this.drawContainmentRail(foreground, frame);
    this.drawTrails(foreground, frame.trails);
    this.drawBoss(foreground, frame);
    this.drawShots(foreground, frame.shots);
    this.drawPlayer(foreground, frame);
    this.drawParticles(foreground, frame.particles);
    if (frame.pressure) this.drawPressure(foreground, frame.nowMs);
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }

  private measureFramePacing(frames: number, warmupFrames: number): Promise<FramePacingSample> {
    const sampleCount = Math.max(1, Math.round(frames));
    let warmupRemaining = Math.max(0, Math.round(warmupFrames));
    const samples: number[] = [];

    return new Promise((resolve) => {
      let previous = performance.now();
      const sample = (now: number) => {
        const delta = now - previous;
        previous = now;
        if (warmupRemaining > 0) {
          warmupRemaining -= 1;
          requestAnimationFrame(sample);
          return;
        }
        samples.push(delta);
        if (samples.length < sampleCount) {
          requestAnimationFrame(sample);
          return;
        }
        const sorted = [...samples].sort((left, right) => left - right);
        const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
        const cadence = sorted[Math.floor(sorted.length / 2)] ?? 0;
        const max = sorted.at(-1) ?? 0;
        resolve({
          frames: samples.length,
          mean: samples.reduce((total, value) => total + value, 0) / samples.length,
          cadence,
          p95: sorted[p95Index] ?? 0,
          max,
          missedFrames: samples.filter((value) => cadence > 0 && value > cadence * 1.5).length,
          worstFrameRatio: cadence > 0 ? max / cadence : 0,
        });
      };
      requestAnimationFrame(sample);
    });
  }

  private drawStaticWorld(g: Graphics): void {
    g.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(COLORS.void);
    g.poly(ARENA_SHELL_OUTER)
      .fill(COLORS.shellVoid)
      .stroke({ color: COLORS.shellFace, alpha: 0.42, width: 2 });
    g.poly(ARENA_SHELL_MIDDLE)
      .fill(COLORS.shellShadow)
      .stroke({ color: COLORS.shellFace, alpha: 0.5, width: 2 });

    this.drawAudienceStructure(g);
    this.drawArenaStructure(g);
    this.drawFixtureBodies(g);
    this.drawBossBackdrop(g);
  }

  private drawAudienceStructure(g: Graphics): void {
    AUDIENCE_RUNS.forEach((run) => {
      const angle = Math.atan2(run.to.y - run.from.y, run.to.x - run.from.x);
      g.moveTo(run.from.x, run.from.y).lineTo(run.to.x, run.to.y)
        .stroke({ color: COLORS.shellFace, alpha: 0.66, width: 22 });
      g.moveTo(run.from.x, run.from.y).lineTo(run.to.x, run.to.y)
        .stroke({ color: COLORS.shellVoid, alpha: 1, width: 15 });

      for (let row = 0; row < run.rows; row += 1) {
        for (let seat = 0; seat < run.seats; seat += 1) {
          const center = this.audienceSeatPosition(run, row, seat);
          g.poly(this.orientedRect(center, angle, 4.8, 2.15))
            .fill({ color: COLORS.audienceSeat, alpha: row === 0 ? 0.92 : 0.7 });
        }
      }
    });
  }

  private drawAudienceLights(g: Graphics, frame: RenderFrame): void {
    const phase = this.reducedMotion ? 0 : Math.floor(frame.nowMs / 560);
    const pulse = this.reducedMotion ? 0.58 : 0.54 + Math.sin(frame.nowMs * 0.002) * 0.045;
    const density = (frame.spectator ? 5 : 4) + (frame.pressure ? 1 : 0);
    let globalIndex = 0;

    AUDIENCE_RUNS.forEach((run) => {
      const angle = Math.atan2(run.to.y - run.from.y, run.to.x - run.from.x);
      for (let row = 0; row < run.rows; row += 1) {
        for (let seat = 0; seat < run.seats; seat += 1) {
          const lit = (globalIndex * 7 + phase * 5) % 19 < density;
          if (lit) {
            const center = this.audienceSeatPosition(run, row, seat);
            const color = globalIndex % 11 === 0
              ? COLORS.audienceNeutral
              : globalIndex % 4 === 0
                ? COLORS.cyan
                : COLORS.magenta;
            const colorAlpha = color === COLORS.audienceNeutral ? 0.52 : 0.59;
            g.poly(this.orientedRect(center, angle, 4, 1.5))
              .fill({ color, alpha: pulse * colorAlpha });
          }
          globalIndex += 1;
        }
      }
    });
  }

  private drawArenaStructure(g: Graphics): void {
    g.poly(this.offsetPoints(ARENA_BEVEL_OUTER, 7, 9))
      .fill({ color: COLORS.void, alpha: 0.92 });
    g.poly(ARENA_BEVEL_OUTER)
      .fill(COLORS.shell)
      .stroke({ color: COLORS.shellFace, alpha: 0.56, width: 2 });
    g.poly(ARENA_FLOOR_SCREEN).fill(COLORS.floor);

    const vertices = ARENA_FLOOR_POLYGON.map(({ x, y }) => ({
      x: WORLD_ORIGIN.x + x,
      y: WORLD_ORIGIN.y + y,
    }));
    vertices.forEach((vertex, index) => {
      const next = vertices[(index + 1) % vertices.length];
      if (!next) return;
      const color = index % 3 === 0
        ? COLORS.floorHigh
        : index % 2 === 0
          ? COLORS.floorPanel
          : COLORS.floorLow;
      g.poly([
        WORLD_ORIGIN.x, WORLD_ORIGIN.y,
        vertex.x, vertex.y,
        next.x, next.y,
      ]).fill({ color, alpha: 0.72 });
    });

    vertices.forEach((vertex) => {
      g.moveTo(WORLD_ORIGIN.x, WORLD_ORIGIN.y)
        .lineTo(vertex.x, vertex.y)
        .stroke({ color: COLORS.shellFace, alpha: 0.22, width: 1 });
    });
    [108, 218, 326].forEach((radius, index) => {
      g.circle(WORLD_ORIGIN.x, WORLD_ORIGIN.y, radius)
        .stroke({ color: COLORS.cyanDim, alpha: 0.17 - index * 0.025, width: 1 });
    });
    g.poly([210, 196, 348, 116, 1252, 116, 1390, 196, 1390, 704, 1252, 784, 348, 784, 210, 704])
      .stroke({ color: COLORS.shellFace, alpha: 0.54, width: 1 });
    g.moveTo(280, WORLD_ORIGIN.y).lineTo(1320, WORLD_ORIGIN.y)
      .stroke({ color: COLORS.cyanDim, alpha: 0.18, width: 1 });
    g.moveTo(WORLD_ORIGIN.x, 150).lineTo(WORLD_ORIGIN.x, 710)
      .stroke({ color: COLORS.cyanDim, alpha: 0.15, width: 1 });

    for (let index = 0; index < 8; index += 1) {
      const angle = index * (Math.PI / 4);
      const center = fromAngle(angle, 314);
      const marker = { x: WORLD_ORIGIN.x + center.x, y: WORLD_ORIGIN.y + center.y };
      g.poly(this.orientedRect(marker, angle, 7, 3.5))
        .fill(COLORS.shellShadow)
        .stroke({ color: COLORS.cyanDim, alpha: 0.28, width: 1 });
    }

    g.poly(this.offsetPoints(ARENA_FLOOR_SCREEN, 4, 5))
      .stroke({ color: COLORS.void, alpha: 0.95, width: 22 });
    g.poly(ARENA_FLOOR_SCREEN)
      .stroke({ color: COLORS.armorShadow, alpha: 1, width: 18 });
    g.poly(ARENA_FLOOR_SCREEN)
      .stroke({ color: COLORS.armor, alpha: 1, width: 11 });
  }

  private drawStaticRail(g: Graphics): void {
    g.poly(ARENA_FLOOR_SCREEN)
      .stroke({ color: COLORS.armorHigh, alpha: 0.52, width: 5 });
    ARENA_FLOOR_POLYGON.forEach(({ x, y }) => {
      const center = { x: WORLD_ORIGIN.x + x, y: WORLD_ORIGIN.y + y };
      g.poly(this.regularPolygon(center, 10, 8, Math.PI / 8))
        .fill(COLORS.armorShadow)
        .stroke({ color: COLORS.armorHigh, alpha: 0.72, width: 2 });
      g.circle(center.x, center.y, 2).fill({ color: COLORS.magenta, alpha: 0.52 });
    });

    const clamps = [
      { center: { x: 800, y: 94 }, angle: 0 },
      { center: { x: 800, y: 806 }, angle: 0 },
      { center: { x: 188, y: 450 }, angle: Math.PI / 2 },
      { center: { x: 1412, y: 450 }, angle: Math.PI / 2 },
    ];
    clamps.forEach(({ center, angle }) => {
      g.poly(this.orientedRect({ x: center.x + 3, y: center.y + 4 }, angle, 19, 8))
        .fill(COLORS.void);
      g.poly(this.orientedRect(center, angle, 18, 7))
        .fill(COLORS.armor)
        .stroke({ color: COLORS.armorFace, alpha: 0.68, width: 2 });
      g.poly(this.orientedRect(center, angle, 9, 2))
        .fill({ color: COLORS.cyanDim, alpha: 0.42 });
    });
  }

  private drawArenaSignals(g: Graphics, frame: RenderFrame): void {
    if (frame.bossVulnerable) {
      this.dashedCircle(g, WORLD_ORIGIN.x, WORLD_ORIGIN.y, COMBAT_TUNING.breakRange, 18, 12, COLORS.cyan, 0.25);
    }
  }

  private drawContainmentRail(g: Graphics, frame: RenderFrame): void {
    const threatVisible = frame.sample?.phase === 'telegraph' || frame.sample?.phase === 'active';
    const pulse = threatVisible
      ? this.reducedMotion ? 0.78 : 0.78 + Math.sin(frame.nowMs * 0.006) * 0.06
      : 0.62;
    g.poly(ARENA_FLOOR_SCREEN)
      .stroke({ color: COLORS.magenta, alpha: threatVisible ? 0.12 : 0.07, width: 9 });
    g.poly(ARENA_FLOOR_SCREEN)
      .stroke({ color: COLORS.magenta, alpha: pulse, width: 2 });
  }

  private drawFixtureBodies(g: Graphics): void {
    // Forked relay pylon, upper-left.
    const relay = { x: 340, y: 105 };
    g.poly(this.regularPolygon({ x: relay.x + 6, y: relay.y + 7 }, 34, 6, Math.PI / 6))
      .fill(COLORS.void);
    g.poly(this.regularPolygon(relay, 34, 6, Math.PI / 6))
      .fill(COLORS.shell)
      .stroke({ color: COLORS.armorFace, alpha: 0.62, width: 2 });
    g.poly(this.regularPolygon(relay, 26, 6, Math.PI / 6))
      .fill(COLORS.armorShadow)
      .stroke({ color: COLORS.cyanDim, alpha: 0.42, width: 2 });
    g.poly([324, 108, 332, 95, 348, 95, 356, 108, 351, 127, 329, 127])
      .fill(COLORS.armor)
      .stroke({ color: COLORS.armorHigh, alpha: 0.7, width: 2 });
    this.drawStructuralLine(g, { x: 340, y: 103 }, { x: 340, y: 71 }, 7);
    this.drawStructuralLine(g, { x: 340, y: 81 }, { x: 324, y: 60 }, 7);
    this.drawStructuralLine(g, { x: 340, y: 81 }, { x: 356, y: 60 }, 7);

    // Prism shield node, upper-right.
    const prism = { x: 1260, y: 105 };
    g.poly(this.regularPolygon({ x: prism.x + 6, y: prism.y + 7 }, 36, 6, Math.PI / 6))
      .fill(COLORS.void);
    g.poly(this.regularPolygon(prism, 36, 6, Math.PI / 6))
      .fill(COLORS.shell)
      .stroke({ color: COLORS.armorFace, alpha: 0.62, width: 2 });
    g.poly(this.regularPolygon(prism, 27, 6, Math.PI / 6))
      .fill(COLORS.armorShadow)
      .stroke({ color: COLORS.magenta, alpha: 0.34, width: 2 });
    g.poly(this.offsetPoints([1260, 73, 1277, 101, 1260, 134, 1243, 101], 5, 6))
      .fill(COLORS.void);
    g.poly([1260, 73, 1277, 101, 1260, 134, 1243, 101])
      .fill(COLORS.armor)
      .stroke({ color: COLORS.armorFace, alpha: 0.74, width: 2 });
    g.poly([1260, 78, 1260, 129, 1247, 101])
      .fill({ color: COLORS.armorHigh, alpha: 0.52 });
    g.poly([1260, 78, 1273, 101, 1260, 129])
      .fill({ color: COLORS.armorFace, alpha: 0.38 });

    // Three camera masts, left service trench.
    [197, 224, 251].forEach((x, index) => {
      const baseY = 600 + index * 18;
      const height = 54 + index * 8;
      const headY = baseY - height;
      g.poly(this.regularPolygon({ x: x + 5, y: baseY + 6 }, 14, 6, Math.PI / 6))
        .fill(COLORS.void);
      g.poly(this.regularPolygon({ x, y: baseY }, 14, 6, Math.PI / 6))
        .fill(COLORS.armor)
        .stroke({ color: COLORS.armorFace, alpha: 0.62, width: 2 });
      this.drawStructuralLine(g, { x, y: baseY - 7 }, { x: x + 5, y: headY }, 5);
      g.poly(this.offsetPoints([x - 7, headY - 4, x + 14, headY - 10, x + 23, headY - 2, x, headY + 7], 4, 5))
        .fill(COLORS.void);
      g.poly([x - 7, headY - 4, x + 14, headY - 10, x + 23, headY - 2, x, headY + 7])
        .fill(COLORS.armorHigh)
        .stroke({ color: COLORS.armorFace, alpha: 0.7, width: 2 });
    });

    // Maintenance pod, lower-right.
    const pod = [1200, 774, 1230, 750, 1284, 756, 1304, 790, 1288, 831, 1226, 839, 1198, 810];
    g.poly(this.offsetPoints(pod, 8, 10)).fill(COLORS.void);
    g.poly(pod)
      .fill(COLORS.shell)
      .stroke({ color: COLORS.armorFace, alpha: 0.62, width: 2 });
    g.poly([1213, 778, 1237, 762, 1277, 766, 1291, 791, 1279, 819, 1232, 826, 1211, 806])
      .fill(COLORS.armor)
      .stroke({ color: COLORS.red, alpha: 0.34, width: 2 });
    g.poly([1249, 772, 1270, 809, 1228, 809])
      .fill(COLORS.armorShadow)
      .stroke({ color: COLORS.armorFace, alpha: 0.56, width: 2 });
    g.moveTo(1240, 833).bezierCurveTo(1240, 844, 1214, 846, 1207, 858)
      .stroke({ color: COLORS.void, alpha: 0.92, width: 10 });
    g.moveTo(1240, 833).bezierCurveTo(1240, 844, 1214, 846, 1207, 858)
      .stroke({ color: COLORS.armorHigh, alpha: 0.72, width: 4 });
    g.moveTo(1261, 832).bezierCurveTo(1264, 845, 1243, 850, 1237, 860)
      .stroke({ color: COLORS.void, alpha: 0.92, width: 9 });
    g.moveTo(1261, 832).bezierCurveTo(1264, 845, 1243, 850, 1237, 860)
      .stroke({ color: COLORS.armor, alpha: 0.82, width: 4 });
  }

  private drawFixtureLights(g: Graphics, nowMs: number): void {
    const pulse = this.reducedMotion ? 0.68 : 0.64 + Math.sin(nowMs * 0.003) * 0.08;

    this.bloomLine(g, { x: 340, y: 103 }, { x: 340, y: 71 }, COLORS.cyan, 2, pulse * 0.66);
    this.bloomLine(g, { x: 340, y: 81 }, { x: 324, y: 60 }, COLORS.cyan, 2, pulse * 0.66);
    this.bloomLine(g, { x: 340, y: 81 }, { x: 356, y: 60 }, COLORS.cyan, 2, pulse * 0.66);
    g.circle(324, 60, 3).fill({ color: COLORS.cyan, alpha: pulse * 0.64 });
    g.circle(356, 60, 3).fill({ color: COLORS.cyan, alpha: pulse * 0.64 });

    g.poly([1260, 78, 1273, 101, 1260, 129, 1247, 101])
      .stroke({ color: COLORS.magenta, alpha: pulse * 0.58, width: 2 });
    g.moveTo(1260, 78).lineTo(1260, 129)
      .stroke({ color: COLORS.magenta, alpha: pulse * 0.42, width: 1 });

    [197, 224, 251].forEach((x, index) => {
      const baseY = 600 + index * 18;
      const headY = baseY - (54 + index * 8);
      g.circle(x + 19, headY - 3, 3)
        .fill({ color: COLORS.cyan, alpha: pulse * (0.42 - index * 0.04) });
    });

    g.poly([1249, 779, 1262, 803, 1236, 803])
      .stroke({ color: COLORS.red, alpha: pulse * 0.5, width: 2 });
    g.circle(1218, 792, 3).fill({ color: COLORS.red, alpha: pulse * 0.42 });
    g.circle(1283, 792, 3).fill({ color: COLORS.red, alpha: pulse * 0.42 });
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
    const motionNowMs = this.reducedMotion ? 0 : frame.nowMs;
    const rotation = motionNowMs * (frame.pressure ? 0.00042 : 0.00023);
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
    const coreSize = frame.bossVulnerable
      ? 20 + (this.reducedMotion ? 0 : Math.sin(frame.nowMs * 0.018) * 3)
      : 13;
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
    g.ellipse(
      WORLD_ORIGIN.x + 13,
      WORLD_ORIGIN.y + 17,
      COMBAT_TUNING.bossBodyRadius + 21,
      COMBAT_TUNING.bossBodyRadius * 0.7,
    ).fill({ color: COLORS.void, alpha: 0.38 });
    g.ellipse(
      WORLD_ORIGIN.x + 8,
      WORLD_ORIGIN.y + 11,
      COMBAT_TUNING.bossBodyRadius + 8,
      COMBAT_TUNING.bossBodyRadius * 0.58,
    ).fill({ color: COLORS.shellVoid, alpha: 0.58 });
  }

  private drawPlayer(g: Graphics, frame: RenderFrame): void {
    const position = this.toScreen(frame.playerPosition);
    const size = frame.playerDashing ? 29 : 25;
    const alpha = frame.playerInvulnerable && !frame.playerDashing
      ? this.reducedMotion ? 0.68 : 0.5 + (Math.sin(frame.nowMs * 0.05) + 1) * 0.22
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
    const alpha = this.reducedMotion ? 0.145 : 0.12 + (Math.sin(nowMs * 0.012) + 1) * 0.035;
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

  private audienceSeatPosition(run: AudienceRun, row: number, seat: number): Vec2 {
    const progress = (seat + 0.5) / run.seats;
    return {
      x: run.from.x + (run.to.x - run.from.x) * progress + run.outward.x * row * 10,
      y: run.from.y + (run.to.y - run.from.y) * progress + run.outward.y * row * 10,
    };
  }

  private offsetPoints(points: readonly number[], dx: number, dy: number): number[] {
    return points.map((value, index) => value + (index % 2 === 0 ? dx : dy));
  }

  private regularPolygon(center: Vec2, radius: number, sides: number, rotation = 0): number[] {
    return Array.from({ length: sides }, (_, index) => {
      const angle = rotation + index * (Math.PI * 2 / sides);
      return [center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius];
    }).flat();
  }

  private orientedRect(center: Vec2, angle: number, halfLength: number, halfWidth: number): number[] {
    const forward = fromAngle(angle, halfLength);
    const side = fromAngle(angle + Math.PI / 2, halfWidth);
    return [
      center.x - forward.x - side.x, center.y - forward.y - side.y,
      center.x + forward.x - side.x, center.y + forward.y - side.y,
      center.x + forward.x + side.x, center.y + forward.y + side.y,
      center.x - forward.x + side.x, center.y - forward.y + side.y,
    ];
  }

  private drawStructuralLine(g: Graphics, from: Vec2, to: Vec2, width: number): void {
    g.moveTo(from.x + 4, from.y + 5).lineTo(to.x + 4, to.y + 5)
      .stroke({ color: COLORS.void, alpha: 0.94, width: width + 6 });
    g.moveTo(from.x, from.y).lineTo(to.x, to.y)
      .stroke({ color: COLORS.armorHigh, alpha: 0.96, width });
    g.moveTo(from.x - 1, from.y - 1).lineTo(to.x - 1, to.y - 1)
      .stroke({ color: COLORS.armorFace, alpha: 0.58, width: Math.max(1, width * 0.24) });
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
