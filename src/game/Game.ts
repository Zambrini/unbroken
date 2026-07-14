import {
  ARENA_BOUNDS,
  COMBAT_TUNING,
  ROUND_COUNTDOWN_MS,
  ROUND_DURATION_MS,
  VERSION_SCRIPTS,
  add,
  buildVersionTimeline,
  circleIntersectsLine,
  circleIntersectsRing,
  clampOutsideCircle,
  clampToArena,
  distance,
  fromAngle,
  length,
  lerp,
  normalize,
  predictDashCatchTarget,
  rayIntersectsCircle,
  resolveBossShotCollision,
  sampleTimeline,
  scale,
  subtract,
  vec,
  type AttackPattern,
  type BossVersionScript,
  type PatternSample,
  type PatternWindow,
  type Vec2,
} from '../sim';
import { ArenaAudio } from '../audio/ArenaAudio';
import { Hud } from '../ui/Hud';
import {
  ArenaRenderer,
  WORLD_ORIGIN,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type ParticleView,
  type PatternLockView,
  type RenderFrame,
  type ShotView,
  type TrailView,
} from './ArenaRenderer';
import { Input } from './Input';

type GameMode = 'title' | 'countdown' | 'fight' | 'roundWin' | 'evolution' | 'defeat' | 'payoff';

interface PlayerState {
  position: Vec2;
  velocity: Vec2;
  dashDirection: Vec2;
  angle: number;
  integrity: number;
  invulnerableMs: number;
  dashRemainingMs: number;
  dashCooldownMs: number;
  fireCooldownMs: number;
  trailCooldownMs: number;
}

interface ShotState extends ShotView {
  readonly coreAligned: boolean;
  velocity: Vec2;
  lifeMs: number;
}

interface TrailState extends TrailView {
  lifeMs: number;
  maxLifeMs: number;
}

interface ParticleState extends ParticleView {
  velocity: Vec2;
  lifeMs: number;
  maxLifeMs: number;
}

export interface GameSnapshot {
  readonly mode: GameMode;
  readonly version: number;
  readonly secondsRemaining: number;
  readonly playerIntegrity: number;
  readonly bossHealth: number;
  readonly bossHealthMax: number;
  readonly pattern: string | null;
  readonly phase: string | null;
  readonly pressure: boolean;
  readonly spectator: boolean;
  readonly overlayVisible: boolean;
}

interface DebugApi {
  snapshot: () => GameSnapshot;
  start: () => void;
  damageBoss: (amount?: number) => void;
  setPlayerIntegrity: (integrity: number) => void;
  show: (state: 'entry' | 'pressure' | 'payoff') => void;
}

declare global {
  interface Window {
    __UNBROKEN__?: DebugApi;
  }
}

const BOSS_POSITION = vec(0, 0);
const FIXED_STEP_MS = COMBAT_TUNING.fixedStepMs;

export class Game {
  private readonly renderer: ArenaRenderer;
  private readonly hud = new Hud();
  private readonly audio = new ArenaAudio();
  private readonly input: Input;
  private readonly spectator: boolean;
  private readonly debugState: string | null;

  private mode: GameMode = 'title';
  private version: 1 | 37 = 1;
  private script: BossVersionScript = VERSION_SCRIPTS.V01;
  private timeline: readonly PatternWindow[] = buildVersionTimeline(this.script);
  private sample: PatternSample | null = null;
  private lock: PatternLockView = { lanceAngle: Math.PI / 2, dashTarget: vec(180, 150) };
  private player: PlayerState = this.createPlayer();
  private bossHealth = this.script.bossHealth;
  private bossFlashMs = 0;
  private bossVulnerable = false;
  private roundElapsedMs = 0;
  private modeTimerMs = 0;
  private accumulatorMs = 0;
  private lastFrameMs = performance.now();
  private animationFrame = 0;
  private currentOccurrence = -1;
  private lastHazardHitOccurrence = -1;
  private freezeMs = 0;
  private shakeMs = 0;
  private shakeStrength = 0;
  private feedbackText = '';
  private feedbackMs = 0;
  private shots: ShotState[] = [];
  private trails: TrailState[] = [];
  private particles: ParticleState[] = [];
  private attempts = { 1: 0, 37: 0 };
  private defeats = { 1: 0, 37: 0 };
  private dashesThisRun = 0;
  private lastWinSeconds = 0;
  private debugFreeze = false;

