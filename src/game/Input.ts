import type { Vec2 } from '../sim';

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

export class Input {
  private readonly keys = new Set<string>();
  private dashQueued = false;
  private retryQueued = false;
  private muteQueued = false;
  private shooting = false;
  private enabled = true;
  readonly pointer: Vec2 = { x: 800, y: 390 };

  constructor(
    private readonly target: HTMLElement,
    private readonly worldWidth: number,
    private readonly worldHeight: number,
  ) {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    target.addEventListener('contextmenu', this.preventDefault);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.shooting = false;
      this.dashQueued = false;
    }
  }

  movement(): Vec2 {
    if (!this.enabled) return { x: 0, y: 0 };
    const x = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const y = Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp'));
    if (x === 0 && y === 0) return { x: 0, y: 0 };
    const length = Math.hypot(x, y);
    return { x: x / length, y: y / length };
  }

  isShooting(): boolean {
    return this.enabled && this.shooting;
  }

  consumeDash(): boolean {
    const queued = this.enabled && this.dashQueued;
    this.dashQueued = false;
    return queued;
  }

  consumeRetry(): boolean {
    const queued = this.retryQueued;
    this.retryQueued = false;
    return queued;
  }

  consumeMute(): boolean {
    const queued = this.muteQueued;
    this.muteQueued = false;
    return queued;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.target.removeEventListener('pointermove', this.onPointerMove);
    this.target.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.target.removeEventListener('contextmenu', this.preventDefault);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (MOVE_KEYS.has(event.code) || event.code === 'Space') event.preventDefault();
    if (MOVE_KEYS.has(event.code)) this.keys.add(event.code);
    if (event.code === 'Space' && !event.repeat) this.dashQueued = true;
    if (event.code === 'KeyR' && !event.repeat) this.retryQueued = true;
    if (event.code === 'KeyM' && !event.repeat) this.muteQueued = true;
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.keys.clear();
    this.shooting = false;
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const rect = this.target.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * this.worldWidth;
    this.pointer.y = ((event.clientY - rect.top) / rect.height) * this.worldHeight;
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    event.preventDefault();
    this.shooting = true;
    this.target.focus({ preventScroll: true });
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.button === 0) this.shooting = false;
  };

  private readonly preventDefault = (event: Event): void => event.preventDefault();
}
