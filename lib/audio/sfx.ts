// ============================================================================
// Web Audio API Sound Effects Engine (Zero Latency, Zero Bundle Assets)
// High-performance, synthesized procedural audio for cheerful admin interactions.
// ============================================================================

export type SoundType =
  | 'click'
  | 'tab'
  | 'nav'
  | 'toggle-on'
  | 'toggle-off'
  | 'success'
  | 'error'
  | 'warning'
  | 'delete'
  | 'drop'
  | 'download'
  | 'collapse';

const STORAGE_KEY = 'admin_sfx_muted';
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isAudioMuted: boolean = false;
let lastSoundTime: number = 0;

// Initialize mute state from localStorage (client only)
if (typeof window !== 'undefined') {
  try {
    isAudioMuted = localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    isAudioMuted = false;
  }
}

/**
 * Returns or initializes the shared AudioContext lazily.
 * Guarantees zero overhead until the user's first interaction.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    audioCtx = new AudioCtxClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.12, audioCtx.currentTime); // subtle, elegant baseline volume
    masterGain.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Checks if sound effects are currently muted.
 */
export function isSfxMuted(): boolean {
  return isAudioMuted;
}

/**
 * Sets the sound effects mute state and persists to localStorage.
 */
export function setSfxMuted(muted: boolean): void {
  isAudioMuted = muted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('admin-sfx-mute-changed', { detail: { muted } }));
    } catch {}
  }
}

/**
 * Toggles the sound effects mute state and returns the new state.
 */
export function toggleSfxMute(): boolean {
  const next = !isAudioMuted;
  setSfxMuted(next);
  if (!next) {
    // Play a preview sound when unmuting
    playSfx('success');
  }
  return next;
}

/**
 * Plays a cheerful, musical procedural sound effect.
 */
export function playSfx(type: SoundType = 'click'): void {
  if (isAudioMuted || typeof window === 'undefined') return;

  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;
  const destination = masterGain;

  // Throttle rapid triggers to avoid clipping
  const now = performance.now();
  if (now - lastSoundTime < 30 && type === 'click') return;
  lastSoundTime = now;

  const t = ctx.currentTime;

  try {
    switch (type) {
      // 1. CLICK: Snappy, cheerful bubble-pop (short, crisp)
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.exponentialRampToValueAtTime(780, t + 0.025);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.045);
        break;
      }

      // 2. TAB: Cheerful ascending blip for tabs & segment pills
      case 'tab': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540, t);
        osc.frequency.exponentialRampToValueAtTime(840, t + 0.045);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.06);
        break;
      }

      // 3. NAV: Cheerful melodic double-note for sidebar navigation
      case 'nav': {
        const notes = [659.25, 880]; // E5, A5
        notes.forEach((freq, idx) => {
          const noteTime = t + idx * 0.045;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.35, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.09);

          osc.connect(gain);
          gain.connect(destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.095);
        });
        break;
      }

      // 4. TOGGLE ON: Upbeat, bright switch chime
      case 'toggle-on': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(720, t + 0.06);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.085);
        break;
      }

      // 5. TOGGLE OFF: Gentle downbeat switch chime
      case 'toggle-off': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, t);
        osc.frequency.exponentialRampToValueAtTime(420, t + 0.06);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.08);
        break;
      }

      // 6. SUCCESS: Catchy major-chord marimba arpeggio (C5 -> E5 -> G5 -> C6 sparkle!)
      case 'success': {
        const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        chord.forEach((freq, i) => {
          const startTime = t + i * 0.045;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = i === 3 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          // Natural marimba bell envelope
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.45 - i * 0.05, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

          osc.connect(gain);
          gain.connect(destination);

          osc.start(startTime);
          osc.stop(startTime + 0.3);
        });
        break;
      }

      // 7. ERROR: Soft, warm double low boop (non-jarring, friendly warning)
      case 'error': {
        const tones = [260, 200];
        tones.forEach((freq, i) => {
          const startTime = t + i * 0.075;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.4, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

          osc.connect(gain);
          gain.connect(destination);

          osc.start(startTime);
          osc.stop(startTime + 0.09);
        });
        break;
      }

      // 8. WARNING: Cheerful attention bell
      case 'warning': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, t); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1320, t); // E6 overtone

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.24);
        osc2.stop(t + 0.24);
        break;
      }

      // 9. DELETE: Soft descending bubble pop
      case 'delete': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.09);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.11);
        break;
      }

      // 10. DROP: Cheerful water-droplet / plop (for drag-and-drop uploads)
      case 'drop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(920, t + 0.035);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.08);

        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.095);
        break;
      }

      // 11. DOWNLOAD: Joyful ascending whistle sweep (for export actions)
      case 'download': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(987.77, t + 0.18); // B5

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.24);
        break;
      }

      // 12. COLLAPSE: Light spring pop for sidebar expand/collapse
      case 'collapse': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(640, t + 0.04);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.055);
        break;
      }
    }
  } catch (err) {
    // Graceful fallback: audio failure must never break the UI
    console.debug('Audio SFX play ignored:', err);
  }
}
