import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'public', 'audio', 'praise');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const clips = [
  { id: 'ahsant_01', text: 'أَحْسَنْتَ!' },
  { id: 'ahsant_02', text: 'أَحْسَنْتَ يَا بَطَل!' },
  { id: 'rae_01', text: 'رَائِع!' },
  { id: 'rae_02', text: 'عَمَلٌ رَائِع!' },
  { id: 'mumtaz_01', text: 'مُمْتَاز!' },
  { id: 'mumtaz_02', text: 'إِجَابَةٌ مُمْتَازَة!' },
  { id: 'mubde_01', text: 'مُبْدِع!' },
  { id: 'anta_batal_01', text: 'أَنْتَ بَطَل!' },
  { id: 'istamir_01', text: 'اسْتَمِرّ!' },
  { id: 'bravo_01', text: 'بْرَافُو!' },
  { id: 'shater_01', text: 'شَاطِر!' },
  { id: 'jameel_01', text: 'جَمِيلٌ جِدًّا!' }
];

async function downloadClip(clip) {
  const filePath = path.join(outputDir, `${clip.id}.mp3`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
    console.log(`[SKIP] ${clip.id} already exists (${fs.statSync(filePath).size} bytes)`);
    return;
  }

  const encoded = encodeURIComponent(clip.text);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encoded}`;
  
  console.log(`[FETCH] Generating ${clip.id} ("${clip.text}")...`);
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch ${clip.id}: status ${resp.status}`);
  }

  const arrayBuffer = await resp.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);
  console.log(`[SAVED] ${clip.id}.mp3 (${buffer.length} bytes)`);
}

async function main() {
  console.log('Generating praise audio clips in:', outputDir);
  for (const clip of clips) {
    try {
      await downloadClip(clip);
      // Small polite delay between requests
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error(`Error for ${clip.id}:`, err);
    }
  }
  console.log('Finished generating praise audio library!');
}

main();
