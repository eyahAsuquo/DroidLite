import { DeviceProfile, WidgetNode } from '../types/simulator';

export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    id: 'pixel-8-pro',
    name: 'Pixel 8 Pro',
    manufacturer: 'Google',
    androidVersion: 'Android 14',
    apiLevel: 34,
    widthDp: 412,
    heightDp: 892,
    resolutionPx: '1344 × 2992',
    ppi: 489,
    aspectRatio: '20:9',
    bezelRadius: 46,
    screenRadius: 38,
    cutoutType: 'punch-center',
    frameColor: '#1E293B',
    ramProfile: '12 GB LPDDR5X',
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Galaxy S24 Ultra',
    manufacturer: 'Samsung',
    androidVersion: 'Android 14 (One UI 6.1)',
    apiLevel: 34,
    widthDp: 412,
    heightDp: 880,
    resolutionPx: '1440 × 3120',
    ppi: 505,
    aspectRatio: '19.5:9',
    bezelRadius: 16,
    screenRadius: 10,
    cutoutType: 'punch-small',
    frameColor: '#27272A',
    ramProfile: '12 GB LPDDR5X',
  },
  {
    id: 'pixel-7a',
    name: 'Pixel 7a (Compact)',
    manufacturer: 'Google',
    androidVersion: 'Android 14',
    apiLevel: 34,
    widthDp: 393,
    heightDp: 830,
    resolutionPx: '1080 × 2400',
    ppi: 429,
    aspectRatio: '20:9',
    bezelRadius: 42,
    screenRadius: 34,
    cutoutType: 'punch-center',
    frameColor: '#334155',
    ramProfile: '8 GB LPDDR5',
  },
  {
    id: 'redmi-note-13',
    name: 'Redmi Note 13 (Small 360dp)',
    manufacturer: 'Xiaomi',
    androidVersion: 'Android 13',
    apiLevel: 33,
    widthDp: 360,
    heightDp: 780,
    resolutionPx: '1080 × 2400',
    ppi: 395,
    aspectRatio: '20:9',
    bezelRadius: 34,
    screenRadius: 26,
    cutoutType: 'punch-small',
    frameColor: '#18181B',
    ramProfile: '6 GB LPDDR4X',
  },
  {
    id: 'pixel-fold',
    name: 'Pixel Fold (Unfolded)',
    manufacturer: 'Google',
    androidVersion: 'Android 14L',
    apiLevel: 34,
    widthDp: 674,
    heightDp: 562,
    resolutionPx: '2208 × 1840',
    ppi: 380,
    aspectRatio: '6:5',
    bezelRadius: 32,
    screenRadius: 24,
    cutoutType: 'fold-crease',
    frameColor: '#1E293B',
    ramProfile: '12 GB LPDDR5',
  },
];

export const GPS_PRESETS = [
  { name: 'Mountain View, US (Googleplex)', lat: 37.4221, lng: -122.0841 },
  { name: 'Lagos, NG (Victoria Island)', lat: 6.4281, lng: 3.4219 },
  { name: 'London, UK (Shoreditch)', lat: 51.5245, lng: -0.0789 },
  { name: 'Berlin, DE (Mitte)', lat: 52.52, lng: 13.405 },
  { name: 'Tokyo, JP (Shibuya)', lat: 35.658, lng: 139.7016 },
];

