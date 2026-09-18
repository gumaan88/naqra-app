// Praise Audio Manager with Multi-Layer Web Audio Design & Shuffle Bag Algorithm
// Pre-generated, 100% offline-ready natural human Arabic praise clips + authentic celebration effects
// Zero AI calls during gameplay, zero latency, Android Chrome & iOS Safari compatible

import { sound } from './audio';

export interface PraiseClip {
  id: string;
  text: string;
  url: string;
}

export type SoundProfileType = 
  | 'sparkle' 
  | 'soft_claps' 
  | 'mini_cheer' 
  | 'chime' 
  | 'applause' 
  | 'sparkle_clap';

export interface SoundProfile {
  id: SoundProfileType;
  name: string;
  effectFile: string;
  secondaryEffectFile?: string;
  synthesizerFallback?: () => void;
}

export const PRAISE_CLIPS: PraiseClip[] = [
  { id: 'ahsant_01', text: 'أَحْسَنْتَ!', url: '/audio/praise/voices/ahsant_01.mp3' },
  { id: 'ahsant_02', text: 'أَحْسَنْتَ يَا بَطَل!', url: '/audio/praise/voices/ahsant_02.mp3' },
  { id: 'rae_01', text: 'رَائِع!', url: '/audio/praise/voices/rae_01.mp3' },
  { id: 'rae_02', text: 'عَمَلٌ رَائِع!', url: '/audio/praise/voices/rae_02.mp3' },
  { id: 'mumtaz_01', text: 'مُمْتَاز!', url: '/audio/praise/voices/mumtaz_01.mp3' },
  { id: 'mumtaz_02', text: 'إِجَابَةٌ مُمْتَازَة!', url: '/audio/praise/voices/mumtaz_02.mp3' },
  { id: 'mubde_01', text: 'مُبْدِع!', url: '/audio/praise/voices/mubde_01.mp3' },
  { id: 'anta_batal_01', text: 'أَنْتَ بَطَل!', url: '/audio/praise/voices/anta_batal_01.mp3' },
  { id: 'ya_salam_01', text: 'يَا سَلَام!', url: '/audio/praise/voices/ya_salam_01.mp3' },
  { id: 'bravo_01', text: 'بْرَافُو!', url: '/audio/praise/voices/bravo_01.mp3' },
  { id: 'wasil_01', text: 'وَاصِل يَا بَطَل!', url: '/audio/praise/voices/wasil_01.mp3' },
  { id: 'istamir_01', text: 'اسْتَمِرّ!', url: '/audio/praise/voices/istamir_01.mp3' },
  { id: 'shater_01', text: 'شَاطِر يَا بَطَل!', url: '/audio/praise/voices/shater_01.mp3' },
  { id: 'jameel_01', text: 'جَمِيلٌ جِدًّا!', url: '/audio/praise/voices/jameel_01.mp3' },
];

export const EFFECT_FILES = {
  soft_claps: '/audio/praise/effects/clap_soft_01.mp3',
  kids_cheer: '/audio/praise/effects/kids_cheer_01.mp3',
  sparkle: '/audio/praise/effects/sparkle_01.mp3',
  chime: '/audio/praise/effects/chime_01.mp3',
  applause: '/audio/praise/effects/applause_group_01.mp3',
  soft_error: '/audio/errors/soft_error_01.mp3',
};

export const SOUND_PROFILES: SoundProfile[] = [
  { 
    id: 'sparkle', 
    name: 'SUCCESS_1 (Voice + Sparkle)', 
    effectFile: EFFECT_FILES.sparkle,
    synthesizerFallback: () => sound.playSparkle()
  },
  { 
    id: 'soft_claps', 
    name: 'SUCCESS_2 (Voice + Soft Claps)', 
    effectFile: EFFECT_FILES.soft_claps,
    synthesizerFallback: () => sound.playSoftApplause()
  },
  { 
    id: 'mini_cheer', 
    name: 'SUCCESS_3 (Voice + Kids Cheer)', 
    effectFile: EFFECT_FILES.kids_cheer,
    synthesizerFallback: () => sound.playSoftApplause()
  },
  { 
    id: 'chime', 
    name: 'SUCCESS_4 (Voice + Chime)', 
    effectFile: EFFECT_FILES.chime,
    synthesizerFallback: () => sound.playCheerfulChime()
  },
  { 
    id: 'applause', 
    name: 'SUCCESS_5 (Voice + Light Applause)', 
    effectFile: EFFECT_FILES.applause,
    synthesizerFallback: () => sound.playSoftApplause()
  },
  { 
    id: 'sparkle_clap', 
    name: 'SUCCESS_6 (Voice + Sparkle & Claps)', 
    effectFile: EFFECT_FILES.sparkle,
    secondaryEffectFile: EFFECT_FILES.soft_claps,
    synthesizerFallback: () => {
      sound.playSparkle();
      setTimeout(() => sound.playSoftApplause(), 100);
    }
  },
];

