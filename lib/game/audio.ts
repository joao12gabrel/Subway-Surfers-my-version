import type { BiomeKey, PowerUpType } from './types';

export type MusicMode = 'off' | 'menu' | 'run' | 'paused';

export const BIOME_SCALES: Record<BiomeKey, { bass: number[]; lead: number[] }> = {
  // Upbeat arcade funk (C major / mixolydian feel)
  classic: {
    bass: [130.81, 130.81, 155.56, 174.61, 196.0, 174.61, 155.56, 146.83],
    lead: [523.25, 659.25, 783.99, 880.0, 1046.5, 880.0, 783.99, 659.25],
  },
  // Neon synthwave (A minor / dorian)
  tokyo: {
    bass: [110.0, 110.0, 130.81, 146.83, 164.81, 146.83, 130.81, 98.0],
    lead: [440.0, 523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33],
  },
  // Desert electro-rock (D dorian / pentatonic)
  canyon: {
    bass: [146.83, 146.83, 174.61, 196.0, 220.0, 196.0, 174.61, 130.81],
    lead: [587.33, 698.46, 880.0, 1046.5, 1174.66, 1046.5, 880.0, 698.46],
  },
  // Alpine frost chimes (E minor / crystalline)
  arctic: {
    bass: [164.81, 164.81, 196.0, 220.0, 246.94, 220.0, 196.0, 146.83],
    lead: [659.25, 783.99, 987.77, 1174.66, 1318.51, 1174.66, 987.77, 783.99],
  },
  // Orbital spaceport synth (F# minor)
  cyberport: {
    bass: [92.5, 92.5, 110.0, 123.47, 138.59, 123.47, 110.0, 82.41],
    lead: [369.99, 440.0, 554.37, 659.25, 739.99, 659.25, 554.37, 493.88],
  },
};

export const BIOME_CALM_CHORDS: Record<BiomeKey, number[][]> = {
  classic: [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [349.23, 440.0, 523.25, 659.25],  // Fmaj7
    [392.0, 493.88, 587.33, 698.46],  // G7
    [220.0, 261.63, 329.63, 392.0],   // Am7
  ],
  tokyo: [
    [220.0, 261.63, 329.63, 493.88], // Am9
    [349.23, 440.0, 523.25, 659.25], // Fmaj7
    [293.66, 349.23, 440.0, 523.25], // Dm7
    [164.81, 246.94, 329.63, 392.0], // Em7
  ],
  canyon: [
    [293.66, 349.23, 440.0, 523.25], // Dm7
    [392.0, 493.88, 587.33, 698.46],  // G7
    [233.08, 293.66, 349.23, 440.0], // Bbmaj7
    [261.63, 329.63, 392.0, 466.16], // C7
  ],
  arctic: [
    [329.63, 392.0, 493.88, 587.33], // Em7
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [392.0, 493.88, 587.33, 739.99], // Gmaj7
    [293.66, 369.99, 440.0, 523.25], // D7
  ],
  cyberport: [
    [369.99, 440.0, 554.37, 659.25], // F#m7
    [293.66, 369.99, 440.0, 554.37], // Dmaj7
    [246.94, 293.66, 369.99, 440.0], // Bm7
    [277.18, 329.63, 415.3, 493.88], // C#m7
  ],
};

const MENU_BASS = [130.81, 130.81, 164.81, 196.0, 146.83, 146.83, 174.61, 196.0];
const MENU_CHORDS = [
  [261.63, 329.63, 392.0],
  [293.66, 349.23, 440.0],
  [246.94, 293.66, 392.0],
  [261.63, 329.63, 493.88],
];

export function computeMusicBpm(speed: number): number {
  const clamped = Math.max(20, Math.min(48, speed));
  return Math.round(130 + ((clamped - 20) / 28) * 20);
}

export function computeMusicIntensity(speed: number): number {
  return Math.min(1, Math.max(0, (speed - 22) / 13));
}

export const computeSpeedIntensity = computeMusicIntensity;

