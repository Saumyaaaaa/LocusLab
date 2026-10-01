const { spawn } = require('child_process');
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

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-cdp-'));
  const port = 9333;
  const chromeProc = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpProfile}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    // Wait for Chrome CDP to be available
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (_) {}
    }

    if (!versionData) {
      throw new Error('Chrome CDP port not responding');
    }

    console.log('Connected to Chrome CDP:', versionData.Browser);

    // Get list of targets
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const targets = await listRes.json();
    const target = targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    function send(method, params = {}) {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      const outPath = path.join(OUT_DIR, s.file);
      const freeWalkParam = s.mode === 'freewalk' ? '&freewalk=1' : '';
      const url = `http://localhost:5173/?tour=${s.locusId}${freeWalkParam}`;

      // Set viewport
      await send('Emulation.setDeviceMetricsOverride', {
        width: s.w,
        height: s.h,
        deviceScaleFactor: 1,
        mobile: s.w < 600,
      });

      // Navigate
      await send('Page.navigate', { url });

      // Poll until 3D scene is loaded and floating label exists
      let ready = false;
      const startPoll = Date.now();
      while (Date.now() - startPoll < 15000) {
        await sleep(300);
        const evalRes = await send('Runtime.evaluate', {
          expression: `Boolean(
            document.querySelector('[data-testid="active-locus-floating-label"]') &&
            !document.body.innerText.includes('Loading 3D Memory Palace...')
          )`,
          returnByValue: true,
        });

        if (evalRes && evalRes.result && evalRes.result.value === true) {
          ready = true;
          break;
        }
      }

      // Small extra pause for smooth frame settle
      await sleep(400);

      // Capture screenshot
      const ssRes = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(outPath, Buffer.from(ssRes.data, 'base64'));
      const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
      console.log(`[${i + 1}/${scenarios.length}] (${ready ? 'READY' : 'TIMEOUT'}) Saved ${s.file} (${kb} KB)`);
    }

    ws.close();
  } finally {
    try {
      chromeProc.kill();
    } catch (_) {}
    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch (_) {}
  }
}

main().catch((err) => {
  console.error('Fatal error in capture_with_cdp:', err);
  process.exit(1);
});
