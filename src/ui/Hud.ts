export interface OverlayContent {
  eyebrow: string;
  title: string;
  copy: string;
  button?: string;
  note?: string;
  showControls?: boolean;
}

export interface HudFrame {
  version: 1 | 37;
  mutation: string;
  bossHealth: number;
  bossHealthMax: number;
  seconds: number;
  live: number;
  queue: number;
  challenger: string;
  integrity: number;
  dashCooldown: number;
  pressure: boolean;
  spectator: boolean;
  status: string;
  countdown: string;
  callout: string;
}

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`HUD element is missing: ${selector}`);
  return element;
}

export class Hud {
  private readonly bossLabel = required<HTMLElement>('#boss-label');
  private readonly mutationLabel = required<HTMLElement>('#mutation-label');
  private readonly bossHealth = required<HTMLElement>('.boss-health');
  private readonly bossHealthFill = required<HTMLElement>('#boss-health-fill');
  private readonly timer = required<HTMLElement>('#timer');
  private readonly liveCount = required<HTMLElement>('#live-count');
  private readonly queueCount = required<HTMLElement>('#queue-count');
  private readonly challenger = required<HTMLElement>('#challenger-label');
  private readonly integrity = required<HTMLElement>('#integrity');
  private readonly dashStatus = required<HTMLElement>('#dash-status');
  private readonly pressure = required<HTMLElement>('#pressure-readout');
  private readonly spectator = required<HTMLElement>('#spectator-badge');
  private readonly countdown = required<HTMLElement>('#countdown-readout');
  private readonly callout = required<HTMLElement>('#combat-callout');
  private readonly status = required<HTMLElement>('#status-line');
  private readonly overlay = required<HTMLElement>('#state-overlay');
  private readonly overlayEyebrow = required<HTMLElement>('#overlay-eyebrow');
  private readonly overlayTitle = required<HTMLElement>('#overlay-title');
  private readonly overlayCopy = required<HTMLElement>('#overlay-copy');
  private readonly overlayButton = required<HTMLButtonElement>('#enter-button');
  private readonly overlayNote = required<HTMLElement>('#overlay-note');
  private readonly controls = required<HTMLElement>('#control-legend');
  private readonly hitFlash = required<HTMLElement>('#hit-flash');
  private readonly liveRegion = required<HTMLElement>('#live-region');
  private readonly muteButton = required<HTMLButtonElement>('#mute-button');
  private readonly mobileBoss = required<HTMLElement>('#mobile-boss');
  private readonly mobileTimer = required<HTMLElement>('#mobile-timer');
  private readonly mobileChallenger = required<HTMLElement>('#mobile-challenger');
  private readonly mobileIntegrity = required<HTMLElement>('#mobile-integrity');
  private readonly mobileQueue = required<HTMLElement>('#mobile-queue');
  private readonly mobileLive = required<HTMLElement>('#mobile-live');
  private readonly mobileMutation = required<HTMLElement>('#mobile-mutation');

  update(frame: HudFrame): void {
    const version = String(frame.version).padStart(2, '0');
    const healthRatio = Math.max(0, Math.min(1, frame.bossHealth / frame.bossHealthMax));
    const seconds = Math.max(0, Math.ceil(frame.seconds));
    this.setText(this.bossLabel, `HEIR // V.${version}`);
    this.setText(this.mutationLabel, frame.mutation);
    this.bossHealthFill.style.transform = `scaleX(${healthRatio}) skewX(16deg)`;
    this.bossHealth.setAttribute('aria-valuenow', String(Math.round(healthRatio * 100)));
    this.setText(this.timer, `00:${String(seconds).padStart(2, '0')}`);
    this.setText(this.liveCount, `LIVE ${frame.live.toLocaleString('en-US')}`);
    this.setText(this.queueCount, `QUEUE ${frame.queue.toLocaleString('en-US')}`);
    this.setText(this.challenger, frame.challenger);
    this.integrity.setAttribute('aria-label', `${frame.integrity} integrity remaining`);
    [...this.integrity.children].forEach((pip, index) => pip.classList.toggle('is-empty', index >= frame.integrity));
    this.setText(this.dashStatus, frame.dashCooldown <= 0 ? 'DASH READY' : `DASH ${frame.dashCooldown.toFixed(1)}S`);
    this.pressure.classList.toggle('is-visible', frame.pressure);
    this.spectator.classList.toggle('is-visible', frame.spectator);
    this.setText(this.countdown, frame.countdown);
    this.countdown.classList.toggle('is-visible', frame.countdown.length > 0);
    this.setText(this.callout, frame.callout);
    this.callout.classList.toggle('is-visible', frame.callout.length > 0);
    this.setText(this.status, frame.status);
    this.setText(this.mobileBoss, `HEIR // V.${version}`);
    this.setText(this.mobileTimer, `00:${String(seconds).padStart(2, '0')}`);
    this.setText(this.mobileChallenger, frame.challenger);
    this.setText(this.mobileIntegrity, `${frame.integrity} / 3`);
    this.setText(this.mobileQueue, frame.queue.toLocaleString('en-US'));
    this.setText(this.mobileLive, frame.live.toLocaleString('en-US'));
    this.setText(
      this.mobileMutation,
      frame.version === 37
        ? 'DASH CATCH // Locks one visible strike on the predicted dash endpoint.'
        : 'BASELINE SEED // Forecast, danger, then a white-core opening.',
    );
  }

  showOverlay(content: OverlayContent): void {
    this.overlayEyebrow.textContent = content.eyebrow;
    this.overlayTitle.textContent = content.title;
    this.overlayCopy.textContent = content.copy;
    this.overlayNote.textContent = content.note ?? '';
    this.controls.hidden = content.showControls === false;
    this.overlayButton.hidden = content.button === undefined;
    if (content.button) this.overlayButton.textContent = content.button;
    this.overlay.classList.add('state-overlay--visible');
  }

  hideOverlay(): void {
    this.overlay.classList.remove('state-overlay--visible');
  }

  isOverlayVisible(): boolean {
    return this.overlay.classList.contains('state-overlay--visible');
  }

  flashHit(): void {
    this.hitFlash.classList.remove('is-active');
    void this.hitFlash.offsetWidth;
    this.hitFlash.classList.add('is-active');
  }

  announce(message: string): void {
    this.liveRegion.textContent = message;
  }

  setMuted(muted: boolean): void {
    this.muteButton.textContent = muted ? 'UNMUTE [M]' : 'MUTE [M]';
    this.muteButton.setAttribute('aria-pressed', String(muted));
  }

  private setText(element: HTMLElement, value: string): void {
    if (element.textContent !== value) element.textContent = value;
  }
}