  constructor(options: { frame: HTMLElement; mount: HTMLElement }) {
    this.renderer = new ArenaRenderer(options.mount);
    this.input = new Input(options.frame, WORLD_WIDTH, WORLD_HEIGHT);
    const params = new URLSearchParams(window.location.search);
    this.debugState = params.get('debug');
    this.spectator = params.get('spectator') === '1'
      || window.matchMedia('(pointer: coarse)').matches
      || window.innerWidth < 700;
  }

  async init(): Promise<void> {
    await this.renderer.init();
    if (this.spectator && this.debugState === null) {
      this.version = 37;
      this.script = VERSION_SCRIPTS.V37;
      this.timeline = buildVersionTimeline(this.script);
      this.bossHealth = this.script.bossHealth;
    }
    this.input.setEnabled(false);
    this.showTitle();
    this.installDebugApi();
    if (this.debugState === 'entry' || this.debugState === 'pressure' || this.debugState === 'payoff') {
      this.showDebug(this.debugState);
    }
    this.lastFrameMs = performance.now();
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  enter(): void {
    this.audio.start();
    if (this.mode === 'title' || this.mode === 'payoff') {
      this.dashesThisRun = 0;
      this.attempts = { 1: 0, 37: 0 };
      this.defeats = { 1: 0, 37: 0 };
      this.startRound(this.spectator ? 37 : 1);
      return;
    }
    if (this.mode === 'defeat') this.startRound(this.version);
  }

  toggleMute(): void {
    this.audio.setMuted(!this.audio.isMuted());
    this.hud.setMuted(this.audio.isMuted());
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.input.destroy();
    this.renderer.destroy();
    delete window.__UNBROKEN__;
  }

  private readonly loop = (nowMs: number): void => {
    const frameMs = Math.min(50, Math.max(0, nowMs - this.lastFrameMs));
    this.lastFrameMs = nowMs;
    this.accumulatorMs += frameMs;

    while (this.accumulatorMs >= FIXED_STEP_MS) {
      this.update(FIXED_STEP_MS);
      this.accumulatorMs -= FIXED_STEP_MS;
    }

    this.audio.updateMusic(this.mode === 'fight', this.isPressure());
    this.render(nowMs);
    this.animationFrame = requestAnimationFrame(this.loop);
  };

  private update(dtMs: number): void {
    if (this.input.consumeMute()) this.toggleMute();
    if (this.input.consumeRetry() && this.mode === 'defeat') this.startRound(this.version);
    if (this.debugFreeze) return;

    this.updateEffects(dtMs);
    if (this.freezeMs > 0) {
      this.freezeMs = Math.max(0, this.freezeMs - dtMs);
      return;
    }

    switch (this.mode) {
      case 'countdown':
        this.modeTimerMs -= dtMs;
        if (this.modeTimerMs <= 0) {
          this.mode = 'fight';
          this.input.setEnabled(!this.spectator);
          this.hud.announce(`Challenger entered against HEIR version ${this.version}.`);
        }
        break;
      case 'fight':
        this.updateFight(dtMs);
        break;
      case 'roundWin':
        this.modeTimerMs -= dtMs;
        if (this.modeTimerMs <= 0) {
          if (this.version === 1) this.beginEvolution();
          else this.showPayoff();
        }
        break;
      case 'evolution':
        this.modeTimerMs -= dtMs;
        if (this.modeTimerMs <= 0) this.startRound(37);
        break;
      case 'defeat':
        this.modeTimerMs -= dtMs;
        if (this.modeTimerMs <= 0) this.startRound(this.version);
        break;
      case 'title':
      case 'payoff':
        break;
    }
  }

  private updateFight(dtMs: number): void {
    this.roundElapsedMs = Math.min(ROUND_DURATION_MS, this.roundElapsedMs + dtMs);
    const nextSample = sampleTimeline(this.timeline, this.roundElapsedMs);
    if (nextSample?.window.occurrence !== this.currentOccurrence) {
      this.currentOccurrence = nextSample?.window.occurrence ?? -1;
      if (nextSample) this.capturePatternLock(nextSample.pattern);
      if (nextSample?.phase === 'telegraph') this.audio.telegraph();
    }
    this.sample = nextSample;
    this.bossVulnerable = nextSample?.phase === 'opening';

    this.updatePlayer(dtMs);
    this.updateShots(dtMs);
    this.checkHazardCollision();

    if (this.bossHealth <= 0) {
      this.winRound();
      return;
    }
    if (this.player.integrity <= 0 || this.roundElapsedMs >= ROUND_DURATION_MS) {
      this.loseRound();
    }
  }

  private updatePlayer(dtMs: number): void {
    const dt = dtMs / 1000;
    const previousPosition = { ...this.player.position };
    const movement = this.spectator ? this.spectatorMovement() : this.input.movement();
    const playerScreen = {
      x: WORLD_ORIGIN.x + this.player.position.x,
      y: WORLD_ORIGIN.y + this.player.position.y,
    };
    this.player.angle = this.spectator
      ? Math.atan2(-this.player.position.y, -this.player.position.x)
      : Math.atan2(this.input.pointer.y - playerScreen.y, this.input.pointer.x - playerScreen.x);

    const spectatorDash = this.spectator && this.shouldSpectatorDash();
    const wantsDash = this.input.consumeDash() || spectatorDash;
    if (wantsDash && this.player.dashCooldownMs <= 0) {
      const fallback = fromAngle(this.player.angle);
      const direction = length(movement) > 0 ? movement : fallback;
      this.startDash(direction);
    }

    this.player.dashCooldownMs = Math.max(0, this.player.dashCooldownMs - dtMs);
    this.player.invulnerableMs = Math.max(0, this.player.invulnerableMs - dtMs);
    this.player.fireCooldownMs = Math.max(0, this.player.fireCooldownMs - dtMs);
    this.player.trailCooldownMs = Math.max(0, this.player.trailCooldownMs - dtMs);

    if (this.player.dashRemainingMs > 0) {
      const dashSpeed = COMBAT_TUNING.dashDistance / (COMBAT_TUNING.dashDurationMs / 1000);
      this.player.velocity = scale(this.player.dashDirection, dashSpeed);
      this.player.position = add(this.player.position, scale(this.player.velocity, dt));
      this.player.dashRemainingMs = Math.max(0, this.player.dashRemainingMs - dtMs);
      this.player.invulnerableMs = Math.max(this.player.invulnerableMs, this.player.dashRemainingMs + 40);
    } else {
      const desiredVelocity = scale(movement, COMBAT_TUNING.playerMoveSpeed);
      const acceleration = 1 - Math.exp(-22 * dt);
      this.player.velocity = lerp(this.player.velocity, desiredVelocity, acceleration);
      if (length(movement) === 0 && length(this.player.velocity) < 3) this.player.velocity = vec();
      this.player.position = add(this.player.position, scale(this.player.velocity, dt));
    }
    this.player.position = clampToArena(this.player.position, ARENA_BOUNDS, COMBAT_TUNING.playerRadius);
    this.player.position = clampOutsideCircle(
      this.player.position,
      BOSS_POSITION,
      COMBAT_TUNING.bossBodyRadius + COMBAT_TUNING.playerRadius,
      subtract(previousPosition, BOSS_POSITION),
    );
    if (this.player.dashRemainingMs > 0 && this.player.trailCooldownMs <= 0) {
      this.trails.push({
        position: { ...this.player.position },
        angle: this.player.angle,
        alpha: 1,
        lifeMs: 210,
        maxLifeMs: 210,
      });
      this.player.trailCooldownMs = 45;
    }

    const spectatorFire = this.spectator && this.bossVulnerable;
    if ((this.input.isShooting() || spectatorFire) && this.player.fireCooldownMs <= 0) {
      this.fireShot();
    }
  }

  private startDash(direction: Vec2): void {
    this.player.dashDirection = normalize(direction);
    this.player.dashRemainingMs = COMBAT_TUNING.dashDurationMs;
    this.player.dashCooldownMs = COMBAT_TUNING.dashCooldownMs;
    this.player.invulnerableMs = COMBAT_TUNING.dashDurationMs + 50;
    this.player.trailCooldownMs = 0;
    this.dashesThisRun += 1;
    this.shakeMs = 90;
    this.shakeStrength = 2.5;
    this.audio.dash();
  }

  private fireShot(): void {
    const direction = fromAngle(this.player.angle);
    const start = add(this.player.position, scale(direction, 23));
    const armed = distance(this.player.position, BOSS_POSITION) <= COMBAT_TUNING.breakRange;
    this.shots.push({
      position: start,
      previous: start,
      velocity: scale(direction, COMBAT_TUNING.shotSpeed),
      armed,
      coreAligned: rayIntersectsCircle(start, direction, {
        center: BOSS_POSITION,
        radius: COMBAT_TUNING.bossCoreRadius + COMBAT_TUNING.shotRadius,
      }),
      lifeMs: 900,
    });
    this.player.fireCooldownMs = COMBAT_TUNING.shotIntervalMs;
    this.audio.shot();
  }

  private updateShots(dtMs: number): void {
    const dt = dtMs / 1000;
    const survivors: ShotState[] = [];
    for (const shot of this.shots) {
      shot.previous = { ...shot.position };
      shot.position = add(shot.position, scale(shot.velocity, dt));
      shot.lifeMs -= dtMs;

      const outcome = resolveBossShotCollision({
        shot: { center: shot.position, radius: COMBAT_TUNING.shotRadius },
        core: { center: BOSS_POSITION, radius: COMBAT_TUNING.bossCoreRadius },
        armor: { center: BOSS_POSITION, radius: COMBAT_TUNING.bossBodyRadius },
        bossVulnerable: this.bossVulnerable,
        armed: shot.armed,
        coreAligned: shot.coreAligned,
      });
      if (outcome === 'hit') {
        this.hitBoss();
        continue;
      }
      if (outcome !== 'none') {
        const message = outcome === 'core-sealed'
          ? 'CORE SEALED'
          : outcome === 'enter-break-range'
            ? 'ENTER BREAK RANGE'
            : 'CORE MISSED';
        this.ricochet(shot.position, message);
        continue;
      }
      if (shot.lifeMs > 0) survivors.push(shot);
    }
    this.shots = survivors;
  }

  private hitBoss(): void {
    this.bossHealth = Math.max(0, this.bossHealth - 1);
    this.bossFlashMs = 75;
    this.freezeMs = 34;
    this.shakeMs = 130;
    this.shakeStrength = this.bossHealth <= 0 ? 18 : 6;
    this.feedbackText = 'CORE HIT';
    this.feedbackMs = 260;
    this.audio.coreHit();
    this.spawnBurst(BOSS_POSITION, 0x2ef2ff, 8, 150);
    this.spawnBurst(BOSS_POSITION, 0xf4f7ff, 5, 110);
  }

  private ricochet(position: Vec2, message: string): void {
    this.feedbackText = message;
    this.feedbackMs = 420;
    this.audio.shield();
    this.spawnBurst(position, 0xff2bb5, 4, 85);
  }

  private capturePatternLock(pattern: AttackPattern): void {
    this.lastHazardHitOccurrence = -1;
    const radialAngle = Math.atan2(this.player.position.y, this.player.position.x);
    this.lock = { ...this.lock, lanceAngle: radialAngle };
    if (pattern.kind === 'dashCatch') {
      const movementDirection = length(this.player.velocity) > 10 ? normalize(this.player.velocity) : undefined;
      this.lock = {
        ...this.lock,
        dashTarget: predictDashCatchTarget(
          {
            position: this.player.position,
            velocity: this.player.velocity,
            ...(movementDirection ? { dashDirection: movementDirection } : {}),
          },
          pattern,
        ),
      };
    }
  }

  private checkHazardCollision(): void {
    const sample = this.sample;
    if (!sample || sample.phase !== 'active' || this.player.invulnerableMs > 0) return;
    if (sample.window.occurrence === this.lastHazardHitOccurrence) return;
    const circle = { center: this.player.position, radius: COMBAT_TUNING.playerRadius };
    const { pattern, phaseProgress } = sample;
    let collided = false;

    switch (pattern.kind) {
      case 'pulse': {
        const ring = pattern.rings[0];
        if (ring) {
          const radius = ring.startRadius + (ring.endRadius - ring.startRadius) * phaseProgress;
          collided = circleIntersectsRing(circle, { center: BOSS_POSITION, radius, halfWidth: ring.halfWidth });
        }
        break;
      }
      case 'lances': {
        const angles = this.lanceAngles(this.lock.lanceAngle, pattern.count, pattern.spreadRadians);
        collided = angles.some((angle) => {
          const direction = fromAngle(angle, pattern.reach);
          return circleIntersectsLine(circle, {
            from: scale(direction, -1),
            to: direction,
            halfWidth: pattern.halfWidth,
          });
        });
        break;
      }
      case 'compression': {
        const x = 520 - (520 - pattern.safeGap / 2) * phaseProgress;
        collided = [-x, x].some((wallX) => circleIntersectsLine(circle, {
          from: vec(wallX, -280),
          to: vec(wallX, 280),
          halfWidth: 18,
        }));
        break;
      }
      case 'dashCatch': {
        if (phaseProgress < 0.58) {
          const progress = phaseProgress / 0.58;
          collided = circleIntersectsRing(circle, {
            center: BOSS_POSITION,
            radius: 105 + progress * 220,
            halfWidth: 18,
          });
        } else {
          collided = this.dashCatchLines(this.lock.dashTarget).some((line) => circleIntersectsLine(circle, {
            ...line,
            halfWidth: 17,
          }));
        }
        break;
      }
    }

    if (collided) this.hitPlayer(sample.window.occurrence);
  }

  private hitPlayer(occurrence: number): void {
    this.lastHazardHitOccurrence = occurrence;
    this.player.integrity = Math.max(0, this.player.integrity - 1);
    this.player.invulnerableMs = 650;
    this.shakeMs = 180;
    this.shakeStrength = 13;
    this.feedbackText = 'INTEGRITY LOST';
    this.feedbackMs = 720;
    this.hud.flashHit();
    this.audio.playerHit();
    this.spawnBurst(this.player.position, 0xff334f, 14, 190);
    this.hud.announce(`${this.player.integrity} integrity remaining.`);
  }

  private updateEffects(dtMs: number): void {
    this.bossFlashMs = Math.max(0, this.bossFlashMs - dtMs);
    this.shakeMs = Math.max(0, this.shakeMs - dtMs);
    this.feedbackMs = Math.max(0, this.feedbackMs - dtMs);
    if (this.feedbackMs <= 0) this.feedbackText = '';

    this.trails = this.trails
      .map((trail) => ({
        ...trail,
        lifeMs: trail.lifeMs - dtMs,
        alpha: Math.max(0, (trail.lifeMs - dtMs) / trail.maxLifeMs),
      }))
      .filter((trail) => trail.lifeMs > 0);

    this.particles = this.particles
      .map((particle) => {
        const lifeMs = particle.lifeMs - dtMs;
        return {
          ...particle,
          lifeMs,
          position: add(particle.position, scale(particle.velocity, dtMs / 1000)),
          velocity: scale(particle.velocity, 0.94),
          alpha: Math.max(0, lifeMs / particle.maxLifeMs),
        };
      })
      .filter((particle) => particle.lifeMs > 0);
  }

  private spawnBurst(position: Vec2, color: number, count: number, speed: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + (index % 2) * 0.11;
      const magnitude = speed * (0.55 + ((index * 37) % 50) / 100);
      this.particles.push({
        position: { ...position },
        velocity: fromAngle(angle, magnitude),
        color,
        size: 2 + (index % 3),
        alpha: 1,
        lifeMs: 360 + (index % 4) * 55,
        maxLifeMs: 360 + (index % 4) * 55,
      });
    }
  }

