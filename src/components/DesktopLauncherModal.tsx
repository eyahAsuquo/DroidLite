import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode,
  X,
} from 'lucide-react';
import { DEVICE_PROFILES } from '../data/devices';
import { DeviceId, DeviceProfile, SimulatorConfig } from '../types/simulator';

interface DesktopLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulatorConfig;
  device: DeviceProfile;
  onUpdateConfig: (partial: Partial<SimulatorConfig>) => void;
  onDownloadBridgeScript: () => void;
}

export const DesktopLauncherModal: React.FC<DesktopLauncherModalProps> = ({
  isOpen,
  onClose,
  config,
  device,
  onUpdateConfig,
}) => {
  const [selectedOs, setSelectedOs] = useState<'windows' | 'unix'>('windows');
  const [flutterPort, setFlutterPort] = useState<string>(config.flutterWebPort || '5050');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  // Map our 5 Android phones to compact desktop pixel dimensions that fit cleanly on a 1080p laptop screen
  const getInitialDims = (devId: DeviceId) => {
    switch (devId) {
      case 'galaxy-s24-ultra':
        return { name: 'Galaxy S24 Ultra', w: 384, h: 785, br: 14, sr: 8, color: '#27272A' };
      case 'pixel-7a':
        return { name: 'Pixel 7a', w: 364, h: 750, br: 36, sr: 28, color: '#334155' };
      case 'redmi-note-13':
        return { name: 'Redmi Note 13', w: 340, h: 715, br: 30, sr: 22, color: '#18181B' };
      case 'pixel-fold':
        return { name: 'Pixel Fold', w: 590, h: 500, br: 28, sr: 20, color: '#1E293B' };
      case 'pixel-8-pro':
      default:
        return { name: 'Pixel 8 Pro', w: 382, h: 790, br: 42, sr: 32, color: '#1E293B' };
    }
  };

  const initDim = getInitialDims(device.id);

  // Reverted to the clean centered phone layout with:
  // 1. Transparent outer background (not white or dark)
  // 2. Hideable right-hand sidebar (with a 'Hide' button on the sidebar + tiny '‹' restore tab on the phone edge)
  // 3. 5 built-in Android phone screen sizes selectable from the sidebar OR by clicking the top status bar
  const generateStandaloneLocalHtml = (port: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>DroidLite - ${initDim.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  html, body {
    background: transparent !important;
    background-color: transparent !important;
    color: #F1F5F9;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .shell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 4px;
    background: transparent !important;
    position: relative;
  }
  .chassis-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .chassis {
    width: ${initDim.w}px;
    height: ${initDim.h}px;
    background: ${initDim.color};
    border-radius: ${initDim.br}px;
    padding: 10px;
    border: 2px solid #475569;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: width 0.2s ease, height 0.2s ease, border-radius 0.2s ease;
  }
  .screen {
    flex: 1;
    background: #090D14;
    border-radius: ${initDim.sr}px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    border: 1px solid #000;
  }
  .punch-hole {
    width: 11px;
    height: 11px;
    background: #000;
    border-radius: 50%;
    position: absolute;
    top: 7px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    border: 1px solid #1E293B;
    pointer-events: none;
  }
  .status-bar {
    height: 26px;
    background: #090D14;
    color: #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    font-size: 11px;
    font-family: Consolas, monospace;
    z-index: 20;
    border-bottom: 1px solid #1E293B;
    flex-shrink: 0;
    cursor: pointer;
  }
  .viewport {
    flex: 1;
    position: relative;
    background: transparent;
    display: flex;
    flex-direction: column;
  }
  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    background: transparent;
    flex: 1;
  }
  .drawer {
    position: absolute;
    inset: 0;
    background: rgba(11, 15, 23, 0.96);
    z-index: 28;
    display: none;
    flex-direction: column;
    padding: 16px;
    gap: 8px;
  }
  .drawer.open { display: flex; }
  .drawer h4 {
    font-size: 12px;
    color: #38BDF8;
    border-bottom: 1px solid #1E293B;
    padding-bottom: 5px;
    margin-bottom: 2px;
  }
  .dev-btn {
    width: 100%;
    text-align: left;
    padding: 8px 10px;
    border-radius: 8px;
    background: #111827;
    border: 1px solid #1E293B;
    color: #E2E8F0;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dev-btn:hover { background: #1E293B; border-color: #38BDF8; color: #fff; }
  .url-row { display: flex; gap: 6px; }
  .url-row input {
    flex: 1;
    background: #090D14;
    border: 1px solid #334155;
    color: #38BDF8;
    padding: 6px 8px;
    border-radius: 6px;
    font-family: Consolas, monospace;
    font-size: 11px;
  }
  .url-row button {
    background: #2563EB;
    color: #fff;
    border: 0;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }
  .nav-bar {
    height: 36px;
    background: #05070B;
    border-top: 1px solid #1E293B;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
    z-index: 20;
    flex-shrink: 0;
  }
  .nav-btn {
    background: transparent;
    border: none;
    color: #94A3B8;
    font-size: 13px;
    cursor: pointer;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-btn:hover { color: #fff; }
  .side-rail {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: rgba(17, 24, 39, 0.92);
    border: 1px solid #334155;
    padding: 7px 4px;
    border-radius: 14px;
    align-items: center;
  }
  .side-rail.hidden {
    display: none !important;
  }
  .rail-btn {
    width: 30px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: #1E293B;
    color: #CBD5E1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
  }
  .rail-btn:hover { background: #2563EB; color: #fff; }
  .rail-btn.hide-btn { background: transparent; color: #94A3B8; height: 22px; font-size: 8px; }
  .rail-btn.hide-btn:hover { background: #1E293B; color: #fff; }
  .rail-btn.primary { background: rgba(37,99,235,0.28); color: #38BDF8; border-color: rgba(59,130,246,0.45); }
  .rail-btn.danger { background: rgba(225,29,72,0.22); color: #FDA4AF; border-color: rgba(225,29,72,0.35); }
  .rail-btn.danger:hover { background: #E11D48; color: #fff; }
  .restore-tab {
    display: none;
    width: 14px;
    height: 44px;
    background: rgba(17, 24, 39, 0.85);
    border: 1px solid #334155;
    border-left: 0;
    border-radius: 0 8px 8px 0;
    color: #94A3B8;
    font-size: 11px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    margin-left: -2px;
  }
  .restore-tab:hover { color: #fff; background: #2563EB; }
  .restore-tab.visible { display: flex; }
  .lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(9, 13, 20, 0.96);
    z-index: 25;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }
  .lock-overlay.active { display: flex; }
</style>
</head>
<body>
  <div class="shell">
    <div class="chassis-wrap">
      <div id="chassis" class="chassis">
        <div id="screen" class="screen">
          <div class="punch-hole"></div>
          <div class="status-bar" onclick="toggleDrawer()" title="Click to switch Android phone size or show/hide sidebar">
            <span id="clock">09:30</span>
            <span id="devLabel">${initDim.name} &#9662;</span>
          </div>
          <div class="viewport">
            <iframe id="appFrame" src="http://localhost:${port}" allow="accelerometer; geolocation; microphone; camera; clipboard-read; clipboard-write"></iframe>

            <!-- 5-Device Android Screen Size Switcher -->
            <div id="drawer" class="drawer">
              <h4>Choose Android Phone Screen Size (5 Models)</h4>
              <button class="dev-btn" onclick="setDevice('Pixel 8 Pro', 382, 790, 42, 32, '#1E293B')">
                <span><strong>1. Google Pixel 8 Pro</strong> (6.7" Flagship)</span>
                <span>412 x 892 dp</span>
              </button>
              <button class="dev-btn" onclick="setDevice('Galaxy S24 Ultra', 384, 785, 14, 8, '#27272A')">
                <span><strong>2. Samsung Galaxy S24 Ultra</strong> (Squared)</span>
                <span>412 x 880 dp</span>
              </button>
              <button class="dev-btn" onclick="setDevice('Pixel 7a', 364, 750, 36, 28, '#334155')">
                <span><strong>3. Google Pixel 7a</strong> (6.1" Compact)</span>
                <span>393 x 830 dp</span>
              </button>
              <button class="dev-btn" onclick="setDevice('Redmi Note 13', 340, 715, 30, 22, '#18181B')">
                <span><strong>4. Xiaomi Redmi Note 13</strong> (Small Test)</span>
                <span>360 x 780 dp</span>
              </button>
              <button class="dev-btn" onclick="setDevice('Pixel Fold', 590, 500, 28, 20, '#1E293B')">
                <span><strong>5. Google Pixel Fold</strong> (Unfolded)</span>
                <span>674 x 562 dp</span>
              </button>

              <h4 style="margin-top:4px;">Flutter Dev Server URL</h4>
              <div class="url-row">
                <input id="urlInput" type="text" value="http://localhost:${port}" />
                <button onclick="connectUrl()">Connect</button>
              </div>

              <button id="toggleRailDrawerBtn" onclick="toggleRail()" style="padding:7px;border-radius:8px;background:#1E293B;color:#38BDF8;border:1px solid #334155;cursor:pointer;font-size:11px;font-weight:600;">
                Hide / Show Right Sidebar
              </button>

              <button onclick="toggleDrawer()" style="margin-top:auto;padding:8px;border-radius:8px;background:#2563EB;color:#fff;border:0;cursor:pointer;font-size:11px;font-weight:600;">
                Done
              </button>
            </div>

            <div id="lockOverlay" class="lock-overlay" onclick="toggleLock()">
              <div style="font-size:40px;font-weight:700;font-family:monospace;" id="lockClock">09:30</div>
              <div style="font-size:11px;color:#94A3B8;">Screen Locked - Click to Wake</div>
            </div>
          </div>
          <div class="nav-bar">
            <button class="nav-btn" title="Back" onclick="connectUrl()">&#9664;</button>
            <button class="nav-btn" title="Switch Phone Size / Settings" onclick="toggleDrawer()">&#9679;</button>
            <button class="nav-btn" title="Reload" onclick="connectUrl()">&#9632;</button>
          </div>
        </div>
      </div>

      <!-- Subtle edge tab to restore right sidebar when hidden -->
      <button id="restoreTab" class="restore-tab" title="Show Right Sidebar" onclick="toggleRail(true)">&#8249;</button>
    </div>

    <!-- Hideable Right-Hand Sidebar -->
    <div id="sideRail" class="side-rail">
      <button class="rail-btn hide-btn" title="Hide Right Sidebar" onclick="toggleRail(false)">Hide</button>
      <button class="rail-btn primary" title="Switch Phone Size (5 Android Phones)" onclick="toggleDrawer()">Size</button>
      <button class="rail-btn" title="Reload Flutter App" onclick="connectUrl()">Rld</button>
      <button class="rail-btn" title="Rotate Portrait / Landscape" onclick="toggleRotate()">Rot</button>
      <button class="rail-btn" title="Power / Lock Screen" onclick="toggleLock()">Pwr</button>
      <button class="rail-btn danger" title="Close Phone Emulator" onclick="window.close()">&#10005;</button>
    </div>
  </div>
<script>
  var frame = document.getElementById('appFrame');
  var urlInput = document.getElementById('urlInput');
  var chassis = document.getElementById('chassis');
  var screen = document.getElementById('screen');
  var sideRail = document.getElementById('sideRail');
  var restoreTab = document.getElementById('restoreTab');
  var drawer = document.getElementById('drawer');
  var isLandscape = false;
  var railVisible = true;
  var curW = ${initDim.w}, curH = ${initDim.h};

  function syncWindowSize() {
    var w = isLandscape ? curH : curW;
    var h = isLandscape ? curW : curH;
    chassis.style.width = w + 'px';
    chassis.style.height = h + 'px';
    var extraW = railVisible ? 70 : 28;
    try { window.resizeTo(w + extraW, h + 58); } catch(e) {}
  }

  function setDevice(name, w, h, br, sr, color) {
    curW = w; curH = h; isLandscape = false;
    chassis.style.borderRadius = br + 'px';
    chassis.style.background = color;
    screen.style.borderRadius = sr + 'px';
    document.getElementById('devLabel').innerHTML = name + ' &#9662;';
    document.title = 'DroidLite - ' + name;
    drawer.classList.remove('open');
    syncWindowSize();
  }

  function toggleRotate() {
    isLandscape = !isLandscape;
    syncWindowSize();
  }

  function toggleRail(forceState) {
    railVisible = (typeof forceState === 'boolean') ? forceState : !railVisible;
    if (railVisible) {
      sideRail.classList.remove('hidden');
      restoreTab.classList.remove('visible');
    } else {
      sideRail.classList.add('hidden');
      restoreTab.classList.add('visible');
    }
    drawer.classList.remove('open');
    syncWindowSize();
  }

  function toggleDrawer() { drawer.classList.toggle('open'); }
  function connectUrl() { frame.src = urlInput.value; drawer.classList.remove('open'); }
  function toggleLock() { document.getElementById('lockOverlay').classList.toggle('active'); }

  function updateClock() {
    var d = new Date();
    var t = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    document.getElementById('clock').textContent = t;
    document.getElementById('lockClock').textContent = t;
  }
  updateClock(); setInterval(updateClock, 10000);
</script>
</body>
</html>`;

  const htmlRaw = generateStandaloneLocalHtml(flutterPort);
  const base64Html =
    typeof window !== 'undefined'
      ? window.btoa(unescape(encodeURIComponent(htmlRaw)))
      : '';
  const base64Lines = base64Html.match(/.{1,76}/g) || [];
  const batchEchoLines = base64Lines
    .map((line, idx) => `echo ${line}${idx === 0 ? '> "%B64_FILE%"' : '>> "%B64_FILE%"'}`)
    .join('\r\n');

  // Reverted to the clean previous Windows .bat launcher (with --test-type so no security warning banner appears)
  const windowsBatScript = `@echo off
title DroidLite Multi-Device Phone Emulator
color 0B

echo ===============================================================================
echo   DroidLite Studio - Multi-Device Android Phone Emulator (5 Phone Sizes)
echo   Default Phone: ${device.manufacturer} ${device.name} (${device.widthDp}x${device.heightDp} dp)
echo ===============================================================================
echo.
echo   [1] Launch Phone Window + Auto-Start Flutter App (Port ${flutterPort})
echo   [2] Mirror Real USB Android Phone via Borderless Scrcpy (0%% PC CPU)
echo   [3] Open Phone Window Only (If Flutter is already running in VS Code)
echo.
set "choice=1"
set /p choice="Type 1, 2, or 3 and press Enter (Default=1): "

if "%choice%"=="2" goto SCRCPY_MODE
if "%choice%"=="3" goto WINDOW_ONLY
goto FLUTTER_MODE

:BUILD_PHONE_UI
set "B64_FILE=%TEMP%\\droidlite_ui.b64"
set "HTML_FILE=%TEMP%\\droidlite_phone.html"
set "PROFILE_DIR=%TEMP%\\DroidLitePhoneProfile"
${batchEchoLines}
certutil -f -decode "%B64_FILE%" "%HTML_FILE%" >nul 2>&1
echo [DroidLite] Opening Standalone Phone (${device.name})...
start "" msedge --user-data-dir="%PROFILE_DIR%" --disable-web-security --test-type --allow-file-access-from-files --window-size=${initDim.w + 70},${initDim.h + 58} --app="file:///%HTML_FILE%" 2>nul
if errorlevel 1 start "" chrome --user-data-dir="%PROFILE_DIR%" --disable-web-security --test-type --allow-file-access-from-files --window-size=${initDim.w + 70},${initDim.h + 58} --app="file:///%HTML_FILE%" 2>nul
exit /b

:FLUTTER_MODE
echo.
call :BUILD_PHONE_UI
echo.
if exist "pubspec.yaml" goto RUN_FLUTTER_HERE
for /d %%D in (*) do (
  if exist "%%D\\pubspec.yaml" (
    echo [DroidLite] Found Flutter project in subfolder: %%D
    cd /d "%%D"
    goto RUN_FLUTTER_HERE
  )
)
goto NO_PUBSPEC

:RUN_FLUTTER_HERE
echo [DroidLite] Starting Flutter in %CD% on port ${flutterPort}...
echo [DroidLite] Click 'Hide' on the right sidebar to hide it, or 'Size' to switch phones!
echo.
call flutter run -d web-server --web-port=${flutterPort}
echo.
pause
exit /b

:NO_PUBSPEC
echo [!] pubspec.yaml was not found in %CD%
echo     The Phone Emulator is open! Run this in VS Code terminal:
echo       flutter run -d web-server --web-port=${flutterPort}
echo.
pause
exit /b

:WINDOW_ONLY
echo.
call :BUILD_PHONE_UI
echo.
echo [DroidLite] Phone Emulator opened!
echo             - Click 'Hide' on the right sidebar to hide the sidebar completely
echo             - Click the top status bar ('${initDim.name}') or 'Size' to switch between 5 phones
echo.
pause
exit /b

:SCRCPY_MODE
echo.
where scrcpy >nul 2>&1
if errorlevel 1 goto INSTALL_SCRCPY
echo [DroidLite] Launching Borderless Scrcpy Physical Mirror...
scrcpy --window-borderless --max-size=1024 --video-bit-rate=4M --max-fps=60 --stay-awake --always-on-top
echo.
pause
exit /b

:INSTALL_SCRCPY
echo [!] Installing Scrcpy via Windows Winget...
winget install Genymobile.scrcpy
echo.
pause
exit /b
`;

  const unixShScript = `#!/usr/bin/env bash
PORT="${flutterPort}"
PHONE_HTML="/tmp/droidlite-local-phone.html"
PROFILE_DIR="/tmp/DroidLitePhoneProfile"

cat << 'EOF' > "$PHONE_HTML"
${htmlRaw}
EOF

if command -v google-chrome >/dev/null 2>&1; then
  google-chrome --user-data-dir="$PROFILE_DIR" --disable-web-security --test-type --window-size=${initDim.w + 70},${initDim.h + 58} --app="file://$PHONE_HTML" >/dev/null 2>&1 &
elif [ -d "/Applications/Google Chrome.app" ]; then
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --user-data-dir="$PROFILE_DIR" --disable-web-security --test-type --window-size=${initDim.w + 70},${initDim.h + 58} --app="file://$PHONE_HTML" >/dev/null 2>&1 &
else
  open "$PHONE_HTML" 2>/dev/null || xdg-open "$PHONE_HTML" 2>/dev/null
fi

flutter run -d web-server --web-port="$PORT"
`;

  const activeScriptContent = selectedOs === 'windows' ? windowsBatScript : unixShScript;
  const activeFilename =
    selectedOs === 'windows' ? 'DroidLite-Flutter-Emulator.bat' : 'droidlite-emulator.sh';

  const handleDownloadLauncher = () => {
    const blob = new Blob([activeScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStandaloneHtml = () => {
    const blob = new Blob([htmlRaw], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DroidLite-Phone-Emulator.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(activeScriptContent);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-slate-700/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              Multi-Device Phone Launcher (Transparent Background + Hideable Sidebar)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reverted to the clean phone launcher with 5 Android screen sizes, transparent background, and a hideable right sidebar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Explanation of updates */}
          <div className="p-3.5 rounded-xl bg-emerald-950/35 border border-emerald-500/35 text-xs space-y-1.5">
            <div className="font-semibold text-emerald-300">
              Reverted &amp; Updated with Hideable Right Sidebar + Transparent Background:
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 leading-relaxed">
              <li>
                <strong>Reverted to the clean launcher</strong> (with `--test-type` so the gray security warning banner never shows).
              </li>
              <li>
                <strong>Hideable Right Sidebar</strong>: Click **`Hide`** at the top of the right-hand sidebar to hide it completely. You can bring it back anytime by clicking the tiny **`‹`** tab on the right edge of the phone or by clicking the phone&apos;s top status bar (**`Pixel 8 Pro ▾`**).
              </li>
              <li>
                <strong>Transparent Background</strong>: Both the standalone web view and the generated `.html` / `.bat` phone emulator use `background: transparent` instead of dark `#0B0F17` or white.
              </li>
            </ul>
          </div>

          {/* Choose Default Android Phone Size (5 Models) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white">
              Default Android Phone Screen Size (Switchable Anytime via Status Bar or `Size` Button)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {DEVICE_PROFILES.map((d) => {
                const isSelected = d.id === config.deviceId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onUpdateConfig({ deviceId: d.id as DeviceId })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-sky-400 text-white'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{d.name.split('(')[0]}</div>
                    <div className="text-[10px] font-mono text-sky-400 mt-0.5">
                      {d.widthDp}×{d.heightDp} dp
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {d.manufacturer}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Download Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadLauncher}
              className="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-left text-white transition-colors cursor-pointer shadow-md space-y-1"
            >
              <div className="flex items-center gap-2 font-semibold text-xs">
                <Download className="w-4 h-4 shrink-0" />
                <span>Download `.bat` Phone Launcher</span>
              </div>
              <p className="text-[11px] text-blue-100 leading-snug">
                Clean multi-device launcher with hideable right sidebar, transparent background, and zero warning banners.
              </p>
            </button>

            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-slate-100 transition-colors cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-sky-300">
                <FileCode className="w-4 h-4 shrink-0" />
                <span>Download Standalone `.html`</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Standalone HTML with transparent background, hideable right sidebar, and 5 Android phone sizes.
              </p>
            </button>
          </div>

          {/* Script Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">{activeFilename}</span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="text-sky-400 hover:underline flex items-center gap-1 text-xs"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-36 leading-relaxed">
              {activeScriptContent}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#0B0F17] border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
