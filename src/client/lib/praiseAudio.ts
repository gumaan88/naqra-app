// Praise Audio Manager with Shuffle Bag Algorithm
// Pre-generated, 100% offline-ready natural human Arabic praise clips
// Zero AI calls, zero gameplay latency, mobile autoplay handled

export interface PraiseClip {
  id: string;
  text: string;
  url: string;
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

class PraiseAudioManager {
  private bag: PraiseClip[] = [];
  private recentClipIds: string[] = [];
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private audioContext: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.initBag();
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

  // Unlock AudioContext and mobile autoplay on first touch/tap
  private setupAutoplayUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      if (this.isUnlocked) return;
      
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx && !this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }

        // Silent playback buffer to unlock HTMLAudioElement on iOS/Android Chrome
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
  private shuffle(array: PraiseClip[]): PraiseClip[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Initialize and replenish shuffle bag ensuring no recent repetitions
  private initBag() {
    let newBag = this.shuffle(PRAISE_CLIPS);
    
    // Ensure the first item of the new bag is not in recent items
    if (this.recentClipIds.length > 0 && newBag.length > 3) {
      while (this.recentClipIds.includes(newBag[0].id)) {
        newBag = this.shuffle(PRAISE_CLIPS);
      }
    }
    this.bag = newBag;
  }

  // Play next praise clip using Shuffle Bag algorithm
  public playPraise(): string | null {
    if (typeof window === 'undefined') return null;

    // Check mute status from localStorage
    const isMuted = localStorage.getItem('naqra_sound_muted') === 'true';
    if (isMuted) return null;

    // Replenish bag if empty
    if (this.bag.length === 0) {
      this.initBag();
    }

    const nextClip = this.bag.pop();
    if (!nextClip) return null;

    // Record in recent list (keep max 3)
    this.recentClipIds.push(nextClip.id);
    if (this.recentClipIds.length > 3) {
      this.recentClipIds.shift();
    }

    try {
      let audio = this.audioCache.get(nextClip.id);
      if (!audio) {
        audio = new Audio(nextClip.url);
        this.audioCache.set(nextClip.id, audio);
      }
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.warn(`[PraiseAudio] Playback interrupted for ${nextClip.id}:`, err);
      });
    } catch (err) {
      console.warn(`[PraiseAudio] Error playing ${nextClip.id}:`, err);
    }

    return nextClip.text;
  }

  // Voice pronounciation for Reading Preview "ساعدني 🔊" without AI request
  public speakWord(wordText: string) {
    if (typeof window === 'undefined') return;
    const isMuted = localStorage.getItem('naqra_sound_muted') === 'true';
    if (isMuted) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85; // slightly slower for clear child articulation

      // Look for Arabic voice
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('Arabic'));
      if (arVoice) {
        utterance.voice = arVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }
}

export const praiseAudio = new PraiseAudioManager();