  private spectatorMovement(): Vec2 {
    const angle = this.roundElapsedMs * 0.00052 + 0.8;
    const target = vec(Math.cos(angle) * 225, Math.sin(angle) * 205);
    return normalize(subtract(target, this.player.position));
  }

  private shouldSpectatorDash(): boolean {
    const sample = this.sample;
    if (!sample || sample.phase !== 'active' || this.player.dashCooldownMs > 0) return false;
    return sample.phaseProgress > 0.34 && sample.phaseProgress < 0.48;
  }

  private winRound(): void {
    this.mode = 'roundWin';
    this.modeTimerMs = 1_350;
    this.input.setEnabled(false);
    this.lastWinSeconds = this.roundElapsedMs / 1000;
    this.audio.victory();
    this.shakeMs = 320;
    this.shakeStrength = 18;
    this.spawnBurst(BOSS_POSITION, 0xf4f7ff, 28, 260);
    this.hud.announce(`HEIR version ${this.version} defeated.`);
  }

  private loseRound(): void {
    if (this.mode !== 'fight') return;
    this.mode = 'defeat';
    this.modeTimerMs = 3_200;
    this.defeats[this.version] += 1;
    this.input.setEnabled(false);
    this.hud.showOverlay({
      eyebrow: `HEIR // V.${String(this.version).padStart(2, '0')} // DEFENSE ${this.defeats[this.version]}`,
      title: 'FALLEN',
      copy: this.player.integrity <= 0
        ? 'The hit was telegraphed. Read the shape, preserve the dash, re-enter.'
        : 'Time expired. Commit to the white core openings or the arena closes.',
      button: 'RE-ENTER [R]',
      note: 'Automatic re-entry in three seconds.',
      showControls: false,
    });
    this.hud.announce('Challenger fallen. The same HEIR version remains in the arena.');
  }

