export class ProceduralAudio {
    private context: AudioContext | null = null;
    private enabled = true;

    public playSelect(): void {
        this.playTone(680, 0.05, 'triangle', 0.025);
    }

    public playInvalid(): void {
        this.playTone(220, 0.12, 'sawtooth', 0.03);
    }

    public playSwap(): void {
        this.playTone(420, 0.07, 'square', 0.028);
    }

    public playMatch(cascadeIndex: number): void {
        this.playTone(520 + cascadeIndex * 60, 0.1, 'triangle', 0.05);
    }

    public playWin(): void {
        this.playTone(740, 0.12, 'triangle', 0.05);
        this.playTone(920, 0.16, 'triangle', 0.04, 0.08);
    }

    public playLose(): void {
        this.playTone(260, 0.18, 'sine', 0.04);
    }

    private playTone(
        frequency: number,
        duration: number,
        type: OscillatorType,
        volume: number,
        delay = 0,
    ): void {
        if (!this.enabled || typeof window === 'undefined') {
            return;
        }

        const AudioContextCtor = (window as typeof window & {
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext;
        }).AudioContext || (window as any).webkitAudioContext;

        if (!AudioContextCtor) {
            this.enabled = false;
            return;
        }

        if (!this.context) {
            this.context = new AudioContextCtor();
        }

        const ctx = this.context;
        const now = ctx.currentTime + delay;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
    }
}
