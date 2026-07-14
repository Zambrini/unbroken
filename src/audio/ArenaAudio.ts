type ToneShape = OscillatorType;

export class ArenaAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private nextBeatAt = 0;
  private beat = 0;

  async start(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.48;
      this.master.connect(this.context.destination);
      this.noise = this.createNoiseBuffer(this.context);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.nextBeatAt = this.context.currentTime;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.48, this.context.currentTime, 0.025);
  }

  isMuted(): boolean {
    return this.muted;
  }

  updateMusic(active: boolean, pressure: boolean): void {
    if (!active || !this.context || !this.master || this.muted) return;
    const interval = pressure ? 0.22 : 0.32;
    while (this.nextBeatAt <= this.context.currentTime + 0.08) {
      const bass = pressure ? [55, 65.41, 73.42, 82.41] : [55, 55, 65.41, 49];
      const frequency = bass[this.beat % bass.length] ?? 55;
      this.tone(frequency, 0.09, 0.055, 'sawtooth', this.nextBeatAt);
      if (this.beat % 4 === 2) this.noiseHit(0.035, 0.06, 1600, this.nextBeatAt);
      this.beat += 1;
      this.nextBeatAt += interval;
    }
  }

  telegraph(): void {
    this.tone(220, 0.075, 0.075, 'square');
    this.tone(330, 0.05, 0.06, 'sine', undefined, 0.045);
  }

  dash(): void {
    this.noiseHit(0.14, 0.12, 2400);
    this.tone(520, 0.08, 0.045, 'sawtooth');
  }

  shot(): void {
    this.tone(780, 0.035, 0.025, 'square');
  }

  shield(): void {
    this.tone(190, 0.055, 0.035, 'triangle');
  }

  coreHit(): void {
    this.noiseHit(0.09, 0.14, 900);
    this.tone(88, 0.16, 0.12, 'sine');
    this.tone(660, 0.055, 0.055, 'square', undefined, 0.015);
  }

  playerHit(): void {
    this.noiseHit(0.2, 0.22, 420);
    this.tone(58, 0.26, 0.18, 'sawtooth');
  }

  victory(): void {
    const now = this.context?.currentTime;
    if (now === undefined) return;
    [220, 329.63, 440, 659.25].forEach((frequency, index) => {
      this.tone(frequency, 0.3, 0.09, index === 3 ? 'sine' : 'triangle', now + index * 0.085);
    });
    this.noiseHit(0.35, 0.18, 1200, now + 0.18);
  }

  private tone(
    frequency: number,
    duration: number,
    gainValue: number,
    shape: ToneShape,
    at?: number,
    delay = 0,
  ): void {
    if (!this.context || !this.master || this.muted) return;
    const start = (at ?? this.context.currentTime) + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(32, frequency * 0.72), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + Math.min(0.012, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noiseHit(duration: number, gainValue: number, frequency: number, at?: number): void {
    if (!this.context || !this.master || !this.noise || this.muted) return;
    const start = at ?? this.context.currentTime;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noise;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, frequency * 0.2), start + duration);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  private createNoiseBuffer(context: AudioContext): AudioBuffer {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
    return buffer;
  }
}