  private beginEvolution(): void {
    this.mode = 'evolution';
    this.modeTimerMs = 4_100;
    this.version = 37;
    this.script = VERSION_SCRIPTS.V37;
    this.bossHealth = this.script.bossHealth;
    this.hud.showOverlay({
      eyebrow: 'VICTORY TRACE ACCEPTED // ONE RULE CHANGED',
      title: 'HEIR LEARNED',
      copy: `DASH CATCH locks one visible strike on the predicted dash endpoint. Your ${this.dashesThisRun} dash commits trained the counter; its warning still cannot retarget.`,
      note: 'Same health. Same damage. New pressure.',
      showControls: false,
    });
    this.hud.announce('HEIR evolved. New mutation: Dash Catch.');
  }

  private showPayoff(): void {
    this.mode = 'payoff';
    this.version = 37;
    this.input.setEnabled(false);
    this.hud.showOverlay({
      eyebrow: 'GLOBAL RECORD SEALED // HEIR V.37 DEFEATED',
      title: 'LAST CONQUEROR',
      copy: `CHALLENGER 027 broke DASH CATCH in ${this.lastWinSeconds.toFixed(2)} seconds. Humanity's final recorded victory holds until the next version survives the queue.`,
      button: this.spectator ? 'WATCH NEXT RUN' : 'RUN AGAIN',
      note: `${this.attempts[1] + this.attempts[37]} attempts // ${this.dashesThisRun} dash commits // simulated audience 18,204`,
      showControls: false,
    });
    this.hud.announce('Last Conqueror record sealed.');
  }