class PraiseAudioManager {
  // Voice Shuffle Bag
  private voiceBag: PraiseClip[] = [];
  private recentVoiceIds: string[] = []; // Tracks last 3 voices to avoid repetition

  // Profile Shuffle Bag
  private profileBag: SoundProfile[] = [];
  private recentProfileIds: SoundProfileType[] = []; // Tracks last 2 profiles to avoid repetition

  // Web Audio Infrastructure
  private audioCtx: AudioContext | null = null;
  private voiceGainNode: GainNode | null = null;
  private effectsGainNode: GainNode | null = null;

  // Cached AudioBuffers for zero-latency instant playback
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isUnlocked: boolean = false;

  constructor() {
    this.initVoiceBag();
    this.initProfileBag();
    this.setupAutoplayUnlock();
    this.preloadLibrary();
  }

  // Get or initialize Web Audio context with dedicated mixer channels
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
        
        // Voice Gain Node: 1.0 (100% foreground clarity)
        this.voiceGainNode = this.audioCtx.createGain();
        this.voiceGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
        this.voiceGainNode.connect(this.audioCtx.destination);

        // Effects Gain Node: 0.38 (38% volume, soft and supportive, never covers voice)
        this.effectsGainNode = this.audioCtx.createGain();
        this.effectsGainNode.gain.setValueAtTime(0.38, this.audioCtx.currentTime);
        this.effectsGainNode.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Pre-decode essential audio assets into Web Audio buffers
  private preloadLibrary() {
    if (typeof window === 'undefined') return;

    // 1. Preload key voice clips
    PRAISE_CLIPS.slice(0, 6).forEach(clip => {
      this.fetchAndDecodeBuffer(clip.url);
    });

    // 2. Preload celebration effects
    Object.values(EFFECT_FILES).forEach(url => {
      this.fetchAndDecodeBuffer(url);
    });

    // 3. Keep HTMLAudioElement cache as fallback for older devices
    PRAISE_CLIPS.forEach((clip) => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = clip.url;
        this.audioCache.set(clip.id, audio);
      } catch (e) {
        // Silently continue
      }
    });
  }

  private async fetchAndDecodeBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }
    const ctx = this.getContext();
    if (!ctx) return null;

    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const arrayBuffer = await resp.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (err) {
      return null;
    }
  }

  // Play an AudioBuffer through the specified gain channel
  private playBuffer(url: string, channel: 'voice' | 'effect', delayMs: number = 0) {
    const ctx = this.getContext();
    if (!ctx) return;

    const targetGain = channel === 'voice' ? this.voiceGainNode : this.effectsGainNode;
    if (!targetGain) return;

    const startAudio = (buffer: AudioBuffer) => {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(targetGain);
        const startTime = ctx.currentTime + Math.max(0, delayMs) / 1000;
        source.start(startTime);
      } catch (err) {
        console.warn(`[PraiseAudio] Buffer playback error for ${url}:`, err);
      }
    };

    if (this.bufferCache.has(url)) {
      startAudio(this.bufferCache.get(url)!);
    } else {
      this.fetchAndDecodeBuffer(url).then(buf => {
        if (buf) startAudio(buf);
      });
    }
  }

  // Unlock AudioContext and mobile autoplay on first touch/tap (Android Chrome / iOS)
  private setupAutoplayUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      if (this.isUnlocked) return;

      try {
        const ctx = this.getContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
        }

        // Silent playback buffer to unlock HTMLAudioElement on Android Chrome
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        silentAudio.play().catch(() => {});

        this.isUnlocked = true;
      } catch (err) {
        console.warn('[PraiseAudio] Autoplay unlock failed:', err);
      } finally {
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('click', unlockHandler);
      }
    };

    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
  }

  // Fisher-Yates shuffle
  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Initialize Voice Bag avoiding last 3 items
  private initVoiceBag() {
    let newBag = this.shuffle(PRAISE_CLIPS);
    if (this.recentVoiceIds.length > 0 && newBag.length > 3) {
      let retries = 0;
      while (this.recentVoiceIds.includes(newBag[0].id) && retries < 10) {
        newBag = this.shuffle(PRAISE_CLIPS);
        retries++;
      }
    }
    this.voiceBag = newBag;
  }

  // Initialize Profile Bag avoiding last 2 items
  private initProfileBag() {
    let newBag = this.shuffle(SOUND_PROFILES);
    if (this.recentProfileIds.length > 0 && newBag.length > 2) {
      let retries = 0;
      while (this.recentProfileIds.includes(newBag[0].id) && retries < 10) {
        newBag = this.shuffle(SOUND_PROFILES);
        retries++;
      }
    }
    this.profileBag = newBag;
  }

  // Get next voice clip without repetition (guarantees not in last 3)
  private getNextVoiceClip(): PraiseClip {
    if (this.voiceBag.length === 0) {
      this.initVoiceBag();
    }
    const clip = this.voiceBag.pop() || PRAISE_CLIPS[0];
    this.recentVoiceIds.push(clip.id);
    if (this.recentVoiceIds.length > 3) {
      this.recentVoiceIds.shift();
    }
    return clip;
  }

  // Get next sound profile without repetition (guarantees not in last 2)
  private getNextProfile(): SoundProfile {
    if (this.profileBag.length === 0) {
      this.initProfileBag();
    }
    const profile = this.profileBag.pop() || SOUND_PROFILES[0];
    this.recentProfileIds.push(profile.id);
    if (this.recentProfileIds.length > 2) {
      this.recentProfileIds.shift();
    }
    return profile;
  }

  // Play natural human praise with layered sound profile and Web Audio mixing
  public playCelebrationSuccess(streakCount: number = 0): { text: string; profile: SoundProfileType } | null {
    if (typeof window === 'undefined') return null;

    const isMuted = localStorage.getItem('naqra_sound_muted') === 'true';
    if (isMuted) return null;

    // Pick next voice clip (history of last 3 prevented)
    let clip: PraiseClip;
    let selectedProfile: SoundProfileType = 'sparkle';

    // Milestone handling
    if (streakCount >= 5) {
      // 5-word streak milestone: "أنت بطل!" + Kids Cheer + Fanfare
      const heroClip = PRAISE_CLIPS.find(c => c.id === 'anta_batal_01') || PRAISE_CLIPS[0];
      clip = heroClip;
      selectedProfile = 'mini_cheer';

      // 1. Voice in foreground
      this.playBuffer(clip.url, 'voice', 0);
      
      // 2. Kids cheer background effect (starts 100ms after voice)
      this.playBuffer(EFFECT_FILES.kids_cheer, 'effect', 100);
      setTimeout(() => sound.playMilestone5Streak(), 120);

    } else if (streakCount === 3) {
      // 3-word streak milestone: "عمل رائع!" / "رائع!" + Chime & Soft Claps
      const greatClip = PRAISE_CLIPS.find(c => c.id === 'rae_02' || c.id === 'rae_01') || PRAISE_CLIPS[2];
      clip = greatClip;
      selectedProfile = 'chime';

      // 1. Voice in foreground
      this.playBuffer(clip.url, 'voice', 0);

      // 2. Chime + claps effect (starts 90ms after voice)
      this.playBuffer(EFFECT_FILES.chime, 'effect', 90);
      this.playBuffer(EFFECT_FILES.soft_claps, 'effect', 220);

    } else {
      // Standard round: select next voice and profile from Dual Shuffle Bags
      clip = this.getNextVoiceClip();
      const profile = this.getNextProfile();
      selectedProfile = profile.id;

      // 1. Play Layer 1: Natural Human Voice in foreground (100% volume)
      this.playBuffer(clip.url, 'voice', 0);

      // 2. Play Layer 2: Celebration Background Effect (38% volume, starts 100ms after voice)
      if (profile.effectFile) {
        this.playBuffer(profile.effectFile, 'effect', 100);
      }
      if (profile.secondaryEffectFile) {
        this.playBuffer(profile.secondaryEffectFile, 'effect', 240);
      }

      // Synthesizer fallback if audio files are loading or not supported
      if (!this.bufferCache.has(profile.effectFile) && profile.synthesizerFallback) {
        setTimeout(() => {
          profile.synthesizerFallback!();
        }, 100);
      }
    }

    return {
      text: clip.text,
      profile: selectedProfile,
    };
  }

  // Backward compatible alias
  public playPraise(streakCount: number = 0): string | null {
    const result = this.playCelebrationSuccess(streakCount);
    return result ? result.text : null;
  }

  // Play preloaded soft error sound
  public playSoftError() {
    const isMuted = localStorage.getItem('naqra_sound_muted') === 'true';
    if (isMuted) return;

    if (this.bufferCache.has(EFFECT_FILES.soft_error)) {
      this.playBuffer(EFFECT_FILES.soft_error, 'effect', 0);
    } else {
      sound.playSoftError();
    }
  }

  // Local Voice pronunciation for Reading Preview "ساعدني 🔊"
  public speakWord(wordText: string) {
    if (typeof window === 'undefined') return;
    const isMuted = localStorage.getItem('naqra_sound_muted') === 'true';
    if (isMuted) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85; // slightly slower for clear child articulation

      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find((v) => v.lang.startsWith('ar') || v.lang.includes('Arabic'));
      if (arVoice) {
        utterance.voice = arVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }
}

export const praiseAudio = new PraiseAudioManager();