export function computeAmbientIntensity(level: number, speed: number): number {
  const levelFactor = Math.min(1, Math.max(0, (level - 1) * 0.18));
  const speedFactor = Math.min(1, Math.max(0, (speed - 22) / 24));
  return Math.min(1, 0.22 + levelFactor * 0.45 + speedFactor * 0.38);
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private calmMusicGain: GainNode | null = null;
  private actionMusicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Biome-specific ambient soundscape nodes
  private trafficFilter: BiquadFilterNode | null = null;
  private trafficGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private neonFilter: BiquadFilterNode | null = null;
  private neonGain: GainNode | null = null;
  private natureFilter: BiquadFilterNode | null = null;
  private natureGain: GainNode | null = null;
  private spaceFilter: BiquadFilterNode | null = null;
  private spaceGain: GainNode | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;
  private ambientStarted = false;

  public muted = false;
  private coinChain = 0;
  private lastCoinAt = 0;
  private lastHoverAt = 0;
  private lastWhooshAt = 0;

  // Sequencer & difficulty state
  private musicMode: MusicMode = 'off';
  private activeBiome: BiomeKey = 'classic';
  private currentSpeed = 22;
  private currentLevel = 1;
  private stepIndex = 0;
  private nextNoteTime = 0;
  private schedulerTimer: number | null = null;
  private autoUnlockBound = false;

  public init(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -16;
        compressor.knee.value = 18;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.15;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.92;

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.24;

        // Cross-fading sub-mix gains for dynamic speed transitions
        this.calmMusicGain = this.ctx.createGain();
        this.calmMusicGain.gain.value = 1.0;
        this.calmMusicGain.connect(this.musicGain);

        this.actionMusicGain = this.ctx.createGain();
        this.actionMusicGain.gain.value = 0.0;
        this.actionMusicGain.connect(this.musicGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.72;

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.value = 0.0;

        this.musicGain.connect(compressor);
        this.sfxGain.connect(compressor);
        this.ambientGain.connect(compressor);
        compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.noiseBuffer = this.createNoiseBuffer(this.ctx);
        this.setupAmbientSoundscapeLayers();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().then(() => {
        if (this.musicMode !== 'off' && this.ctx && this.nextNoteTime < this.ctx.currentTime) {
          this.nextNoteTime = this.ctx.currentTime + 0.05;
        }
      });
    }
  }

  private setupAmbientSoundscapeLayers(): void {
    if (!this.ctx || !this.ambientGain || !this.noiseBuffer || this.ambientStarted) return;
    try {
      // 1. Urban / City Traffic & subway track bed rumble (lowpass filtered noise)
      const trafficSrc = this.ctx.createBufferSource();
      trafficSrc.buffer = this.noiseBuffer;
      trafficSrc.loop = true;
      this.trafficFilter = this.ctx.createBiquadFilter();
      this.trafficFilter.type = 'lowpass';
      this.trafficFilter.frequency.value = 190;
      this.trafficGain = this.ctx.createGain();
      this.trafficGain.gain.value = 0.22;
      trafficSrc.connect(this.trafficFilter);
      this.trafficFilter.connect(this.trafficGain);
      this.trafficGain.connect(this.ambientGain);
      trafficSrc.start();

      // 2. High-speed rushing wind (bandpass swept noise)
      const windSrc = this.ctx.createBufferSource();
      windSrc.buffer = this.noiseBuffer;
      windSrc.loop = true;
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.value = 460;
      this.windFilter.Q.value = 1.35;
      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.08;
      windSrc.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ambientGain);
      windSrc.start();

      // 3. Cyberpunk Neon Hum & high-tech electrical buzz (Tokyo & Cyberport)
      const neonSrc = this.ctx.createBufferSource();
      neonSrc.buffer = this.noiseBuffer;
      neonSrc.loop = true;
      this.neonFilter = this.ctx.createBiquadFilter();
      this.neonFilter.type = 'bandpass';
      this.neonFilter.frequency.value = 2400;
      this.neonFilter.Q.value = 3.5;
      this.neonGain = this.ctx.createGain();
      this.neonGain.gain.value = 0.0;
      neonSrc.connect(this.neonFilter);
      this.neonFilter.connect(this.neonGain);
      this.neonGain.connect(this.ambientGain);
      neonSrc.start();

      // 4. Canyon / Desert Howling Wind & rocky resonance (Canyon & Arctic)
      const natureSrc = this.ctx.createBufferSource();
      natureSrc.buffer = this.noiseBuffer;
      natureSrc.loop = true;
      this.natureFilter = this.ctx.createBiquadFilter();
      this.natureFilter.type = 'bandpass';
      this.natureFilter.frequency.value = 520;
      this.natureFilter.Q.value = 2.8;
      this.natureGain = this.ctx.createGain();
      this.natureGain.gain.value = 0.0;
      natureSrc.connect(this.natureFilter);
      this.natureFilter.connect(this.natureGain);
      this.natureGain.connect(this.ambientGain);
      natureSrc.start();

      // 5. Spaceport deep thruster sub-drone (Cyberport)
      const spaceSrc = this.ctx.createBufferSource();
      spaceSrc.buffer = this.noiseBuffer;
      spaceSrc.loop = true;
      this.spaceFilter = this.ctx.createBiquadFilter();
      this.spaceFilter.type = 'lowpass';
      this.spaceFilter.frequency.value = 75;
      this.spaceGain = this.ctx.createGain();
      this.spaceGain.gain.value = 0.0;
      spaceSrc.connect(this.spaceFilter);
      this.spaceFilter.connect(this.spaceGain);
      this.spaceGain.connect(this.ambientGain);
      spaceSrc.start();

      // 6. Sub-bass electrical oscillator (60Hz neon line hum)
      this.humOsc = this.ctx.createOscillator();
      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.value = 60;
      const humFilter = this.ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.value = 160;
      this.humGain = this.ctx.createGain();
      this.humGain.gain.value = 0.0;
      this.humOsc.connect(humFilter);
      humFilter.connect(this.humGain);
      this.humGain.connect(this.ambientGain);
      this.humOsc.start();

      this.ambientStarted = true;
      this.updateAmbientLayerParams();
    } catch {
      // Ignore WebAudio node initialization failures
    }
  }

  private updateAmbientLayerParams(): void {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const fadeT = 0.28;

    if (this.musicMode === 'off' || this.musicMode === 'paused') {
      this.ambientGain.gain.setTargetAtTime(0.0, now, 0.14);
      return;
    }

    if (this.musicMode === 'menu') {
      // Soft distant city breeze & low traffic hum on the main dashboard
      this.ambientGain.gain.setTargetAtTime(0.12, now, fadeT);
      this.trafficGain?.gain.setTargetAtTime(0.25, now, fadeT);
      this.trafficFilter?.frequency.setTargetAtTime(175, now, fadeT);
      this.windGain?.gain.setTargetAtTime(0.05, now, fadeT);
      this.neonGain?.gain.setTargetAtTime(0.0, now, fadeT);
      this.natureGain?.gain.setTargetAtTime(0.0, now, fadeT);
      this.spaceGain?.gain.setTargetAtTime(0.0, now, fadeT);
      this.humGain?.gain.setTargetAtTime(0.0, now, fadeT);
      return;
    }

    // Active gameplay: Dynamic soundscape based on current biome and speed/level
    const intensity = computeAmbientIntensity(this.currentLevel, this.currentSpeed);
    this.ambientGain.gain.setTargetAtTime(0.14 + intensity * 0.22, now, fadeT);

    switch (this.activeBiome) {
      case 'classic': {
        // City traffic, tire asphalt hiss, subway tracks, distant urban bustle
        this.trafficGain?.gain.setTargetAtTime(0.32 + intensity * 0.22, now, fadeT);
        this.trafficFilter?.frequency.setTargetAtTime(180 + intensity * 140, now, fadeT);
        this.windGain?.gain.setTargetAtTime(0.07 + intensity * 0.16, now, fadeT);
        this.windFilter?.frequency.setTargetAtTime(380 + intensity * 600, now, fadeT);
        this.neonGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.natureGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.spaceGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.humGain?.gain.setTargetAtTime(0.0, now, fadeT);
        break;
      }
      case 'tokyo': {
        // High-tech neon electrical buzz, cybernetic crosswalk hum, fast traffic whooshes
        this.trafficGain?.gain.setTargetAtTime(0.14 + intensity * 0.10, now, fadeT);
        this.trafficFilter?.frequency.setTargetAtTime(280 + intensity * 150, now, fadeT);
        this.windGain?.gain.setTargetAtTime(0.06 + intensity * 0.14, now, fadeT);
        this.windFilter?.frequency.setTargetAtTime(540 + intensity * 800, now, fadeT);
        this.neonGain?.gain.setTargetAtTime(0.32 + intensity * 0.22, now, fadeT);
        this.neonFilter?.frequency.setTargetAtTime(2200 + intensity * 400, now, fadeT);
        this.natureGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.spaceGain?.gain.setTargetAtTime(0.05, now, fadeT);
        this.humGain?.gain.setTargetAtTime(0.06 + intensity * 0.05, now, fadeT);
        break;
      }
      case 'canyon': {
        // Desert winds howling through red-rock gorges, dry arid gusts, nature echoes
        this.trafficGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.windGain?.gain.setTargetAtTime(0.18 + intensity * 0.24, now, fadeT);
        this.windFilter?.frequency.setTargetAtTime(320 + intensity * 500, now, fadeT);
        this.neonGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.natureGain?.gain.setTargetAtTime(0.38 + intensity * 0.28, now, fadeT);
        this.natureFilter?.frequency.setTargetAtTime(460 + intensity * 380, now, fadeT);
        this.spaceGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.humGain?.gain.setTargetAtTime(0.0, now, fadeT);
        break;
      }
      case 'arctic': {
        // Glacial tundra, whistling blizzard gales, sub-zero crystalline wind gusts
        this.trafficGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.windGain?.gain.setTargetAtTime(0.40 + intensity * 0.32, now, fadeT);
        this.windFilter?.frequency.setTargetAtTime(1400 + intensity * 1200, now, fadeT);
        this.neonGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.natureGain?.gain.setTargetAtTime(0.16 + intensity * 0.18, now, fadeT);
        this.natureFilter?.frequency.setTargetAtTime(800 + intensity * 400, now, fadeT);
        this.spaceGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.humGain?.gain.setTargetAtTime(0.0, now, fadeT);
        break;
      }
      case 'cyberport': {
        // Orbital terminal, deep rocket thruster sub-drone, magnetic levitation field
        this.trafficGain?.gain.setTargetAtTime(0.04, now, fadeT);
        this.windGain?.gain.setTargetAtTime(0.10 + intensity * 0.15, now, fadeT);
        this.windFilter?.frequency.setTargetAtTime(400 + intensity * 600, now, fadeT);
        this.neonGain?.gain.setTargetAtTime(0.18 + intensity * 0.15, now, fadeT);
        this.natureGain?.gain.setTargetAtTime(0.0, now, fadeT);
        this.spaceGain?.gain.setTargetAtTime(0.42 + intensity * 0.30, now, fadeT);
        this.spaceFilter?.frequency.setTargetAtTime(85 + intensity * 65, now, fadeT);
        this.humGain?.gain.setTargetAtTime(0.10 + intensity * 0.08, now, fadeT);
        break;
      }
    }
  }

  // Cross-fading background music: smoothly shifts between calm track and action track
  private updateMusicCrossfade(): void {
    if (!this.ctx || !this.calmMusicGain || !this.actionMusicGain) return;
    const now = this.ctx.currentTime;
    if (this.musicMode === 'menu') {
      this.calmMusicGain.gain.setTargetAtTime(1.0, now, 0.2);
      this.actionMusicGain.gain.setTargetAtTime(0.0, now, 0.2);
      return;
    }
    if (this.musicMode === 'run') {
      const speedIntensity = computeMusicIntensity(this.currentSpeed);
      // Equal-power cross-fade curve between Calm and Action layers
      const calmVal = Math.cos(speedIntensity * (Math.PI / 2));
      const actionVal = Math.sin(speedIntensity * (Math.PI / 2));
      this.calmMusicGain.gain.setTargetAtTime(calmVal, now, 0.22);
      this.actionMusicGain.gain.setTargetAtTime(actionVal, now, 0.22);
    }
  }

  public bindAutoUnlock(onFirstUnlock?: () => void): () => void {
    if (typeof window === 'undefined' || this.autoUnlockBound) {
      return () => {};
    }
    this.autoUnlockBound = true;
    const unlock = () => {
      this.init();
      onFirstUnlock?.();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      this.autoUnlockBound = false;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.92, this.ctx.currentTime, 0.02);
    }
  }

  public setBiome(biome: BiomeKey): void {
    this.activeBiome = biome;
    this.updateAmbientLayerParams();
  }

  public setDifficulty(level: number, speed: number): void {
    this.currentLevel = level;
    this.currentSpeed = speed;
    this.updateAmbientLayerParams();
    this.updateMusicCrossfade();
  }

  public setSpeed(speed: number): void {
    this.currentSpeed = speed;
    this.updateAmbientLayerParams();
    this.updateMusicCrossfade();
  }

  public setMusicMode(mode: MusicMode): void {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    this.updateAmbientLayerParams();
    this.updateMusicCrossfade();

    if (mode === 'off' || mode === 'paused') {
      if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(mode === 'paused' ? 0.045 : 0.0, this.ctx.currentTime, 0.08);
      }
      if (mode === 'off' && this.schedulerTimer !== null) {
        window.clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
      return;
    }

    if (this.musicGain && this.ctx) {
      const targetLevel = mode === 'menu' ? 0.16 : 0.25;
      this.musicGain.gain.setTargetAtTime(targetLevel, this.ctx.currentTime, 0.08);
    }

    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.06;
    }
    if (this.schedulerTimer === null && typeof window !== 'undefined') {
      this.schedulerTimer = window.setInterval(() => this.scheduleMusicSteps(), 35);
    }
  }

  private scheduleMusicSteps(): void {
    if (
      this.muted ||
      !this.ctx ||
      !this.musicGain ||
      this.ctx.state !== 'running' ||
      (this.musicMode !== 'menu' && this.musicMode !== 'run')
    ) {
      return;
    }

    const lookAhead = 0.14;
    if (this.nextNoteTime < this.ctx.currentTime - 0.25) {
      this.nextNoteTime = this.ctx.currentTime + 0.03;
    }

    while (this.nextNoteTime < this.ctx.currentTime + lookAhead) {
      const bpm = this.musicMode === 'menu' ? 112 : computeMusicBpm(this.currentSpeed);
      const stepDur = 60 / bpm / 4; // 16th note
      this.triggerMusicStep(this.stepIndex, this.nextNoteTime, stepDur);
      this.nextNoteTime += stepDur;
      this.stepIndex = (this.stepIndex + 1) % 32;
    }
  }

  private triggerMusicStep(step: number, time: number, stepDur: number): void {
    if (!this.ctx || !this.musicGain) return;
    const isMenu = this.musicMode === 'menu';

    // Menu mode: Chilled Lo-fi urban chord progression
    if (isMenu) {
      const calmDest = this.calmMusicGain || this.musicGain;
      if (step % 4 === 0) {
        this.musicKick(time, 0.24, calmDest);
        const bassNote = MENU_BASS[(step / 4) % MENU_BASS.length];
        this.musicTone(bassNote, bassNote * 0.99, stepDur * 2.4, 'triangle', 0.18, time, 540, calmDest);
      }
      if (step % 8 === 4) {
        this.musicSnare(time, 0.11, calmDest);
      }
      if (step % 2 === 1) {
        this.musicHat(time, 0.045, calmDest);
      }
      if (step % 8 === 0 || step % 8 === 6) {
        const chord = MENU_CHORDS[Math.floor(step / 8) % MENU_CHORDS.length];
        chord.forEach((n) => {
          this.musicTone(n, n, stepDur * 1.9, 'sine', 0.058, time, undefined, calmDest);
        });
      }
      return;
    }

    // Active gameplay: Cross-faded dual-track architecture
    // ----------------------------------------------------
    const calmDest = this.calmMusicGain || this.musicGain;
    const actionDest = this.actionMusicGain || this.musicGain;
    const palette = BIOME_SCALES[this.activeBiome];
    const calmChords = BIOME_CALM_CHORDS[this.activeBiome];

    // --- 1. CALM LAYER (Low-Energy Melodic Track) ---
    // Soft kick on downbeats 1 and 3
    if (step % 8 === 0) {
      this.musicKick(time, 0.28, calmDest);
    }
    // Soft brush snare on backbeats
    if (step % 16 === 8) {
      this.musicSnare(time, 0.12, calmDest);
    }
    // Soft 8th hi-hats
    if (step % 4 === 2) {
      this.musicHat(time, 0.045, calmDest);
    }
    // Warm round sub-bass on quarter notes
    if (step % 4 === 0) {
      const bassIdx = Math.floor(step / 8) % palette.bass.length;
      const bassNote = palette.bass[bassIdx];
      this.musicTone(bassNote, bassNote * 0.99, stepDur * 2.8, 'sine', 0.15, time, 340, calmDest);
    }
    // Lush ambient Rhodes/synth chords on bar transitions
    if (step % 8 === 0) {
      const chord = calmChords[Math.floor(step / 8) % calmChords.length];
      chord.forEach((n) => {
        this.musicTone(n, n, stepDur * 3.2, 'triangle', 0.042, time, 1600, calmDest);
      });
    }

    // --- 2. ACTION LAYER (High-Intensity Driving Track) ---
    // Driving 4-on-the-floor kick + syncopated ghost punch
    if (step % 4 === 0 || step === 14 || step === 30) {
      this.musicKick(time, step % 4 === 0 ? 0.48 : 0.28, actionDest);
    }
    // Crisp explosive snare with reverb sizzle on 2 and 4
    if (step % 8 === 4) {
      this.musicSnare(time, 0.26, actionDest);
    }
    // Driving 16th hi-hat pattern with alternating groove velocity
    if (step % 2 === 1 || step % 4 === 2) {
      const accent = step % 4 === 2 ? 0.14 : 0.065;
      this.musicHat(time, accent, actionDest);
    }
    // Aggressive 16th sawtooth synth bass with resonant bite
    if (step % 2 === 0) {
      const bassIdx = Math.floor(step / 2) % palette.bass.length;
      const octaveBoost = step % 8 === 6 ? 2 : 1;
      const bassFreq = palette.bass[bassIdx] * octaveBoost;
      this.musicTone(bassFreq, bassFreq * 0.98, stepDur * 1.55, 'sawtooth', 0.16, time, 780, actionDest);
    }
    // High-tempo arpeggiator running through the biome scale
    const leadPattern = [0, 2, 4, 5, 7, 5, 4, 2, 3, 5, 7, 9, 7, 5, 4, 2];
    const patIdx = leadPattern[step % leadPattern.length];
    if (patIdx >= 0) {
      const leadFreq = palette.lead[patIdx % palette.lead.length];
      this.musicTone(leadFreq, leadFreq * 1.01, stepDur * 1.25, 'triangle', 0.12, time, 2600, actionDest);
    }

    // --- 3. DYNAMIC PROCEDURAL BIOME AMBIENT EVENTS ---
    if (this.ambientGain && (step % 16 === 0 || step === 10 || step === 26)) {
      this.triggerAmbientBiomeEvent(time, step);
    }
  }

  private triggerAmbientBiomeEvent(time: number, step: number): void {
    if (!this.ctx || !this.ambientGain) return;
    try {
      switch (this.activeBiome) {
        case 'classic': {
          // Distant urban subway bell or city taxi horn
          if (step % 16 === 0) {
            this.tone(466.16, 466.16, 0.16, 'sine', 0.024, 0, this.ambientGain);
            this.tone(587.33, 587.33, 0.16, 'sine', 0.02, 0.015, this.ambientGain);
          }
          break;
        }
        case 'tokyo': {
          // Futuristic digital crosswalk chirps
          if (step === 10 || step === 26) {
            this.tone(2093, 2093, 0.045, 'sine', 0.025, 0, this.ambientGain);
            this.tone(2637, 2637, 0.045, 'sine', 0.02, 0.05, this.ambientGain);
          }
          break;
        }
        case 'canyon': {
          // Red-rock canyon whistling gust
          if (step % 16 === 0) {
            this.tone(740, 520, 0.42, 'sine', 0.035, 0, this.ambientGain);
          }
          break;
        }
        case 'arctic': {
          // Freezing blizzard crystal chime
          if (step % 16 === 0) {
            this.tone(2349, 3135, 0.18, 'sine', 0.035, 0, this.ambientGain);
            this.noiseBurst(0.12, 'highpass', 4500, 6500, 0.02, 0, this.ambientGain);
          }
          break;
        }
        case 'cyberport': {
          // Spaceport telemetry radar pulse
          if (step === 10 || step === 26) {
            this.tone(1174.66, 1760, 0.09, 'sine', 0.03, 0, this.ambientGain);
          }
          break;
        }
      }
    } catch {
      // Ignore
    }
  }

  private musicTone(
    freq: number,
    endFreq: number,
    dur: number,
    type: OscillatorType,
    gainVal: number,
    time: number,
    lowpassHz?: number,
    destGain?: GainNode
  ): void {
    const dest = destGain || this.musicGain;
    if (!this.ctx || !dest) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), time);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), time + dur);
      }
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainVal, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + dur);

      if (lowpassHz) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(lowpassHz, time);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.01);
    } catch {
      // Ignore scheduling glitch
    }
  }

  private musicKick(time: number, gainVal: number, destGain?: GainNode): void {
    const dest = destGain || this.musicGain;
    if (!this.ctx || !dest) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(148, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.11);
      gain.gain.setValueAtTime(gainVal, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.15);
    } catch {
      // Ignore
    }
  }

  private musicSnare(time: number, gainVal: number, destGain?: GainNode): void {
    const dest = destGain || this.musicGain;
    if (!this.ctx || !dest || !this.noiseBuffer) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900, time);
      filter.Q.value = 0.8;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      src.start(time);
      src.stop(time + 0.12);
    } catch {
      // Ignore
    }
  }

  private musicHat(time: number, gainVal: number, destGain?: GainNode): void {
    const dest = destGain || this.musicGain;
    if (!this.ctx || !dest || !this.noiseBuffer) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6800, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      src.start(time);
      src.stop(time + 0.045);
    } catch {
      // Ignore
    }
  }

  private tone(
    freq: number,
    endFreq: number,
    dur: number,
    type: OscillatorType = 'sine',
    gainVal = 0.1,
    delay = 0,
    destGain?: GainNode
  ): void {
    const dest = destGain || this.sfxGain;
    if (this.muted || !this.ctx || !dest) return;
    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    } catch {
      // Ignore audio scheduling glitches if context isn't unlocked yet
    }
  }

  private noiseBurst(
    dur: number,
    filterType: BiquadFilterType,
    startFreq: number,
    endFreq: number,
    gainVal: number,
    delay = 0,
    destGain?: GainNode
  ): void {
    const dest = destGain || this.sfxGain;
    if (this.muted || !this.ctx || !dest || !this.noiseBuffer) return;
    try {
      const now = this.ctx.currentTime + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(Math.max(60, startFreq), now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(60, endFreq), now + dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      src.start(now);
      src.stop(now + dur + 0.01);
    } catch {
      // Ignore
    }
  }

  // --- High-Fidelity Tactile UI Interaction SFX ---
  public uiHover(): void {
    const now = performance.now();
    if (now - this.lastHoverAt < 65) return;
    this.lastHoverAt = now;
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.tone(1380, 1620, 0.025, 'sine', 0.022);
  }

  public uiClick(): void {
    this.init();
    this.tone(860, 1280, 0.042, 'triangle', 0.075);
    this.noiseBurst(0.02, 'highpass', 3200, 4200, 0.028);
  }

  public uiTab(): void {
    this.init();
    this.tone(520, 780, 0.055, 'sine', 0.065);
    this.tone(780, 1040, 0.06, 'triangle', 0.05, 0.025);
  }

  public uiPurchase(): void {
    this.init();
    this.tone(987.77, 1318.51, 0.09, 'triangle', 0.11);
    this.tone(1318.51, 1760, 0.14, 'sine', 0.1, 0.06);
  }

  public uiDenied(): void {
    this.init();
    this.tone(210, 150, 0.08, 'triangle', 0.085);
    this.tone(175, 130, 0.1, 'triangle', 0.085, 0.08);
  }

  public click(): void {
    this.uiClick();
  }

  // --- Environmental Interactions & Gameplay SFX ---

  // Unique aerodynamic Doppler 'whoosh' sound for narrow escapes near obstacles
  public whooshEscape(speed = 22): void {
    const now = performance.now();
    if (now - this.lastWhooshAt < 90) return;
    this.lastWhooshAt = now;
    if (this.muted || !this.ctx || !this.sfxGain) return;

    const speedRatio = Math.min(1.8, Math.max(0.7, speed / 24));
    const dur = 0.18 / speedRatio;
    const startF = 2400 * speedRatio;
    const endF = 420;

    // 1. Dynamic aerodynamic air shear whoosh
    this.noiseBurst(dur, 'bandpass', startF, endF, 0.14 * speedRatio);
    // 2. High-speed Doppler air displacement tone
    this.tone(980 * speedRatio, 320, dur * 0.85, 'sine', 0.07 * speedRatio);
  }

  // Distinct metal-on-metal clang sound when landing on top of trains
  public trainRoofClang(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    // 1. Sharp metallic impact transient (dissonant metal harmonics)
    this.tone(920, 880, 0.12, 'sine', 0.15);
    this.tone(1380, 1320, 0.10, 'triangle', 0.12, 0.003);
    this.tone(2240, 2150, 0.08, 'sine', 0.10, 0.002);

    // 2. Resonant corrugated sheet metal chassis ringing
    this.noiseBurst(0.32, 'bandpass', 640, 520, 0.15);
    this.tone(520, 480, 0.28, 'sawtooth', 0.09, 0.01);

    // 3. Heavy train car suspension shockwave absorption thump
    this.tone(95, 30, 0.22, 'sine', 0.16);
  }

  public coin(doubled = false): void {
    const now = performance.now();
    if (now - this.lastCoinAt < 450) {
      this.coinChain = Math.min(10, this.coinChain + 1);
    } else {
      this.coinChain = 0;
    }
    this.lastCoinAt = now;
    const scale = [880, 987.77, 1108.73, 1318.51, 1479.98, 1661.22, 1760, 1975.53, 2217.46, 2489.02, 2637.02];
    const base = scale[this.coinChain] || 1318.51;
    this.tone(base, base * 1.22, 0.075, 'triangle', 0.11);
    this.tone(base * 2, base * 2.15, 0.06, 'sine', doubled ? 0.075 : 0.045, 0.018);
  }

  public jump(superSneakers = false): void {
    this.tone(superSneakers ? 290 : 210, superSneakers ? 820 : 560, 0.15, 'sine', 0.13);
    this.noiseBurst(0.09, 'bandpass', 700, 2400, 0.05);
  }

  public land(): void {
    this.tone(130, 52, 0.065, 'sine', 0.09);
    this.noiseBurst(0.045, 'lowpass', 650, 180, 0.05);
  }

  public roll(): void {
    this.tone(300, 95, 0.13, 'triangle', 0.11);
    this.noiseBurst(0.14, 'bandpass', 1800, 420, 0.085);
  }

  public lane(): void {
    this.tone(360, 510, 0.055, 'sine', 0.07);
    this.noiseBurst(0.055, 'bandpass', 1200, 2800, 0.045);
  }

  public nearMiss(speed = 22): void {
    this.whooshEscape(speed);
    // Crisp sparkling close-call near miss chime
    this.tone(1174.66, 1567.98, 0.09, 'sine', 0.08);
  }

  public levelUp(): void {
    this.tone(523.25, 659.25, 0.09, 'triangle', 0.12);
    this.tone(659.25, 783.99, 0.09, 'triangle', 0.12, 0.07);
    this.tone(783.99, 1046.5, 0.11, 'triangle', 0.12, 0.14);
    this.tone(1046.5, 1567.98, 0.24, 'sine', 0.13, 0.21);
  }

  public whistle(): void {
    this.tone(2450, 2680, 0.11, 'sine', 0.085);
    this.tone(2680, 2320, 0.15, 'sine', 0.08, 0.12);
    this.noiseBurst(0.2, 'bandpass', 2400, 2800, 0.035);
  }

  public trainHorn(): void {
    this.tone(185, 174, 0.38, 'sawtooth', 0.075);
    this.tone(233, 222, 0.38, 'sawtooth', 0.06, 0.02);
  }

  public powerup(kind?: PowerUpType): void {
    if (kind === 'jetpack') {
      this.noiseBurst(0.35, 'bandpass', 280, 1400, 0.14);
      this.tone(220, 660, 0.25, 'sawtooth', 0.09);
      this.tone(523.25, 1046.5, 0.22, 'triangle', 0.11, 0.08);
      return;
    }
    if (kind === 'pogo') {
      this.tone(240, 960, 0.24, 'sine', 0.14);
      this.tone(480, 1280, 0.2, 'triangle', 0.09, 0.05);
      return;
    }
    this.tone(523.25, 783.99, 0.14, 'triangle', 0.12);
    this.tone(783.99, 1046.5, 0.16, 'sine', 0.11, 0.07);
    this.tone(1046.5, 1567.98, 0.2, 'sine', 0.1, 0.14);
  }

  public hoverboardActivate(): void {
    this.noiseBurst(0.18, 'bandpass', 600, 3200, 0.1);
    this.tone(330, 660, 0.14, 'triangle', 0.12);
    this.tone(660, 987.77, 0.18, 'sine', 0.11, 0.06);
  }

  public comboMilestone(bonusLevel: number): void {
    const pitchBoost = 1 + Math.min(4, Math.max(0, bonusLevel)) * 0.12;
    this.tone(523.25 * pitchBoost, 659.25 * pitchBoost, 0.09, 'triangle', 0.11);
    this.tone(659.25 * pitchBoost, 783.99 * pitchBoost, 0.1, 'triangle', 0.11, 0.055);
    this.tone(1046.5 * pitchBoost, 1174.66 * pitchBoost, 0.16, 'sine', 0.12, 0.11);
  }

  public biomeChange(): void {
    this.noiseBurst(0.28, 'bandpass', 500, 2600, 0.08);
    this.tone(440, 880, 0.22, 'sine', 0.1);
    this.tone(659.25, 1318.51, 0.24, 'triangle', 0.09, 0.08);
  }

  public unlock(): void {
    this.tone(587.33, 880, 0.12, 'triangle', 0.12);
    this.tone(880, 1174.66, 0.16, 'triangle', 0.12, 0.08);
    this.tone(1174.66, 1760, 0.22, 'sine', 0.1, 0.15);
  }

  public stumble(): void {
    this.tone(180, 62, 0.22, 'sawtooth', 0.14);
    this.noiseBurst(0.12, 'lowpass', 900, 220, 0.11);
    this.whistle();
    this.dogBark();
  }

  public dogBark(): void {
    this.tone(420, 260, 0.075, 'sawtooth', 0.085, 0.04);
    this.tone(480, 240, 0.08, 'sawtooth', 0.085, 0.16);
  }

  public gtaWasted(): void {
    // Deep slow-motion cinematic impact + descending noir chord
    this.tone(92, 26, 0.72, 'sawtooth', 0.22);
    this.tone(68, 22, 0.78, 'sine', 0.24, 0.03);
    this.noiseBurst(0.45, 'lowpass', 1100, 120, 0.22);
    this.tone(311.13, 277.18, 0.45, 'triangle', 0.1, 0.28);
    this.tone(233.08, 196.0, 0.65, 'triangle', 0.11, 0.52);
  }

  public shieldBreak(): void {
    this.noiseBurst(0.24, 'highpass', 1800, 4200, 0.16);
    this.tone(980, 320, 0.24, 'sine', 0.14);
    this.tone(620, 210, 0.22, 'triangle', 0.1, 0.05);
  }

  public crash(): void {
    this.tone(150, 30, 0.42, 'sawtooth', 0.2);
    this.tone(95, 28, 0.35, 'square', 0.11, 0.05);
    this.noiseBurst(0.32, 'lowpass', 1400, 160, 0.22);
    this.tone(392, 349.23, 0.16, 'triangle', 0.09, 0.22);
    this.tone(329.63, 246.94, 0.28, 'triangle', 0.09, 0.38);
  }

  public boardBreak(): void {
    this.tone(680, 120, 0.28, 'square', 0.14);
    this.tone(420, 90, 0.24, 'sawtooth', 0.1, 0.05);
    this.noiseBurst(0.22, 'bandpass', 2200, 450, 0.14);
  }
}

export const soundEngine = new SoundEngine();