  private startRound(version: 1 | 37): void {
    this.debugFreeze = false;
    this.version = version;
    this.script = version === 1 ? VERSION_SCRIPTS.V01 : VERSION_SCRIPTS.V37;
    this.timeline = buildVersionTimeline(this.script);
    this.mode = 'countdown';
    this.modeTimerMs = ROUND_COUNTDOWN_MS;
    this.roundElapsedMs = 0;
    this.currentOccurrence = -1;
    this.lastHazardHitOccurrence = -1;
    this.player = this.createPlayer();
    this.bossHealth = this.script.bossHealth;
    this.bossFlashMs = 0;
    this.bossVulnerable = false;
    this.sample = null;
    this.shots = [];
    this.trails = [];
    this.particles = [];
    this.feedbackText = '';
    this.attempts[version] += 1;
    this.input.setEnabled(false);
    this.hud.hideOverlay();
  }

  private showTitle(): void {
    this.hud.showOverlay({
      eyebrow: this.spectator ? 'GLOBAL FEED // READ-ONLY' : 'GLOBAL ARENA // SIMULATION 001',
      title: 'UNBROKEN',
      copy: this.spectator
        ? 'Watch one challenger face the same evolved HEIR version as the global queue.'
        : 'One arena. One challenger. Every victory teaches HEIR.',
      button: this.spectator ? 'WATCH LIVE' : 'ENTER ARENA',
      note: this.spectator
        ? 'Touch gameplay is deliberately out of scope for this slice.'
        : 'Two versions. A focused first run takes about five minutes. Audio starts on entry.',
      showControls: !this.spectator,
    });
  }

