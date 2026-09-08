export class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenTimer: any = null;
  private sirenState: number = 0;

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch {
      // AudioContext unavailable
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
    if (muted) {
      this.stopEngineSound();
      this.stopSiren();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Gunshot Sounds ---
  public playGunshot(type: 'pistol' | 'smg' | 'shotgun' = 'pistol'): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'shotgun') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.28);
      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);

      // Add noise burst for shotgun blast
      this.playNoise(0.25, 0.8, 1200);
    } else if (type === 'smg') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.1);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.11);
      this.playNoise(0.08, 0.4, 3000);
    } else {
      // Pistol
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
      this.playNoise(0.12, 0.6, 2200);
    }
  }

  private playNoise(duration: number, volume: number, filterFreq: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  public playReload(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Click 1 (mag release)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(1200, t);
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.06);

    // Click 2 (mag insert)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.frequency.setValueAtTime(800, t + 0.25);
    gain2.gain.setValueAtTime(0.4, t + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.25);
    osc2.stop(t + 0.33);
  }

  // --- Vehicle Sounds ---
  public startEngineSound(): void {
    if (this.isMuted || !this.ctx || !this.masterGain || this.engineOsc) return;
    this.resume();

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start();
  }

  public updateEnginePitch(speedRatio: number): void {
    if (!this.engineOsc || !this.ctx) return;
    // Base 55Hz idle, up to 220Hz top speed
    const freq = 55 + Math.abs(speedRatio) * 165;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
  }

  public stopEngineSound(): void {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {}
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  public playCarHorn(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.frequency.setValueAtTime(370, t);
    osc2.frequency.setValueAtTime(440, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  // --- Police Siren ---
  public startSiren(): void {
    if (this.isMuted || !this.ctx || !this.masterGain || this.sirenOsc) return;
    this.resume();

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sine';
    this.sirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);
    this.sirenOsc.start();

    this.sirenTimer = setInterval(() => {
      if (!this.sirenOsc || !this.ctx) return;
      this.sirenState = (this.sirenState + 1) % 2;
      const targetFreq = this.sirenState === 0 ? 880 : 620;
      this.sirenOsc.frequency.exponentialRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.3);
    }, 450);
  }

  public stopSiren(): void {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {}
      this.sirenOsc = null;
      this.sirenGain = null;
    }
  }

  // --- UI & Game Events ---
  public playCashSound(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  public playMissionComplete(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.resume();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  public playDamageSound(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playDoorEnter(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }
}
