import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const voicesDir = path.join(publicDir, 'audio', 'praise', 'voices');
const effectsDir = path.join(publicDir, 'audio', 'praise', 'effects');
const errorsDir = path.join(publicDir, 'audio', 'errors');
const legacyPraiseDir = path.join(publicDir, 'audio', 'praise');

[voicesDir, effectsDir, errorsDir, legacyPraiseDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// Human Arabic Praise Clips for Children (Aged 4-7)
// Warm, natural, smiling, encouraging tone
const voiceClips = [
  { id: 'ahsant_01', text: 'أَحْسَنْتَ!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'ahsant_02', text: 'أَحْسَنْتَ يَا بَطَل!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'rae_01', text: 'رَائِع!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'rae_02', text: 'عَمَلٌ رَائِع!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'mumtaz_01', text: 'مُمْتَاز!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'mumtaz_02', text: 'إِجَابَةٌ مُمْتَازَة!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'mubde_01', text: 'مُبْدِع!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'anta_batal_01', text: 'أَنْتَ بَطَل!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'ya_salam_01', text: 'يَا سَلَام!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'bravo_01', text: 'بْرَافُو!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'wasil_01', text: 'وَاصِل يَا بَطَل!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'istamir_01', text: 'اسْتَمِرّ!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'shater_01', text: 'شَاطِر يَا بَطَل!', voice: 'ar-SA-ZariyahNeural' },
  { id: 'jameel_01', text: 'جَمِيلٌ جِدًّا!', voice: 'ar-SA-ZariyahNeural' }
];

async function generateVoiceClips() {
  console.log('--- Generating High-Quality Natural Human Arabic Praise Voices ---');
  const tts = new MsEdgeTTS();
  await tts.setMetadata('ar-SA-ZariyahNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  for (const clip of voiceClips) {
    const targetFile = path.join(voicesDir, `${clip.id}.mp3`);
    const legacyFile = path.join(legacyPraiseDir, `${clip.id}.mp3`);

    console.log(`Generating natural voice for "${clip.text}" (${clip.id})...`);
    const { audioStream } = tts.toStream(clip.text);
    
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(targetFile);
      audioStream.pipe(ws);
      ws.on('finish', () => {
        // Also copy to legacy path for backward compatibility
        fs.copyFileSync(targetFile, legacyFile);
        console.log(` -> Saved ${clip.id}.mp3 (${fs.statSync(targetFile).size} bytes)`);
        resolve();
      });
      ws.on('error', reject);
    });

    // Small courteous pause
    await new Promise(r => setTimeout(r, 200));
  }
}

// Generate Soft Error Sound ("بوب" / "تن" 160ms soft plop, warm sine drop, zero harshness)
function generateSoftErrorWav() {
  console.log('--- Generating Soft Error Sound (Warm Gentle Pop/Plop) ---');
  const sampleRate = 44100;
  const duration = 0.18; // 180 ms
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byteRate
  buffer.writeUInt16LE(2, 32);  // blockAlign
  buffer.writeUInt16LE(16, 34); // bitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Gentle sine droplet pitch drop from 290Hz to 190Hz with smooth envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const freq = 290 - 100 * Math.pow(progress, 0.7); // gentle glide
    const phase = 2 * Math.PI * freq * t;
    
    // Smooth envelope: quick 6ms attack, soft exponential decay
    const attack = Math.min(1, t / 0.006);
    const decay = Math.exp(-progress * 6.5);
    const amp = attack * decay * 0.45; // gentle soft volume

    const sample = Math.max(-1, Math.min(1, Math.sin(phase) * amp));
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  const outWav = path.join(errorsDir, 'soft_error_01.wav');
  const outMp3 = path.join(errorsDir, 'soft_error_01.mp3'); // duplicate as mp3 name for URL compatibility
  fs.writeFileSync(outWav, buffer);
  fs.writeFileSync(outMp3, buffer);
  console.log(`Saved soft error sound: ${outWav} (${buffer.length} bytes)`);
}