  private render(nowMs: number): void {
    const pressure = this.isPressure();
    const secondsRemaining = Math.max(0, (ROUND_DURATION_MS - this.roundElapsedMs) / 1000);
    const countdown = this.mode === 'countdown'
      ? String(Math.max(1, Math.ceil(this.modeTimerMs / 1000)))
      : '';
    const challenger = this.spectator || this.version === 37 ? 'CHALLENGER 405' : 'CHALLENGER 027';
    const liveBase = this.version === 37 ? 18_204 : 2_431;
    const queueBase = this.version === 37 ? 972 : 184;
    const live = liveBase + Math.floor(this.roundElapsedMs / 1300) * (this.version === 37 ? 7 : 2);
    const callout = this.combatCallout();

    this.hud.update({
      version: this.version,
      mutation: this.version === 37 ? 'MUTATION: DASH CATCH' : '',
      bossHealth: this.bossHealth,
      bossHealthMax: this.script.bossHealth,
      seconds: secondsRemaining,
      live,
      queue: queueBase,
      challenger,
      integrity: this.player.integrity,
      dashCooldown: this.player.dashCooldownMs / 1000,
      pressure,
      spectator: this.spectator,
      status: `V.${String(this.version).padStart(2, '0')} // ${this.version === 37 ? 'DASH CATCH' : 'BASELINE SEED'} // ${this.defeats[this.version]} DEFEATS`,
      countdown,
      callout,
    });

    const renderFrame: RenderFrame = {
      nowMs: this.debugFreeze ? 12_345 : nowMs,
      version: this.version,
      bossVulnerable: this.bossVulnerable,
      bossHealthRatio: this.bossHealth / this.script.bossHealth,
      bossFlash: this.bossFlashMs,
      playerPosition: this.player.position,
      playerAngle: this.player.angle,
      playerInvulnerable: this.player.invulnerableMs > 0,
      playerDashing: this.player.dashRemainingMs > 0,
      playerIntegrity: this.player.integrity,
      sample: this.sample,
      lock: this.lock,
      shots: this.shots,
      trails: this.trails,
      particles: this.particles,
      pressure,
      spectator: this.spectator,
      shake: this.shakeMs > 0 ? this.shakeStrength * (this.shakeMs / 180) : 0,
    };
    this.renderer.render(renderFrame);
  }

