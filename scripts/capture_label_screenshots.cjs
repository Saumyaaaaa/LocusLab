const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'label-screenshots');
const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

const scenarios = [
  // Locus 4: Lounge Sofa
  { locusId: 4, mode: 'guided', w: 390, h: 844, file: 'locus-04-guided-390x844.png' },
  { locusId: 4, mode: 'guided', w: 1366, h: 768, file: 'locus-04-guided-1366x768.png' },
  { locusId: 4, mode: 'guided', w: 844, h: 390, file: 'locus-04-guided-844x390.png' },
  { locusId: 4, mode: 'freewalk', w: 390, h: 844, file: 'locus-04-freewalk-390x844.png' },
  { locusId: 4, mode: 'freewalk', w: 1366, h: 768, file: 'locus-04-freewalk-1366x768.png' },
  { locusId: 4, mode: 'freewalk', w: 844, h: 390, file: 'locus-04-freewalk-844x390.png' },

  // Locus 11: Cooking Stove
  { locusId: 11, mode: 'guided', w: 390, h: 844, file: 'locus-11-guided-390x844.png' },
  { locusId: 11, mode: 'guided', w: 1366, h: 768, file: 'locus-11-guided-1366x768.png' },
  { locusId: 11, mode: 'guided', w: 844, h: 390, file: 'locus-11-guided-844x390.png' },
  { locusId: 11, mode: 'freewalk', w: 390, h: 844, file: 'locus-11-freewalk-390x844.png' },
  { locusId: 11, mode: 'freewalk', w: 1366, h: 768, file: 'locus-11-freewalk-1366x768.png' },
  { locusId: 11, mode: 'freewalk', w: 844, h: 390, file: 'locus-11-freewalk-844x390.png' },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

let successCount = 0;

const sharedProfile = path.join(os.tmpdir(), 'chrome-locus-label-profile');
try {
  fs.mkdirSync(sharedProfile, { recursive: true });
} catch (_) {}

for (let i = 0; i < scenarios.length; i++) {
  const s = scenarios[i];
  const outPath = path.join(OUT_DIR, s.file);
  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }

  const freeWalkParam = s.mode === 'freewalk' ? '&freewalk=1' : '';
  const url = `http://localhost:5173/?tour=${s.locusId}${freeWalkParam}`;
  const cmd = `"${CHROME}" --headless=new --user-data-dir="${sharedProfile}" --screenshot="${outPath}" --virtual-time-budget=8000 --run-all-compositor-stages-before-draw --window-size=${s.w},${s.h} "${url}"`;

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 35000 });
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
      console.log(`[${i + 1}/${scenarios.length}] Captured ${s.file} (${kb} KB)`);
      successCount++;
    } else {
      console.error(`[${i + 1}/${scenarios.length}] Failed to create ${s.file}`);
    }
  } catch (err) {
    console.error(`[${i + 1}/${scenarios.length}] Error on ${s.file}:`, err.message);
  }
}

console.log(`\nSuccessfully captured ${successCount}/${scenarios.length} label screenshots in ${OUT_DIR}`);
process.exit(successCount === scenarios.length ? 0 : 1);