export const SAMPLE_WIDGET_TREE: WidgetNode = {
  id: 'w-root',
  name: 'MaterialApp',
  type: 'StatefulWidget',
  size: '412.0 × 892.0 dp',
  constraints: 'BoxConstraints(tight 412.0 × 892.0)',
  stateSummary: 'useMaterial3: true, debugShowCheckedModeBanner: false',
  children: [
    {
      id: 'w-scaffold',
      name: 'Scaffold',
      type: 'StatefulWidget',
      size: '412.0 × 892.0 dp',
      constraints: 'BoxConstraints(w=412.0, h=892.0)',
      padding: 'EdgeInsets.only(top: 32.0, bottom: 28.0)',
      children: [
        {
          id: 'w-appbar',
          name: 'SliverAppBar.medium',
          type: 'Sliver',
          size: '412.0 × 64.0 dp',
          constraints: 'SliverConstraints(axisDirection: down)',
          padding: 'EdgeInsets.symmetric(horizontal: 16.0)',
          stateSummary: 'pinned: true, scrolledUnderElevation: 2.0',
        },
        {
          id: 'w-body',
          name: 'RefreshIndicator → CustomScrollView',
          type: 'RenderObject',
          size: '412.0 × 716.0 dp',
          constraints: 'BoxConstraints(0.0<=w<=412.0, 0.0<=h<=716.0)',
          children: [
            {
              id: 'w-metrics-row',
              name: 'Row (Performance & State Cards)',
              type: 'RenderObject',
              size: '380.0 × 94.0 dp',
              constraints: 'BoxConstraints(0.0<=w<=380.0, 0.0<=h<=Infinity)',
              padding: 'EdgeInsets.all(16.0)',
              stateSummary: 'mainAxisAlignment: spaceBetween',
            },
            {
              id: 'w-list',
              name: 'SliverList (Task & API Items)',
              type: 'Sliver',
              size: '380.0 × 440.0 dp',
              constraints: 'SliverConstraints(crossAxisExtent: 412.0)',
              stateSummary: 'delegate: SliverChildBuilderDelegate(childCount: 6)',
            },
          ],
        },
        {
          id: 'w-fab',
          name: 'FloatingActionButton.extended',
          type: 'StatelessWidget',
          size: '148.0 × 56.0 dp',
          constraints: 'BoxConstraints(0.0<=w<=412.0, 0.0<=h<=892.0)',
          stateSummary: 'heroTag: "fab-increment", elevation: 3.0',
        },
        {
          id: 'w-navbar',
          name: 'NavigationBar (Material 3)',
          type: 'StatelessWidget',
          size: '412.0 × 80.0 dp',
          constraints: 'BoxConstraints(w=412.0, h=80.0)',
          stateSummary: 'selectedIndex: activeTab, indicatorColor: Color(0xff2563eb)',
        },
      ],
    },
  ],
};

export const LOCAL_BRIDGE_NODE_SCRIPT = `#!/usr/bin/env node
/**
 * DroidLite Studio — Local Companion Bridge (Zero-Dependency Node.js Script)
 * --------------------------------------------------------------------------
 * Why this exists:
 * Instead of running Android Studio's 4GB+ QEMU Emulator, run this 5MB script
 * on your PC:
 *   node droidlite-bridge.js
 *
 * It exposes a local bridge on http://127.0.0.1:4040 so DroidLite Studio can:
 * 1. List connected USB / Wi-Fi physical Android devices via 'adb devices'
 * 2. Capture live screenshots / screen stream or launch 'scrcpy' in a phone frame
 * 3. Forward taps, swipes, and hardware buttons ('adb shell input ...')
 * 4. Stream live 'adb logcat -s flutter' logs directly to the UI
 */

const http = require('http');
const { exec, spawn } = require('child_process');

const PORT = 4040;

function runCmd(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
        error: error ? error.message : null,
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, \`http://127.0.0.1:\${PORT}\`);

  if (url.pathname === '/status') {
    const adbRes = await runCmd('adb devices -l');
    const scrcpyRes = await runCmd('scrcpy --version');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      bridge: 'online',
      adbOutput: adbRes.stdout,
      scrcpyAvailable: scrcpyRes.ok,
      scrcpyVersion: scrcpyRes.stdout.split('\\n')[0] || null,
    }));
  }

  if (url.pathname === '/screenshot') {
    const child = spawn('adb', ['exec-out', 'screencap', '-p']);
    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
    child.stdout.pipe(res);
    return;
  }

  if (url.pathname === '/command' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { command } = JSON.parse(body || '{}');
        const allowedPrefixes = ['adb ', 'scrcpy', 'flutter '];
        if (!command || !allowedPrefixes.some((p) => command.startsWith(p))) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Only adb, scrcpy, and flutter commands are allowed.' }));
        }
        const result = await runCmd(command);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(\`[DroidLite Bridge] Listening on http://127.0.0.1:\${PORT}\`);
  console.log('Ready to bridge ADB, Scrcpy, and Flutter commands with ~15MB RAM overhead.');
});
`;