  private combatCallout(): string {
    if (this.mode === 'countdown') return this.version === 37 ? 'ONE ACTIVE ATTACK // ONE QUEUED FOLLOW-UP' : 'DASHED FORECAST // SOLID RED HURTS';
    if (this.mode !== 'fight') return '';
    if (this.feedbackText) return this.feedbackText;
    const sample = this.sample;
    if (!sample) return '';
    if (sample.pattern.kind === 'dashCatch' && sample.phase === 'telegraph') return 'DASH CATCH LOCKED // CHANGE DIRECTION';
    if (sample.pattern.kind === 'dashCatch' && sample.phase === 'active') return sample.phaseProgress < 0.58
      ? 'ACTIVE SWEEP // ENDPOINT LANES QUEUED'
      : 'DASH CATCH FIRED // SAFE POCKET HOLDS';
    if (sample.phase === 'telegraph' && sample.window.occurrence === 0) return 'DASHED = FORECAST';
    if (sample.phase === 'active' && sample.window.occurrence === 0) return 'SOLID RED = LETHAL // SPACE TO DASH';
    if (sample.phase === 'opening') {
      return distance(this.player.position, BOSS_POSITION) <= COMBAT_TUNING.breakRange
        ? 'WHITE CORE // HOLD FIRE'
        : 'BREAK RANGE // COMMIT DASH OR HOLD SAFE';
    }
    return '';
  }

  private isPressure(): boolean {
    return this.mode === 'fight'
      && this.version === 37
      && (ROUND_DURATION_MS - this.roundElapsedMs <= 15_000 || this.bossHealth <= this.script.bossHealth * 0.5);
  }

  private createPlayer(): PlayerState {
    return {
      position: { ...COMBAT_TUNING.playerStart },
      velocity: vec(),
      dashDirection: vec(0, -1),
      angle: -Math.PI / 2,
      integrity: 3,
      invulnerableMs: 0,
      dashRemainingMs: 0,
      dashCooldownMs: 0,
      fireCooldownMs: 0,
      trailCooldownMs: 0,
    };
  }

  private lanceAngles(center: number, count: number, spread: number): number[] {
    if (count <= 1) return [center];
    return Array.from({ length: count }, (_, index) => center + (index - (count - 1) / 2) * spread);
  }

