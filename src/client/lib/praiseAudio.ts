// Praise Audio Manager with Multi-Layer Sound Design & Shuffle Bag Algorithm
// Pre-generated, 100% offline-ready natural human Arabic praise clips
// Zero AI calls during gameplay, zero latency, Android Chrome compatible

import { sound } from './audio';

export interface PraiseClip {
  id: string;
  text: string;
  url: string;
}

export type SoundProfileType = 'sparkle' | 'applause' | 'chime' | 'voice_only';

export interface SoundProfile {
  id: SoundProfileType;
  name: string;
  effect: () => void;
}

export const PRAISE_CLIPS: PraiseClip[] = [
  { id: 'ahsant_01', text: 'أَحْسَنْتَ!', url: '/audio/praise/ahsant_01.mp3' },
  { id: 'ahsant_02', text: 'أَحْسَنْتَ يَا بَطَل!', url: '/audio/praise/ahsant_02.mp3' },
  { id: 'rae_01', text: 'رَائِع!', url: '/audio/praise/rae_01.mp3' },
  { id: 'rae_02', text: 'عَمَلٌ رَائِع!', url: '/audio/praise/rae_02.mp3' },
  { id: 'mumtaz_01', text: 'مُمْتَاز!', url: '/audio/praise/mumtaz_01.mp3' },
  { id: 'mumtaz_02', text: 'إِجَابَةٌ مُمْتَازَة!', url: '/audio/praise/mumtaz_02.mp3' },
  { id: 'mubde_01', text: 'مُبْدِع!', url: '/audio/praise/mubde_01.mp3' },
  { id: 'anta_batal_01', text: 'أَنْتَ بَطَل!', url: '/audio/praise/anta_batal_01.mp3' },
  { id: 'istamir_01', text: 'اسْتَمِرّ!', url: '/audio/praise/istamir_01.mp3' },
  { id: 'bravo_01', text: 'بْرَافُو!', url: '/audio/praise/bravo_01.mp3' },
  { id: 'shater_01', text: 'شَاطِر!', url: '/audio/praise/shater_01.mp3' },
  { id: 'jameel_01', text: 'جَمِيلٌ جِدًّا!', url: '/audio/praise/jameel_01.mp3' },
];

const SOUND_PROFILES: SoundProfile[] = [
  { id: 'sparkle', name: 'Voice + Sparkle', effect: () => sound.playSparkle() },
  { id: 'applause', name: 'Voice + Soft Applause', effect: () => sound.playSoftApplause() },
  { id: 'chime', name: 'Voice + Cheerful Chime', effect: () => sound.playCheerfulChime() },
  { id: 'voice_only', name: 'Voice Only', effect: () => {} },
];

class PraiseAudioManager {
  // Voice Shuffle Bag
  private voiceBag: PraiseClip[] = [];
  private recentVoiceIds: string[] = []; // tracks last 3 voices

  // Profile Shuffle Bag
  private profileBag: SoundProfile[] = [];
  private recentProfileIds: SoundProfileType[] = []; // tracks last 2 profiles

  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isUnlocked: boolean = false;

  constructor() {
    this.initVoiceBag();
    this.initProfileBag();
    this.setupAutoplayUnlock();
    this.preloadClips();
  }

  // Pre-load clips in browser memory
  private preloadClips() {
    if (typeof window === 'undefined') return;
    PRAISE_CLIPS.forEach((clip) => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = clip.url;
        this.audioCache.set(clip.id, audio);
      } catch (e) {
        console.warn(`[PraiseAudio] Failed to preload ${clip.id}:`, e);
      }
    });
  }

  // Unlock AudioContext and mobile autoplay on first touch/tap (Android Chrome / iOS)
  private setupAutoplayUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      if (this.isUnlocked) return;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const tempCtx = new AudioCtx();
          if (tempCtx.state === 'suspended') {
            tempCtx.resume();
          }
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

  // Get next voice clip without repetition
  private getNextVoiceClip(): PraiseClip | null {
    if (this.voiceBag.length === 0) {
      this.initVoiceBag();
    }
    const clip = this.voiceBag.pop() || null;
    if (clip) {
      this.recentVoiceIds.push(clip.id);
      if (this.recentVoiceIds.length > 3) {
        this.recentVoiceIds.shift();
      }
    }
    return clip;
  }

  // Get next sound profile without repetition
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

  // Play natural human praise with layered sound profile
  public playCelebrationSuccess(streakCount: number = 0): { text: string; profile: SoundProfileType } | null {
    if (typeof window === 'undefined') return null;

    const isMuted = localStorage.getItem('naqra_sound_muted') === 'true';
    if (isMuted) return null;

    // Pick next voice clip (history of last 3 prevented)
    const clip = this.getNextVoiceClip();
    if (!clip) return null;

    // Play Layer 1: Natural Human Voice
    try {
      let audio = this.audioCache.get(clip.id);
      if (!audio) {
        audio = new Audio(clip.url);
        this.audioCache.set(clip.id, audio);
      }
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.warn(`[PraiseAudio] Voice playback interrupted:`, err);
      });
    } catch (err) {
      console.warn(`[PraiseAudio] Error playing voice ${clip.id}:`, err);
    }

    // Play Layer 2/3: Light Sound Effects (Profile or Milestone)
    let selectedProfile: SoundProfileType = 'voice_only';

    if (streakCount >= 5) {
      // 5 correct streak milestone
      setTimeout(() => sound.playMilestone5Streak(), 100);
      selectedProfile = 'applause';
    } else if (streakCount === 3) {
      // 3 correct streak milestone
      setTimeout(() => sound.playMilestone3Streak(), 100);
      selectedProfile = 'chime';
    } else {
      // Standard round: select profile from Shuffle Bag (history of last 2 prevented)
      const profile = this.getNextProfile();
      selectedProfile = profile.id;
      setTimeout(() => {
        profile.effect();
      }, 90);
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
