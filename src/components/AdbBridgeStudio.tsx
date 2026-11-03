import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Laptop,
  Play,
  RefreshCw,
  Smartphone,
  Terminal,
  Usb,
  Wifi,
  Zap,
} from 'lucide-react';
import { LOCAL_BRIDGE_NODE_SCRIPT } from '../data/devices';
import { LogEntry } from '../types/simulator';

interface AdbBridgeStudioProps {
  usbDeviceName: string | null;
  onPairWebUsb: () => void;
  bridgeOnline: boolean;
  bridgeAdbDevices: string;
  onProbeBridge: () => void;
  onRunBridgeCommand: (cmd: string) => Promise<void>;
  onEmitLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

export const AdbBridgeStudio: React.FC<AdbBridgeStudioProps> = ({
  usbDeviceName,
  onPairWebUsb,
  bridgeOnline,
  bridgeAdbDevices,
  onProbeBridge,
  onRunBridgeCommand,
  onEmitLog,
}) => {
  // Scrcpy Builder State
  const [maxFps, setMaxFps] = useState<'30' | '60' | '120'>('60');
  const [bitrate, setBitrate] = useState<'2M' | '4M' | '8M' | '16M'>('4M');
  const [maxSize, setMaxSize] = useState<'800' | '1024' | '1440'>('1024');
  const [stayAwake, setStayAwake] = useState<boolean>(true);
  const [turnScreenOff, setTurnScreenOff] = useState<boolean>(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(true);
  const [borderless, setBorderless] = useState<boolean>(false);

  // Wireless ADB State
  const [deviceIp, setDeviceIp] = useState<string>('192.168.1.45');
  const [devicePort, setDevicePort] = useState<string>('5555');
  const [reversePort, setReversePort] = useState<string>('8080');
  const [deepLinkUri, setDeepLinkUri] = useState<string>('myapp://checkout/success');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrcpyCommand = [
    'scrcpy',
    `--max-size=${maxSize}`,
    `--video-bit-rate=${bitrate}`,
    `--max-fps=${maxFps}`,
    stayAwake ? '--stay-awake' : '',
    turnScreenOff ? '--turn-screen-off' : '',
    alwaysOnTop ? '--always-on-top' : '',
    borderless ? '--window-borderless' : '',
    '--window-title="DroidLite Hardware Mirror"',
  ]
    .filter(Boolean)
    .join(' ');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onEmitLog({
      level: 'info',
      tag: 'adb',
      message: `Copied command to clipboard: ${text}`,
    });
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadBridgeScript = () => {
    const blob = new Blob([LOCAL_BRIDGE_NODE_SCRIPT], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'droidlite-bridge.js';
    a.click();
    URL.revokeObjectURL(url);
    onEmitLog({
      level: 'info',
      tag: 'adb',
      message: 'Downloaded droidlite-bridge.js — Run `node droidlite-bridge.js` in terminal to enable local ADB execution.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Comparison / Why Zero-Lag Banner */}
      <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">
            Physical Android Hardware Bridge &amp; Zero-Lag Scrcpy Studio
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Android Studio’s AVD QEMU Emulator consumes 4.2 GB+ RAM and 40–90% CPU during Gradle builds.
            Offloading execution to a real phone over USB/Wi-Fi or using the local companion bridge cuts PC overhead to ~25 MB RAM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onPairWebUsb}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-100 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Usb className="w-3.5 h-3.5 text-sky-400" />
            <span>{usbDeviceName ? `Paired: ${usbDeviceName}` : 'Pair Phone (WebUSB)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBridgeScript}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download droidlite-bridge.js</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Scrcpy Zero-Lag Mirror Configurator */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                01. Zero-Lag Scrcpy Hardware Mirror Builder
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure hardware-decoded H.264 screen mirroring for your physical Android device.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">~35ms latency · 0% VM CPU</span>
          </div>

          {/* Parameter Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Max Resolution
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0B0F17] rounded-lg border border-slate-800">
                {(['800', '1024', '1440'] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setMaxSize(res)}
                    className={`py-1.5 rounded text-xs font-mono transition-colors ${
                      maxSize === res
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {res}p
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Frame Rate
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0B0F17] rounded-lg border border-slate-800">
                {(['30', '60', '120'] as const).map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => setMaxFps(fps)}
                    className={`py-1.5 rounded text-xs font-mono transition-colors ${
                      maxFps === fps
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fps}fps
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Video Bitrate
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#0B0F17] rounded-lg border border-slate-800">
                {(['2M', '4M', '8M', '16M'] as const).map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setBitrate(rate)}
                    className={`py-1.5 rounded text-xs font-mono transition-colors ${
                      bitrate === rate
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hardware Flags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setStayAwake(!stayAwake)}
              className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                stayAwake
                  ? 'bg-blue-500/15 border-blue-500/50 text-sky-300'
                  : 'bg-[#0B0F17] border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-medium">Stay Awake</div>
              <div className="text-[10px] font-mono opacity-75">--stay-awake</div>
            </button>

            <button
              type="button"
              onClick={() => setTurnScreenOff(!turnScreenOff)}
              className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                turnScreenOff
                  ? 'bg-blue-500/15 border-blue-500/50 text-sky-300'
                  : 'bg-[#0B0F17] border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-medium">Phone Screen Off</div>
              <div className="text-[10px] font-mono opacity-75">--turn-screen-off</div>
            </button>

            <button
              type="button"
              onClick={() => setAlwaysOnTop(!alwaysOnTop)}
              className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                alwaysOnTop
                  ? 'bg-blue-500/15 border-blue-500/50 text-sky-300'
                  : 'bg-[#0B0F17] border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-medium">Pin On Top</div>
              <div className="text-[10px] font-mono opacity-75">--always-on-top</div>
            </button>

            <button
              type="button"
              onClick={() => setBorderless(!borderless)}
              className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                borderless
                  ? 'bg-blue-500/15 border-blue-500/50 text-sky-300'
                  : 'bg-[#0B0F17] border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-medium">Borderless</div>
              <div className="text-[10px] font-mono opacity-75">--window-borderless</div>
            </button>
          </div>

          {/* Generated Command Box */}
          <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Generated Zero-Lag Mirror Command</span>
              <span className="font-mono text-[11px]">Windows / macOS / Linux</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-sky-300 break-all">{scrcpyCommand}</code>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy('scrcpy', scrcpyCommand)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                >
                  {copiedId === 'scrcpy' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRunBridgeCommand(scrcpyCommand)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Wireless ADB & Port Reverse */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                02. Wireless ADB &amp; Port Forwarding
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Debug over Wi-Fi and expose local PC APIs to your device.
              </p>
            </div>
            <button
              type="button"
              onClick={onProbeBridge}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Probe :4040</span>
            </button>
          </div>

          {/* Wireless IP Connect */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Wireless ADB Pairing (TCP/IP 5555)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={deviceIp}
                onChange={(e) => setDeviceIp(e.target.value)}
                placeholder="Phone Wi-Fi IP (e.g. 192.168.1.45)"
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-[#0B0F17] border border-slate-800 text-xs font-mono text-slate-100"
              />
              <input
                type="text"
                value={devicePort}
                onChange={(e) => setDevicePort(e.target.value)}
                className="w-20 px-2.5 py-1.5 rounded-lg bg-[#0B0F17] border border-slate-800 text-xs font-mono text-slate-100 text-center"
              />
            </div>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0B0F17] border border-slate-800">
              <code className="text-[11px] font-mono text-slate-300 truncate">
                adb tcpip {devicePort} &amp;&amp; adb connect {deviceIp}:{devicePort}
              </code>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'wifi-adb',
                    `adb tcpip ${devicePort} && adb connect ${deviceIp}:${devicePort}`
                  )
                }
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 shrink-0"
              >
                {copiedId === 'wifi-adb' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* ADB Reverse Port Forwarding */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Reverse Localhost Port (`adb reverse`)
            </label>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0B0F17] border border-slate-800">
              <code className="text-[11px] font-mono text-slate-300 truncate">
                adb reverse tcp:{reversePort} tcp:{reversePort}
              </code>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  value={reversePort}
                  onChange={(e) => setReversePort(e.target.value)}
                  className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-center text-sky-300"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('reverse', `adb reverse tcp:${reversePort} tcp:${reversePort}`)
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  {copiedId === 'reverse' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Deep Link Tester */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Android Intent Deep-Link Tester
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={deepLinkUri}
                onChange={(e) => setDeepLinkUri(e.target.value)}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-[#0B0F17] border border-slate-800 text-xs font-mono text-slate-100"
              />
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'deeplink',
                    `adb shell am start -a android.intent.action.VIEW -d "${deepLinkUri}"`
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 shrink-0"
              >
                {copiedId === 'deeplink' ? 'Copied' : 'Copy Intent'}
              </button>
            </div>
          </div>

          {/* Connected ADB Devices Output */}
          <div className="p-3 rounded-lg bg-[#0B0F17] border border-slate-800 font-mono text-[11px]">
            <div className="text-slate-400 mb-1 flex items-center justify-between">
              <span>Local Companion Bridge (`127.0.0.1:4040`)</span>
              <span className={bridgeOnline ? 'text-emerald-400' : 'text-amber-400'}>
                {bridgeOnline ? 'ONLINE' : 'NOT DETECTED'}
              </span>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap text-[10px]">
              {bridgeOnline
                ? bridgeAdbDevices || 'List of devices attached\n(No USB devices plugged in)'
                : 'Download droidlite-bridge.js above and run:\n  node droidlite-bridge.js'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