  private dashCatchLines(target: Vec2): Array<{ from: Vec2; to: Vec2 }> {
    const size = 440;
    return [
      {
        from: vec(target.x - size, target.y - size * 0.58),
        to: vec(target.x + size, target.y + size * 0.58),
      },
      {
        from: vec(target.x - size, target.y + size * 0.58),
        to: vec(target.x + size, target.y - size * 0.58),
      },
    ];
  }

  private installDebugApi(): void {
    window.__UNBROKEN__ = {
      snapshot: () => this.snapshot(),
      start: () => this.enter(),
      damageBoss: (amount = 1) => {
        this.bossHealth = Math.max(0, this.bossHealth - Math.max(0, amount));
        if (this.bossHealth <= 0 && this.mode === 'fight') this.winRound();
      },
      setPlayerIntegrity: (integrity) => {
        this.player.integrity = Math.max(0, Math.min(3, Math.round(integrity)));
      },
      show: (state) => this.showDebug(state),
    };
  }

  private snapshot(): GameSnapshot {
    return {
      mode: this.mode,
      version: this.version,
      secondsRemaining: Math.max(0, (ROUND_DURATION_MS - this.roundElapsedMs) / 1000),
      playerIntegrity: this.player.integrity,
      bossHealth: this.bossHealth,
      bossHealthMax: this.script.bossHealth,
      pattern: this.sample?.pattern.kind ?? null,
      phase: this.sample?.phase ?? null,
      pressure: this.isPressure(),
      spectator: this.spectator,
      overlayVisible: this.hud.isOverlayVisible(),
    };
  }

  private showDebug(state: 'entry' | 'pressure' | 'payoff'): void {
    if (state === 'entry') {
      this.startRound(1);
      this.mode = 'fight';
      const first = this.timeline[0];
      if (first) {
        this.roundElapsedMs = first.startMs + (first.telegraphEndMs - first.startMs) * 0.32;
        this.sample = sampleTimeline(this.timeline, this.roundElapsedMs);
        this.currentOccurrence = first.occurrence;
        if (this.sample) this.capturePatternLock(this.sample.pattern);
      }
      this.debugFreeze = true;
      this.input.setEnabled(false);
      return;
    }
    if (state === 'payoff') {
      this.script = VERSION_SCRIPTS.V37;
      this.version = 37;
      this.bossHealth = 0;
      this.player = this.createPlayer();
      this.lastWinSeconds = 32.48;
      this.attempts = { 1: 1, 37: 2 };
      this.dashesThisRun = 11;
      this.showPayoff();
      this.debugFreeze = true;
      return;
    }

    this.startRound(37);
    this.mode = 'fight';
    this.input.setEnabled(!this.spectator);
    this.player.position = vec(260, 180);
    this.player.velocity = vec(120, -30);
    this.player.integrity = 1;
    this.bossHealth = Math.ceil(this.script.bossHealth * 0.42);
    const dashWindow = this.timeline
      .filter((window) => window.patternId === 'v37-dash-catch')
      .reduce<PatternWindow | undefined>((closest, window) => {
        const activePoint = window.telegraphEndMs + 0.36 * (window.activeEndMs - window.telegraphEndMs);
        const distanceFromTarget = Math.abs((ROUND_DURATION_MS - activePoint) - 11_000);
        if (!closest) return window;
        const closestPoint = closest.telegraphEndMs + 0.36 * (closest.activeEndMs - closest.telegraphEndMs);
        return distanceFromTarget < Math.abs((ROUND_DURATION_MS - closestPoint) - 11_000) ? window : closest;
      }, undefined);
    if (dashWindow) {
      const pattern = VERSION_SCRIPTS.V37.sequence.includes(dashWindow.patternId)
        ? sampleTimeline(this.timeline, dashWindow.startMs)?.pattern
        : undefined;
      if (pattern?.kind === 'dashCatch') {
        this.lock = {
          lanceAngle: Math.atan2(this.player.position.y, this.player.position.x),
          dashTarget: add(this.player.position, vec(150, -65)),
        };
        this.roundElapsedMs = dashWindow.telegraphEndMs + pattern.activeMs * 0.36;
        this.sample = sampleTimeline(this.timeline, this.roundElapsedMs);
        this.currentOccurrence = dashWindow.occurrence;
      }
    }
    this.debugFreeze = true;
    this.input.setEnabled(false);
    this.hud.hideOverlay();
  }
}