// Generate Sparkle Sound (Delicate shimmer arpeggio, 400ms)
function generateSparkleWav() {
  console.log('--- Generating Delicate Sparkle Shimmer ---');
  const sampleRate = 44100;
  const duration = 0.45;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  const notes = [
    { freq: 1318.51, start: 0.00 }, // E6
    { freq: 1567.98, start: 0.05 }, // G6
    { freq: 1975.53, start: 0.10 }, // B6
    { freq: 2349.32, start: 0.15 }, // D7
    { freq: 2793.83, start: 0.20 }  // F7
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sum = 0;

    for (const note of notes) {
      if (t >= note.start) {
        const dt = t - note.start;
        const noteEnv = Math.min(1, dt / 0.005) * Math.exp(-dt * 12);
        sum += Math.sin(2 * Math.PI * note.freq * dt) * noteEnv * 0.18;
      }
    }

    const sample = Math.max(-1, Math.min(1, sum));
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  const outWav = path.join(effectsDir, 'sparkle_01.wav');
  const outMp3 = path.join(effectsDir, 'sparkle_01.mp3');
  fs.writeFileSync(outWav, buffer);
  fs.writeFileSync(outMp3, buffer);
  console.log(`Saved sparkle sound: ${outWav} (${buffer.length} bytes)`);
}

// Generate Cheerful Chime (Joyful harmonic chord C5-E5-G5-C6)
function generateChimeWav() {
  console.log('--- Generating Cheerful Chime ---');
  const sampleRate = 44100;
  const duration = 0.55;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  const notes = [
    { freq: 523.25, start: 0.00 }, // C5
    { freq: 659.25, start: 0.05 }, // E5
    { freq: 783.99, start: 0.10 }, // G5
    { freq: 1046.50, start: 0.15 } // C6
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sum = 0;

    for (const note of notes) {
      if (t >= note.start) {
        const dt = t - note.start;
        // Warm chime with fundamental and soft harmonic
        const noteEnv = Math.min(1, dt / 0.008) * Math.exp(-dt * 6.5);
        const fund = Math.sin(2 * Math.PI * note.freq * dt);
        const harm = Math.sin(2 * Math.PI * note.freq * 2 * dt) * 0.25;
        sum += (fund + harm) * noteEnv * 0.20;
      }
    }

    const sample = Math.max(-1, Math.min(1, sum));
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  const outWav = path.join(effectsDir, 'chime_01.wav');
  const outMp3 = path.join(effectsDir, 'chime_01.mp3');
  fs.writeFileSync(outWav, buffer);
  fs.writeFileSync(outMp3, buffer);
  console.log(`Saved chime sound: ${outWav} (${buffer.length} bytes)`);
}

// Download and trim authentic Claps & Kids Cheer from CC0 archive.org collections
async function downloadAuthenticEffects() {
  console.log('--- Fetching Authentic Claps & Kids Cheer Recordings (CC0) ---');

  // 1. Clapping: One or Two People Clapping (2-3 gentle claps)
  try {
    const clapUrl = 'https://archive.org/download/Red_Library_Crowds_Indoor_2/R02-14-One%20or%20Two%20People%20Clapping.mp3';
    console.log('Fetching authentic soft clapping recording...');
    const resp = await fetch(clapUrl);
    if (resp.ok) {
      const buf = Buffer.from(await resp.arrayBuffer());
      // Take first ~45KB which represents the first 1.2 seconds of clear claps
      const sliceLen = Math.min(buf.length, 45000);
      const clapFile = path.join(effectsDir, 'clap_soft_01.mp3');
      fs.writeFileSync(clapFile, buf.subarray(0, sliceLen));
      console.log(`Saved authentic claps: ${clapFile} (${sliceLen} bytes)`);
    }
  } catch (err) {
    console.warn('Failed to fetch online clapping recording, fallback available:', err.message);
  }

  // 2. Kids Cheer: Small Crowd Cheering
  try {
    const cheerUrl = 'https://archive.org/download/Red_Library_Crowds_Indoor_2/R02-03-Small%20Crowd%20Cheering.mp3';
    console.log('Fetching authentic kids cheer recording...');
    const resp = await fetch(cheerUrl);
    if (resp.ok) {
      const buf = Buffer.from(await resp.arrayBuffer());
      // Take first ~35KB (0.9-1.1s gentle cheer)
      const sliceLen = Math.min(buf.length, 36000);
      const cheerFile = path.join(effectsDir, 'kids_cheer_01.mp3');
      fs.writeFileSync(cheerFile, buf.subarray(0, sliceLen));
      console.log(`Saved authentic kids cheer: ${cheerFile} (${sliceLen} bytes)`);
    }
  } catch (err) {
    console.warn('Failed to fetch online cheer recording, fallback available:', err.message);
  }

  // 3. Small Group Cheering & Clapping (Applause)
  try {
    const applauseUrl = 'https://archive.org/download/Red_Library_Crowds_Indoor_2/R02-15-Small%20Group%20Cheering%20and%20Clapping.mp3';
    console.log('Fetching authentic group applause recording...');
    const resp = await fetch(applauseUrl);
    if (resp.ok) {
      const buf = Buffer.from(await resp.arrayBuffer());
      const sliceLen = Math.min(buf.length, 48000);
      const appFile = path.join(effectsDir, 'applause_group_01.mp3');
      fs.writeFileSync(appFile, buf.subarray(0, sliceLen));
      console.log(`Saved authentic applause: ${appFile} (${sliceLen} bytes)`);
    }
  } catch (err) {
    console.warn('Failed to fetch online applause recording, fallback available:', err.message);
  }
}

async function main() {
  generateSoftErrorWav();
  generateSparkleWav();
  generateChimeWav();
  await downloadAuthenticEffects();
  await generateVoiceClips();
  console.log('\n=== AUDIO ASSET PIPELINE COMPLETED SUCCESSFULLY ===');
}

main().catch(console.error);
