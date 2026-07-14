import { afterEach, describe, expect, it, vi } from 'vitest';
import { ArenaAudio } from '../../src/audio/ArenaAudio';

function installAudioContext(resume: () => Promise<void>): {
  created: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
} {
  const created = vi.fn();
  const resumeSpy = vi.fn(resume);

  class FakeAudioContext {
    readonly state = 'suspended';
    readonly currentTime = 0;
    readonly sampleRate = 4;
    readonly destination = {} as AudioDestinationNode;

    constructor() {
      created();
    }

    createGain(): GainNode {
      return {
        gain: { value: 0 },
        connect: vi.fn(),
      } as unknown as GainNode;
    }

    createBuffer(_channels: number, length: number, _sampleRate: number): AudioBuffer {
      return {
        getChannelData: () => new Float32Array(length),
      } as unknown as AudioBuffer;
    }

    resume(): Promise<void> {
      return resumeSpy();
    }
  }

  vi.stubGlobal('AudioContext', FakeAudioContext);
  return { created, resume: resumeSpy };
}

describe('ArenaAudio.start', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays silent when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);

    expect(new ArenaAudio().start()).toBeUndefined();
  });

  it('contains synchronous audio setup failures', () => {
    class ThrowingAudioContext {
      constructor() {
        throw new Error('audio device unavailable');
      }
    }
    vi.stubGlobal('AudioContext', ThrowingAudioContext);

    expect(() => new ArenaAudio().start()).not.toThrow();
  });

  it('contains a rejected resume without blocking entry', async () => {
    const audioContext = installAudioContext(() => Promise.reject(new Error('resume denied')));
    const audio = new ArenaAudio();

    expect(audio.start()).toBeUndefined();
    expect(audioContext.created).toHaveBeenCalledOnce();
    expect(audioContext.resume).toHaveBeenCalledOnce();
    await Promise.resolve();
  });

  it('returns while a suspended context never finishes resuming', () => {
    const audioContext = installAudioContext(() => new Promise<void>(() => undefined));

    expect(new ArenaAudio().start()).toBeUndefined();
    expect(audioContext.resume).toHaveBeenCalledOnce();
  });

  it('attempts the normal gesture unlock synchronously', async () => {
    const audioContext = installAudioContext(() => Promise.resolve());
    const audio = new ArenaAudio();

    audio.start();
    expect(audioContext.created).toHaveBeenCalledOnce();
    expect(audioContext.resume).toHaveBeenCalledOnce();
    await Promise.resolve();
  });
});
