import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCcw,
  Search,
  Smartphone,
  Terminal,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { AdbBridgeStudio } from './components/AdbBridgeStudio';
import { DesktopLauncherModal } from './components/DesktopLauncherModal';
import { PhoneHardwareFrame } from './components/PhoneHardwareFrame';
import {
  DEVICE_PROFILES,
  GPS_PRESETS,
  LOCAL_BRIDGE_NODE_SCRIPT,
  SAMPLE_WIDGET_TREE,
} from './data/devices';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import {
  DeviceId,
  LogEntry,
  NetworkProfile,
  NetworkRequestEntry,
  PhoneSystemView,
  SimulatorConfig,
  SimulatorSourceMode,
  WidgetNode,
} from './types/simulator';

export default function App() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Determine initial layout mode: default to 'standalone-phone' if URL has ?mode=phone,
  // or if running as an installed standalone PWA, or if window width is compact (<720px).
  const [viewLayoutMode, setViewLayoutMode] = useState<'standalone-phone' | 'full-studio'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'phone') return 'standalone-phone';
      if (params.get('mode') === 'studio') return 'full-studio';
      const isStandaloneDisplay =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.innerWidth < 720;
      if (isStandaloneDisplay) return 'standalone-phone';
    }
    return 'standalone-phone';
  });

  const [miniDrawerOpen, setMiniDrawerOpen] = useState<boolean>(false);
  const [showLauncherModal, setShowLauncherModal] = useState<boolean>(false);

  const [activeSection, setActiveSection] = useState<'simulator' | 'adb-bridge' | 'cli-script'>(
    'simulator'
  );
  const [rightPanelTab, setRightPanelTab] = useState<'logs' | 'widgets' | 'network'>('logs');
  const [logFilter, setLogFilter] = useState<'all' | 'flutter' | 'network' | 'system' | 'error'>(
    'all'
  );
  const [logSearch, setLogSearch] = useState<string>('');
  const [selectedWidget, setSelectedWidget] = useState<WidgetNode>(SAMPLE_WIDGET_TREE);

  const [systemView, setSystemView] = useState<PhoneSystemView>('running-app');
  const [iframeRefreshKey, setIframeRefreshKey] = useState<number>(1);

  // WebUSB & Local Bridge State
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [bridgeOnline, setBridgeOnline] = useState<boolean>(false);
  const [bridgeAdbDevices, setBridgeAdbDevices] = useState<string>('');
  const [bridgeScreenshotUrl, setBridgeScreenshotUrl] = useState<string | null>(null);

  const [config, setConfig] = useState<SimulatorConfig>(() => {
    let initialDevice: DeviceId = 'pixel-8-pro';
    let initialPort = '5050';
    let initialSource: SimulatorSourceMode = 'sandbox';

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const devParam = params.get('device') as DeviceId | null;
      if (devParam && DEVICE_PROFILES.some((d) => d.id === devParam)) {
        initialDevice = devParam;
      }
      const portParam = params.get('port');
      if (portParam) {
        initialPort = portParam;
      }
      const srcParam = params.get('source') as SimulatorSourceMode | null;
      if (srcParam && ['sandbox', 'localhost', 'usb-mirror'].includes(srcParam)) {
        initialSource = srcParam;
      }
    }

    return {
      deviceId: initialDevice,
      orientation: 'portrait',
      zoomScale: 0.82,
      sourceMode: initialSource,
      flutterServerUrl: `http://localhost:${initialPort}`,
      flutterWebPort: initialPort,
      debugPaintSizeEnabled: false,
      showPerformanceOverlay: false,
      slowAnimations: false,
      showSafeAreaBounds: false,
      showTouchIndicator: true,
      darkMode: true,
      textScaleFactor: 1.0,
      batteryLevel: 86,
      isCharging: true,
      networkProfile: 'wifi',
      navMode: '3-button',
      gpsLocation: GPS_PRESETS[0],
    };
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'l-1',
      timestamp: '10:51:42.104',
      level: 'info',
      tag: 'system',
      message: 'DroidLite Standalone Phone Runtime initialized (~18 MB RAM, 0% VM overhead).',
    },
    {
      id: 'l-2',
      timestamp: '10:51:42.310',
      level: 'info',
      tag: 'flutter',
      message: 'Flutter DevTools service bound on Pixel 8 Pro (412×892 dp, Impeller enabled).',
    },
    {
      id: 'l-3',
      timestamp: '10:51:42.890',
      level: 'debug',
      tag: 'flutter',
      message: 'Mounted MaterialApp -> Scaffold -> SliverAppBar.medium (60.0 FPS)',
    },
  ]);

  const [networkRequests, setNetworkRequests] = useState<NetworkRequestEntry[]>([
    {
      id: 'n-1',
      timestamp: '10:51:43',
      method: 'GET',
      endpoint: '/api/v1/bootstrap/config',
      status: 200,
      durationMs: 42,
      sizeKb: '1.4 KB',
      responsePreview: '{"theme":"material3","impeller":true,"environment":"debug"}',
    },
  ]);

  const currentDevice =
    DEVICE_PROFILES.find((d) => d.id === config.deviceId) || DEVICE_PROFILES[0];

  const updateConfig = (partial: Partial<SimulatorConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const emitLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(
      3,
      '0'
    )}`;
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: ts,
        ...entry,
      },
      ...prev.slice(0, 149),
    ]);
  };

  const emitNetwork = (req: Omit<NetworkRequestEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}:${String(now.getSeconds()).padStart(2, '0')}`;
    setNetworkRequests((prev) => [
      {
        id: `net-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: ts,
        ...req,
      },
      ...prev.slice(0, 49),
    ]);
  };

  const handleHotReload = () => {
    setIframeRefreshKey((k) => k + 1);
    emitLog({
      level: 'info',
      tag: 'flutter',
      message: 'Performing hot reload... Reloaded 4 of 612 libraries in 148ms.',
    });
  };

  // Probe local companion bridge on 127.0.0.1:4040
  const probeLocalBridge = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('http://127.0.0.1:4040/status', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setBridgeOnline(true);
        setBridgeAdbDevices(data.adbOutput || '');
        setBridgeScreenshotUrl(`http://127.0.0.1:4040/screenshot?t=${Date.now()}`);
        emitLog({
          level: 'info',
          tag: 'adb',
          message: 'Connected to local DroidLite Bridge on 127.0.0.1:4040',
        });
      }
    } catch {
      setBridgeOnline(false);
    }
  };

  useEffect(() => {
    probeLocalBridge();
  }, []);

  const handleRunBridgeCommand = async (command: string) => {
    if (!bridgeOnline) {
      navigator.clipboard.writeText(command);
      emitLog({
        level: 'warn',
        tag: 'adb',
        message: `Local bridge (:4040) not running. Copied command to clipboard: ${command}`,
      });
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:4040/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      emitLog({
        level: data.ok ? 'info' : 'error',
        tag: 'adb',
        message: data.stdout || data.stderr || `Executed: ${command}`,
      });
    } catch (err) {
      emitLog({
        level: 'error',
        tag: 'adb',
        message: `Bridge command failed: ${(err as Error).message}`,
      });
    }
  };

  const handlePairWebUsb = async () => {
    const nav = navigator as unknown as {
      usb?: {
        requestDevice: (opts: { filters: Array<{ classCode?: number }> }) => Promise<{
          productName?: string;
          manufacturerName?: string;
        }>;
      };
    };
    if (!nav.usb) {
      emitLog({
        level: 'warn',
        tag: 'adb',
        message: 'WebUSB requires Chromium (Chrome/Edge). Use the Local Bridge CLI for any browser.',
      });
      return;
    }
    try {
      const usbDev = await nav.usb.requestDevice({ filters: [] });
      const label = `${usbDev.manufacturerName || 'Android'} ${usbDev.productName || 'Device'}`.trim();
      setUsbDeviceName(label);
      emitLog({
        level: 'info',
        tag: 'adb',
        message: `Paired physical Android device via WebUSB: ${label}`,
      });
    } catch (err) {
      emitLog({
        level: 'debug',
        tag: 'adb',
        message: `WebUSB selection cancelled or no device chosen (${(err as Error).message})`,
      });
    }
  };

  const handleDownloadBridgeScript = () => {
    const blob = new Blob([LOCAL_BRIDGE_NODE_SCRIPT], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'droidlite-bridge.js';
    a.click();
    URL.revokeObjectURL(url);
    emitLog({
      level: 'info',
      tag: 'adb',
      message: 'Downloaded droidlite-bridge.js local companion script.',
    });
  };

  const filteredLogs = logs.filter((entry) => {
    if (logFilter === 'error' && entry.level !== 'error') return false;
    if (logFilter !== 'all' && logFilter !== 'error' && entry.tag !== logFilter) return false;
    if (logSearch.trim() && !entry.message.toLowerCase().includes(logSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const renderWidgetNode = (node: WidgetNode, depth = 0) => {
    const isSelected = selectedWidget.id === node.id;
    return (
      <div key={node.id}>
        <button
          type="button"
          onClick={() => setSelectedWidget(node)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`w-full py-1.5 pr-2 text-left text-xs font-mono flex items-center justify-between rounded transition-colors ${
            isSelected
              ? 'bg-blue-600/25 text-sky-300 border border-blue-500/40'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <span className="truncate flex items-center gap-1.5">
            {node.children && node.children.length > 0 ? (
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            )}
            <span>{node.name}</span>
          </span>
          <span className="text-[10px] text-slate-500 shrink-0 ml-2">{node.type}</span>
        </button>
        {node.children &&
          node.children.map((child) => renderWidgetNode(child, depth + 1))}
      </div>
    );
  };

  // ============================================================================
  // MODE 1: STANDALONE PHONE-ONLY VIEW (Transparent Background + Hideable Side Bar)
  // ============================================================================
  if (viewLayoutMode === 'standalone-phone') {
    return (
      <div className="min-h-screen w-full bg-transparent text-slate-100 flex flex-col items-center justify-center p-2 relative overflow-hidden">
        {/* Subtle Floating Top Pill Controls for Quick Switching */}
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-[#111827]/90 border border-slate-700/80 text-xs shadow-lg backdrop-blur-xs">
          <select
            value={config.deviceId}
            onChange={(e) => updateConfig({ deviceId: e.target.value as DeviceId })}
            className="bg-transparent font-semibold text-white text-xs focus:outline-none cursor-pointer"
            title="Switch Android Phone Size (5 Models)"
          >
            {DEVICE_PROFILES.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#111827] text-slate-100">
                {d.name} ({d.widthDp}×{d.heightDp} dp)
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <select
            value={config.sourceMode}
            onChange={(e) => {
              updateConfig({ sourceMode: e.target.value as SimulatorSourceMode });
              setSystemView('running-app');
            }}
            className="bg-transparent text-sky-400 font-mono text-xs focus:outline-none cursor-pointer"
          >
            <option value="sandbox" className="bg-[#111827] text-slate-100">
              Mode: Flutter Sandbox
            </option>
            <option value="localhost" className="bg-[#111827] text-slate-100">
              Mode: Localhost (:{config.flutterWebPort})
            </option>
            <option value="usb-mirror" className="bg-[#111827] text-slate-100">
              Mode: USB Physical Mirror
            </option>
          </select>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <button
            type="button"
            onClick={() => setShowLauncherModal(true)}
            className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3 text-sky-400" />
            <span>PC Launcher (`.bat`)</span>
          </button>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <button
            type="button"
            onClick={() => setViewLayoutMode('full-studio')}
            className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Full Studio</span>
          </button>
        </div>

        {/* Main Standalone Phone Container + Optional Slide-Over Mini Drawer */}
        <div className="flex items-center justify-center gap-4 max-w-full">
          <PhoneHardwareFrame
            device={currentDevice}
            config={config}
            systemView={systemView}
            onChangeSystemView={setSystemView}
            onUpdateConfig={updateConfig}
            onEmitLog={emitLog}
            onEmitNetwork={emitNetwork}
            iframeRefreshKey={iframeRefreshKey}
            onTriggerHotReload={handleHotReload}
            usbDeviceName={usbDeviceName}
            onPairWebUsb={handlePairWebUsb}
            bridgeOnline={bridgeOnline}
            bridgeScreenshotUrl={bridgeScreenshotUrl}
            onRefreshBridgeScreenshot={probeLocalBridge}
            isStandalonePhoneMode={true}
            onToggleStandaloneMode={() => setViewLayoutMode('full-studio')}
            onOpenLauncherModal={() => setShowLauncherModal(true)}
            onToggleMiniDrawer={() => setMiniDrawerOpen((o) => !o)}
            miniDrawerOpen={miniDrawerOpen}
          />

          {/* Compact Slide-Out Mini Drawer for Device Profile, Localhost URL & Live Logs */}
          {miniDrawerOpen && (
            <div className="w-80 h-[680px] rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl flex flex-col overflow-hidden shrink-0">
              <div className="px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Quick Device &amp; Logcat Drawer
                </span>
                <button
                  type="button"
                  onClick={() => setMiniDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 border-b border-slate-800 space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Hardware Device Profile
                  </label>
                  <select
                    value={config.deviceId}
                    onChange={(e) =>
                      updateConfig({ deviceId: e.target.value as DeviceId })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B0F17] border border-slate-800 text-xs text-slate-100"
                  >
                    {DEVICE_PROFILES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.manufacturer} {d.name} ({d.widthDp}×{d.heightDp} dp)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Flutter Localhost Dev URL
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={config.flutterServerUrl}
                      onChange={(e) =>
                        updateConfig({
                          flutterServerUrl: e.target.value,
                          sourceMode: 'localhost',
                        })
                      }
                      className="flex-1 min-w-0 px-2.5 py-1 rounded bg-[#0B0F17] border border-slate-800 text-xs font-mono text-sky-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateConfig({ sourceMode: 'localhost' });
                        handleHotReload();
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                    >
                      Connect
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">Zoom Scale</span>
                  <input
                    type="range"
                    min="0.6"
                    max="1.0"
                    step="0.04"
                    value={config.zoomScale}
                    onChange={(e) =>
                      updateConfig({ zoomScale: parseFloat(e.target.value) })
                    }
                    className="w-36 accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Mini Log Stream */}
              <div className="px-3 py-1.5 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Live Flutter / ADB Logs ({logs.length})</span>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="hover:text-rose-400"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 font-mono text-[10px]">
                {logs.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded border ${
                      item.level === 'error'
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                        : 'bg-[#0B0F17] border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="text-[9px] text-slate-500 mb-0.5 tabular-nums">
                      {item.timestamp} · {item.tag.toUpperCase()}
                    </div>
                    <div className="break-words">{item.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DesktopLauncherModal
          isOpen={showLauncherModal}
          onClose={() => setShowLauncherModal(false)}
          config={config}
          device={currentDevice}
          onUpdateConfig={updateConfig}
          onDownloadBridgeScript={handleDownloadBridgeScript}
        />
      </div>
    );
  }

  // ============================================================================
  // MODE 2: FULL 3-COLUMN STUDIO MODE
  // ============================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/90 bg-[#0B0F17]/95 sticky top-0 z-40">
        {/* Zone 1: Brand Title (single text element, one line) */}
        <a
          href="#simulator"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('simulator');
          }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          DroidLite Studio
        </a>

        {/* Zone 2: 4 Concise Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a
            href="#standalone-phone"
            onClick={(e) => {
              e.preventDefault();
              setViewLayoutMode('standalone-phone');
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Standalone Phone View
          </a>
          <a
            href="#simulator"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('simulator');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'simulator'
                ? 'text-white underline underline-offset-8 decoration-sky-400'
                : ''
            }`}
          >
            Full Studio
          </a>
          <a
            href="#adb-bridge"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('adb-bridge');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'adb-bridge'
                ? 'text-white underline underline-offset-8 decoration-sky-400'
                : ''
            }`}
          >
            ADB &amp; Scrcpy Bridge
          </a>
          <a
            href="#cli-companion"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('cli-script');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'cli-script'
                ? 'text-white underline underline-offset-8 decoration-sky-400'
                : ''
            }`}
          >
            Local Companion
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowLauncherModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Desktop Launcher (`.bat`)
          </button>
        </div>
      </header>

      {/* Offline Banner if Browser Loses Connectivity */}
      {!isOnline && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-6 py-2 text-xs text-amber-200 flex items-center justify-between">
          <span>Offline Mode Active — Local Flutter Simulator &amp; Cached Assets Ready.</span>
          <span className="font-mono">PWA Standalone Cache</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 space-y-6">
        {activeSection === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT PANEL (3 cols): Device Hardware & Flutter Debug Controls */}
            <div className="lg:col-span-3 bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-5">
              {/* Switch to Standalone Phone-Only Mode CTA */}
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
                <div className="text-xs font-semibold text-white">
                  Want Phone-Only Mode (No Dashboard)?
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Hide all panels so only the phone and slim side toolbar remain, or download the `.bat` desktop launcher.
                </p>
                <div className="flex gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setViewLayoutMode('standalone-phone')}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Phone-Only View</span>
                  </button>
                  {isInstallable && !isInstalled && (
                    <button
                      type="button"
                      onClick={install}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
                    >
                      Install PWA
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Target Android Hardware Profile */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white">
                    Android Hardware Profile
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    API {currentDevice.apiLevel}
                  </span>
                </div>
                <select
                  value={config.deviceId}
                  onChange={(e) => {
                    const nextId = e.target.value as DeviceId;
                    const dev = DEVICE_PROFILES.find((d) => d.id === nextId);
                    updateConfig({
                      deviceId: nextId,
                      zoomScale: nextId === 'pixel-fold' ? 0.68 : 0.78,
                    });
                    emitLog({
                      level: 'info',
                      tag: 'system',
                      message: `Switched hardware profile to ${dev?.name} (${dev?.widthDp}×${dev?.heightDp} dp, ${dev?.ppi} PPI)`,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0F17] border border-slate-800 text-xs font-medium text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {DEVICE_PROFILES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.manufacturer} {d.name} ({d.widthDp}×{d.heightDp} dp)
                    </option>
                  ))}
                </select>

                {/* Clean Unboxed Metadata */}
                <div className="text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span>{currentDevice.resolutionPx} px</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentDevice.ppi} PPI</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentDevice.ramProfile}</span>
                </div>
              </div>

              {/* 2. App Source Mode (Sandbox vs Localhost Flutter vs USB Mirror) */}
              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-white">
                  Runtime Target Source
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#0B0F17] rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({ sourceMode: 'sandbox' });
                      setSystemView('running-app');
                    }}
                    className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors whitespace-nowrap truncate ${
                      config.sourceMode === 'sandbox'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({ sourceMode: 'localhost' });
                      setSystemView('running-app');
                    }}
                    className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors whitespace-nowrap truncate ${
                      config.sourceMode === 'localhost'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Localhost
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({ sourceMode: 'usb-mirror' });
                      setSystemView('running-app');
                    }}
                    className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors whitespace-nowrap truncate ${
                      config.sourceMode === 'usb-mirror'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    USB ADB
                  </button>
                </div>

                {config.sourceMode === 'localhost' && (
                  <div className="pt-1.5 space-y-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={config.flutterServerUrl}
                        onChange={(e) => updateConfig({ flutterServerUrl: e.target.value })}
                        placeholder="http://localhost:5050"
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#0B0F17] border border-slate-800 text-xs font-mono text-sky-300"
                      />
                      <button
                        type="button"
                        onClick={handleHotReload}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shrink-0"
                        title="Reload Flutter Viewport"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Orientation, Zoom Scale & Navigation Bar Style */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Chassis &amp; Viewport</span>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {Math.round(config.zoomScale * 100)}% Scale
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig({
                        orientation:
                          config.orientation === 'portrait' ? 'landscape' : 'portrait',
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                    <span className="capitalize">{config.orientation}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateConfig({
                        navMode: config.navMode === '3-button' ? 'gesture' : '3-button',
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 whitespace-nowrap"
                  >
                    {config.navMode === '3-button' ? '3-Button Nav' : 'Gesture Pill'}
                  </button>
                </div>

                {/* Zoom Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 w-12">Zoom</span>
                  <input
                    type="range"
                    min="0.55"
                    max="1.0"
                    step="0.03"
                    value={config.zoomScale}
                    onChange={(e) => updateConfig({ zoomScale: parseFloat(e.target.value) })}
                    className="flex-1 accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* 4. Flutter DevTools & Inspector Overlays */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-white">Flutter Debug Overlays</div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !config.debugPaintSizeEnabled;
                      updateConfig({ debugPaintSizeEnabled: next });
                      emitLog({
                        level: 'info',
                        tag: 'flutter',
                        message: `Rendering service extension: debugPaintSizeEnabled = ${next}`,
                      });
                    }}
                    className={`px-2.5 py-2 rounded-lg border text-left transition-colors ${
                      config.debugPaintSizeEnabled
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-medium">Debug Paint</div>
                    <div className="text-[10px] font-mono opacity-75">Widget Bounds</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !config.showPerformanceOverlay;
                      updateConfig({ showPerformanceOverlay: next });
                      emitLog({
                        level: 'info',
                        tag: 'flutter',
                        message: `PerformanceOverlay toggled -> ${next ? '60fps Raster/UI graph active' : 'off'}`,
                      });
                    }}
                    className={`px-2.5 py-2 rounded-lg border text-left transition-colors ${
                      config.showPerformanceOverlay
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-medium">Perf Overlay</div>
                    <div className="text-[10px] font-mono opacity-75">60fps Graph</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateConfig({ showSafeAreaBounds: !config.showSafeAreaBounds })
                    }
                    className={`px-2.5 py-2 rounded-lg border text-left transition-colors ${
                      config.showSafeAreaBounds
                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-medium">SafeArea</div>
                    <div className="text-[10px] font-mono opacity-75">Cutout Insets</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateConfig({ slowAnimations: !config.slowAnimations })}
                    className={`px-2.5 py-2 rounded-lg border text-left transition-colors ${
                      config.slowAnimations
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-medium">Slow Anim</div>
                    <div className="text-[10px] font-mono opacity-75">timeDilation 5x</div>
                  </button>
                </div>
              </div>

              {/* 5. Network Throttling, Battery & GPS Sensors */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-white">
                  Network &amp; Hardware Sensors
                </div>

                {/* Network Profile */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#0B0F17] rounded-lg border border-slate-800">
                  {(['wifi', '4g', '3g-slow', 'offline'] as NetworkProfile[]).map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => {
                        updateConfig({ networkProfile: net });
                        emitLog({
                          level: net === 'offline' ? 'warn' : 'info',
                          tag: 'network',
                          message: `ConnectivityManager changed network state -> ${net.toUpperCase()}`,
                        });
                      }}
                      className={`py-1 rounded text-[10px] font-mono uppercase transition-colors ${
                        config.networkProfile === net
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {net === '3g-slow' ? '3G' : net}
                    </button>
                  ))}
                </div>

                {/* Battery Level & Charging */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Simulated Battery</span>
                    <button
                      type="button"
                      onClick={() => updateConfig({ isCharging: !config.isCharging })}
                      className="font-mono text-sky-400 hover:underline"
                    >
                      {config.batteryLevel}% · {config.isCharging ? 'Charging' : 'Unplugged'}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={config.batteryLevel}
                    onChange={(e) =>
                      updateConfig({ batteryLevel: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* CENTER PANEL (5 cols): Realistic Phone Hardware Viewport + Slim Hardware Rail */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#111827]/60 border border-slate-800/80 rounded-xl p-4 min-h-[760px]">
              {/* Top Quick Hardware Toolbar */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span>{currentDevice.name}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {config.orientation === 'portrait'
                      ? `${currentDevice.widthDp}×${currentDevice.heightDp} dp`
                      : `${currentDevice.heightDp}×${currentDevice.widthDp} dp`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewLayoutMode('standalone-phone')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium flex items-center gap-1 cursor-pointer"
                    title="Collapse surrounding dashboard into Standalone Phone-Only Mode"
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>Phone-Only Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHotReload}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Hot Reload</span>
                  </button>
                </div>
              </div>

              {/* Realistic Android Phone Chassis + Slim Vertical Toolbar */}
              <PhoneHardwareFrame
                device={currentDevice}
                config={config}
                systemView={systemView}
                onChangeSystemView={setSystemView}
                onUpdateConfig={updateConfig}
                onEmitLog={emitLog}
                onEmitNetwork={emitNetwork}
                iframeRefreshKey={iframeRefreshKey}
                onTriggerHotReload={handleHotReload}
                usbDeviceName={usbDeviceName}
                onPairWebUsb={handlePairWebUsb}
                bridgeOnline={bridgeOnline}
                bridgeScreenshotUrl={bridgeScreenshotUrl}
                onRefreshBridgeScreenshot={probeLocalBridge}
                isStandalonePhoneMode={false}
                onToggleStandaloneMode={() => setViewLayoutMode('standalone-phone')}
                onOpenLauncherModal={() => setShowLauncherModal(true)}
              />

              {/* Bottom Caption */}
              <div className="w-full pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Use the slim vertical hardware bar beside the phone for Power, Volume, Rotate &amp; Nav</span>
                <span className="font-mono tabular-nums text-slate-500">~18 MB Memory</span>
              </div>
            </div>

            {/* RIGHT PANEL (4 cols): Live Logcat, Widget Tree Inspector & Network Profiler */}
            <div
              id="widget-inspector"
              className="lg:col-span-4 bg-[#111827] border border-slate-800/90 rounded-xl flex flex-col h-[760px] overflow-hidden"
            >
              {/* Segmented Control Tabs */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1 p-1 bg-[#0B0F17] rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('logs')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      rightPanelTab === 'logs'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Logcat ({logs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('widgets')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      rightPanelTab === 'widgets'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Widget Tree
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('network')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      rightPanelTab === 'network'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    HTTP ({networkRequests.length})
                  </button>
                </div>

                {rightPanelTab === 'logs' && (
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    title="Clear Logcat console"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* TAB 1: LOGCAT & FLUTTER CONSOLE */}
              {rightPanelTab === 'logs' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-2.5 border-b border-slate-800/80 space-y-2 shrink-0">
                    <div className="flex items-center gap-1">
                      {(['all', 'flutter', 'network', 'system', 'error'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setLogFilter(f)}
                          className={`px-2 py-1 rounded text-[11px] font-mono capitalize transition-colors ${
                            logFilter === f
                              ? 'bg-slate-800 text-sky-400 font-semibold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Filter flutter / adb logcat output..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0B0F17] border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 font-mono text-[11px]">
                    {filteredLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                        <Terminal className="w-6 h-6 text-slate-600" />
                        <p className="text-xs">No log entries matching current filter.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setLogFilter('all');
                            setLogSearch('');
                          }}
                          className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                        >
                          Reset Filters
                        </button>
                      </div>
                    ) : (
                      filteredLogs.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded-lg border leading-relaxed break-words ${
                            item.level === 'error'
                              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                              : item.level === 'warn'
                              ? 'bg-amber-950/25 border-amber-500/30 text-amber-200'
                              : 'bg-[#0B0F17] border-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5 tabular-nums">
                            <span>
                              {item.timestamp} · {item.tag.toUpperCase()}
                            </span>
                            <span className="uppercase">{item.level}</span>
                          </div>
                          <div>{item.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: FLUTTER WIDGET TREE & RENDEROBJECT INSPECTOR */}
              {rightPanelTab === 'widgets' && (
                <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
                  <div className="text-xs text-slate-400">
                    Click any widget node to inspect its RenderBox size and constraints:
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-0.5">
                    {renderWidgetNode(SAMPLE_WIDGET_TREE)}
                  </div>

                  <div className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-2 shrink-0 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-semibold text-sky-400">{selectedWidget.name}</span>
                      <span className="text-[10px] text-slate-400">{selectedWidget.type}</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">RenderBox Size:</span>
                        <span className="text-slate-200 tabular-nums">{selectedWidget.size}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 shrink-0">Constraints:</span>
                        <span className="text-slate-300 truncate">{selectedWidget.constraints}</span>
                      </div>
                      {selectedWidget.padding && (
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400 shrink-0">Padding:</span>
                          <span className="text-slate-300 truncate">{selectedWidget.padding}</span>
                        </div>
                      )}
                      {selectedWidget.stateSummary && (
                        <div className="pt-1 text-[10px] text-emerald-400">
                          {selectedWidget.stateSummary}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NETWORK & HTTP INSPECTOR */}
              {rightPanelTab === 'network' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Captured HTTP / Dio Requests</span>
                    <span className="font-mono uppercase text-sky-400">
                      {config.networkProfile}
                    </span>
                  </div>

                  {networkRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-2 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {req.method} {req.endpoint}
                        </span>
                        <span
                          className={`tabular-nums ${
                            req.status >= 200 && req.status < 300
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {req.status === 0 ? 'ERR_OFFLINE' : `${req.status} OK`} · {req.durationMs}ms
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        {req.timestamp} · Payload: {req.sizeKb}
                      </div>
                      <pre className="p-2 rounded bg-slate-950 text-[10px] text-slate-300 overflow-x-auto">
                        {req.responsePreview}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADB & SCRCPY BRIDGE STUDIO VIEW */}
        {activeSection === 'adb-bridge' && (
          <AdbBridgeStudio
            usbDeviceName={usbDeviceName}
            onPairWebUsb={handlePairWebUsb}
            bridgeOnline={bridgeOnline}
            bridgeAdbDevices={bridgeAdbDevices}
            onProbeBridge={probeLocalBridge}
            onRunBridgeCommand={handleRunBridgeCommand}
            onEmitLog={emitLog}
          />
        )}

        {/* LOCAL COMPANION CLI SCRIPT VIEW */}
        {activeSection === 'cli-script' && (
          <div className="p-6 rounded-xl bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Local Companion Bridge (`droidlite-bridge.js`)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Zero-dependency Node.js script (~5 MB RAM) that connects this interface directly to your PC’s local `adb`, `scrcpy`, and `flutter` CLI.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBridgeScript}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download droidlite-bridge.js</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[420px]">
              {LOCAL_BRIDGE_NODE_SCRIPT}
            </pre>
          </div>
        )}
      </main>

      <DesktopLauncherModal
        isOpen={showLauncherModal}
        onClose={() => setShowLauncherModal(false)}
        config={config}
        device={currentDevice}
        onUpdateConfig={updateConfig}
        onDownloadBridgeScript={handleDownloadBridgeScript}
      />
    </div>
  );
}
