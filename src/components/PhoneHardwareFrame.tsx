import React, { useEffect, useState } from 'react';
import {
  Activity,
  Battery,
  BatteryCharging,
  Check,
  ChevronLeft,
  Circle,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Play,
  Power,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Square,
  Terminal,
  Usb,
  Volume1,
  Volume2,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  DeviceProfile,
  LogEntry,
  NetworkRequestEntry,
  PhoneSystemView,
  SimulatorConfig,
} from '../types/simulator';
import { FlutterSandboxApp } from './FlutterSandboxApp';

interface PhoneHardwareFrameProps {
  device: DeviceProfile;
  config: SimulatorConfig;
  systemView: PhoneSystemView;
  onChangeSystemView: (view: PhoneSystemView) => void;
  onUpdateConfig: (partial: Partial<SimulatorConfig>) => void;
  onEmitLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onEmitNetwork: (req: Omit<NetworkRequestEntry, 'id' | 'timestamp'>) => void;
  iframeRefreshKey: number;
  onTriggerHotReload: () => void;
  usbDeviceName: string | null;
  onPairWebUsb: () => void;
  bridgeOnline: boolean;
  bridgeScreenshotUrl: string | null;
  onRefreshBridgeScreenshot: () => void;
  // Standalone Phone Mode props
  isStandalonePhoneMode?: boolean;
  onToggleStandaloneMode?: () => void;
  onOpenLauncherModal?: () => void;
  onToggleMiniDrawer?: () => void;
  miniDrawerOpen?: boolean;
}

export const PhoneHardwareFrame: React.FC<PhoneHardwareFrameProps> = ({
  device,
  config,
  systemView,
  onChangeSystemView,
  onUpdateConfig,
  onEmitLog,
  onEmitNetwork,
  iframeRefreshKey,
  onTriggerHotReload,
  usbDeviceName,
  onPairWebUsb,
  bridgeOnline,
  bridgeScreenshotUrl,
  onRefreshBridgeScreenshot,
  isStandalonePhoneMode = false,
  onToggleStandaloneMode,
  onOpenLauncherModal,
  onToggleMiniDrawer,
  miniDrawerOpen = false,
}) => {
  const [clockText, setClockText] = useState<string>('10:52');
  const [volumeLevel, setVolumeLevel] = useState<number>(70);
  const [showVolumeHud, setShowVolumeHud] = useState<boolean>(false);
  const [shadeOpen, setShadeOpen] = useState<boolean>(false);
  const [backSignal, setBackSignal] = useState<number>(0);
  const [touchPoint, setTouchPoint] = useState<{ x: number; y: number; id: number } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [sideRailHidden, setSideRailHidden] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setClockText(`${hrs}:${mins}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);

  const triggerVolumeChange = (delta: number) => {
    setVolumeLevel((prev) => {
      const next = Math.max(0, Math.min(100, prev + delta));
      onEmitLog({
        level: 'debug',
        tag: 'system',
        message: `KeyEvent: KEYCODE_VOLUME_${delta > 0 ? 'UP' : 'DOWN'} -> StreamVolume: ${next}%`,
      });
      return next;
    });
    setShowVolumeHud(true);
    setTimeout(() => setShowVolumeHud(false), 1800);
  };

  const handlePowerButton = () => {
    if (systemView === 'lock-screen') {
      onChangeSystemView('running-app');
      onEmitLog({
        level: 'info',
        tag: 'system',
        message: 'PowerManager: Screen wake -> App resumed (onResume)',
      });
    } else {
      onChangeSystemView('lock-screen');
      setShadeOpen(false);
      onEmitLog({
        level: 'info',
        tag: 'system',
        message: 'PowerManager: Screen locked -> App paused (onPause)',
      });
    }
  };

  const handleBackPress = () => {
    if (shadeOpen) {
      setShadeOpen(false);
      return;
    }
    if (systemView === 'recents') {
      onChangeSystemView('running-app');
      return;
    }
    setBackSignal((s) => s + 1);
    onEmitLog({
      level: 'debug',
      tag: 'system',
      message: 'SystemNavigation: KEYCODE_BACK dispatched',
    });
  };

  const handleHomePress = () => {
    setShadeOpen(false);
    if (systemView !== 'home-screen') {
      onChangeSystemView('home-screen');
      onEmitLog({
        level: 'info',
        tag: 'system',
        message: 'ActivityManager: Launched Pixel Launcher (Home)',
      });
    }
  };

  const handleRecentsPress = () => {
    setShadeOpen(false);
    onChangeSystemView(systemView === 'recents' ? 'running-app' : 'recents');
    onEmitLog({
      level: 'debug',
      tag: 'system',
      message: 'SystemUI: Toggled Overview / Recents switcher',
    });
  };

  const handleRotate = () => {
    const next = config.orientation === 'portrait' ? 'landscape' : 'portrait';
    onUpdateConfig({ orientation: next });
    onEmitLog({
      level: 'info',
      tag: 'system',
      message: `WindowManager: Rotation changed -> ${next.toUpperCase()}`,
    });
  };

  const isLandscape = config.orientation === 'landscape';
  const rawWidth = isLandscape ? device.heightDp : device.widthDp;
  const rawHeight = isLandscape ? device.widthDp : device.heightDp;

  const scaledWidth = Math.round(rawWidth * config.zoomScale);
  const scaledHeight = Math.round(rawHeight * config.zoomScale);

  const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!config.showTouchIndicator) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / config.zoomScale;
    const y = (e.clientY - rect.top) / config.zoomScale;
    setTouchPoint({ x, y, id: Date.now() });
    setTimeout(() => {
      setTouchPoint((prev) => (prev && Date.now() - prev.id >= 350 ? null : prev));
    }, 380);
  };

  const flutterCmd = `flutter run -d web-server --web-port=${config.flutterWebPort} --web-hostname=0.0.0.0`;

  const copyFlutterCommand = () => {
    navigator.clipboard.writeText(flutterCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  return (
    <div className="relative flex items-center justify-center gap-3 select-none my-auto">
      {/* Outer wrapper sized to the scaled dimensions so layout flows cleanly */}
      <div
        style={{ width: `${scaledWidth + 28}px`, height: `${scaledHeight + 28}px` }}
        className="relative flex items-center justify-center transition-all duration-200"
      >
        {/* Scaled Hardware Chassis */}
        <div
          style={{
            width: `${rawWidth + 24}px`,
            height: `${rawHeight + 24}px`,
            transform: `scale(${config.zoomScale})`,
            transformOrigin: 'center center',
            borderRadius: `${device.bezelRadius}px`,
            backgroundColor: device.frameColor,
          }}
          className="relative p-3 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] border border-slate-600/60 transition-transform duration-200 shrink-0"
        >
          {/* Metallic Chamfer Inner Highlight */}
          <div
            style={{ borderRadius: `${device.bezelRadius - 3}px` }}
            className="pointer-events-none absolute inset-1 border border-white/10"
          />

          {/* Top Earpiece Speaker Slit (Portrait only) */}
          {!isLandscape && (
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-black/70 border border-slate-700/50" />
          )}

          {/* Physical Right-Side Hardware Buttons on Chassis */}
          <div className="absolute -right-2 top-28 flex flex-col gap-3 z-30">
            <button
              type="button"
              onClick={handlePowerButton}
              title="Hardware Power / Lock Button"
              className="w-2 h-12 rounded-r-md bg-slate-600 hover:bg-sky-400 active:translate-x-0.5 transition-all border-y border-r border-slate-400/40 shadow-md cursor-pointer"
            />
            <button
              type="button"
              onClick={() => triggerVolumeChange(10)}
              title="Volume Up (+10%)"
              className="w-2 h-10 rounded-r-md bg-slate-700 hover:bg-sky-400 active:translate-x-0.5 transition-all border-y border-r border-slate-500/40 shadow-md cursor-pointer mt-2"
            />
            <button
              type="button"
              onClick={() => triggerVolumeChange(-10)}
              title="Volume Down (-10%)"
              className="w-2 h-10 rounded-r-md bg-slate-700 hover:bg-sky-400 active:translate-x-0.5 transition-all border-y border-r border-slate-500/40 shadow-md cursor-pointer"
            />
          </div>

          {/* Inner AMOLED Screen Viewport */}
          <div
            onPointerDown={handleViewportPointerDown}
            style={{
              width: `${rawWidth}px`,
              height: `${rawHeight}px`,
              borderRadius: `${device.screenRadius}px`,
            }}
            className="relative bg-[#090D14] overflow-hidden flex flex-col border border-black"
          >
            {/* Front Punch-Hole Camera Cutout */}
            {device.cutoutType !== 'fold-crease' && (
              <div
                className={`pointer-events-none z-40 absolute ${
                  isLandscape
                    ? 'left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5'
                    : 'top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5'
                } rounded-full bg-black border border-slate-800 flex items-center justify-center shadow-inner`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-sky-900/60" />
              </div>
            )}

            {/* Foldable Crease Subtle Line for Pixel Fold */}
            {device.cutoutType === 'fold-crease' && (
              <div className="pointer-events-none z-30 absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/10" />
            )}

            {/* Safe Area / Cutout Inset Inspector Overlay */}
            {config.showSafeAreaBounds && (
              <div className="pointer-events-none z-30 absolute inset-0 border-t-[32px] border-b-[28px] border-rose-500/20">
                <div className="absolute -top-7 left-3 text-[9px] font-mono text-rose-300">
                  SafeArea Top: 32.0dp
                </div>
                <div className="absolute -bottom-6 left-3 text-[9px] font-mono text-rose-300">
                  SafeArea Bottom: 28.0dp
                </div>
              </div>
            )}

            {/* Touch Ripple Indicator */}
            {config.showTouchIndicator && touchPoint && (
              <div
                style={{ left: `${touchPoint.x - 18}px`, top: `${touchPoint.y - 18}px` }}
                className="pointer-events-none z-50 absolute w-9 h-9 rounded-full bg-sky-400/35 border border-sky-300 animate-ping"
              />
            )}

            {/* Android 14 Volume HUD Overlay */}
            {showVolumeHud && (
              <div className="z-50 absolute right-3 top-28 bg-slate-900/95 border border-slate-700 rounded-2xl p-2.5 w-11 flex flex-col items-center gap-2 shadow-xl">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <div className="w-2 h-24 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end">
                  <div
                    style={{ height: `${volumeLevel}%` }}
                    className="w-full bg-sky-400 rounded-full transition-all duration-150"
                  />
                </div>
                <span className="text-[10px] font-mono tabular-nums text-slate-300">
                  {volumeLevel}
                </span>
              </div>
            )}

            {/* Android 14 Status Bar */}
            <button
              type="button"
              onClick={() => setShadeOpen((o) => !o)}
              title="Click to toggle Android 14 Quick Settings Shade"
              className="h-8 px-4 flex items-center justify-between text-[11px] font-medium bg-black/50 text-slate-100 shrink-0 z-30 hover:bg-black/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-mono tabular-nums">
                <span>{clockText}</span>
                <span className="text-[9px] text-slate-400">·</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                  {config.sourceMode === 'sandbox'
                    ? 'Flutter Debug'
                    : config.sourceMode === 'localhost'
                    ? `Port :${config.flutterWebPort}`
                    : 'USB ADB'}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono tabular-nums">
                {config.networkProfile === 'offline' ? (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                ) : config.networkProfile === 'wifi' ? (
                  <Wifi className="w-3.5 h-3.5 text-slate-200" />
                ) : (
                  <span className="text-[10px] font-bold text-sky-400 uppercase">
                    {config.networkProfile === '4g' ? '4G' : '3G'}
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] ${
                      config.batteryLevel <= 15 ? 'text-rose-400 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    {config.batteryLevel}%
                  </span>
                  {config.isCharging ? (
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Battery
                      className={`w-3.5 h-3.5 ${
                        config.batteryLevel <= 15 ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    />
                  )}
                </div>
              </div>
            </button>

            {/* Pull-Down Android 14 Quick Settings Shade */}
            {shadeOpen && (
              <div className="z-40 absolute inset-x-0 top-8 bottom-11 bg-slate-950/95 backdrop-blur-md p-4 flex flex-col justify-between border-b border-slate-800">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{device.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {device.androidVersion} · API {device.apiLevel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShadeOpen(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      Close
                    </button>
                  </div>

                  {/* Quick Tiles */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          networkProfile: config.networkProfile === 'offline' ? 'wifi' : 'offline',
                        })
                      }
                      className={`p-3 rounded-2xl text-left border transition-colors ${
                        config.networkProfile !== 'offline'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-semibold">Internet</div>
                      <div className="text-[10px] opacity-85 uppercase mt-0.5">
                        {config.networkProfile}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ darkMode: !config.darkMode })}
                      className={`p-3 rounded-2xl text-left border transition-colors ${
                        config.darkMode
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-semibold">Dark Theme</div>
                      <div className="text-[10px] opacity-85 mt-0.5">
                        {config.darkMode ? 'On' : 'Off'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({ debugPaintSizeEnabled: !config.debugPaintSizeEnabled })
                      }
                      className={`p-3 rounded-2xl text-left border transition-colors ${
                        config.debugPaintSizeEnabled
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-semibold">Debug Paint</div>
                      <div className="text-[10px] opacity-85 mt-0.5">
                        {config.debugPaintSizeEnabled ? 'Active' : 'Off'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          showPerformanceOverlay: !config.showPerformanceOverlay,
                        })
                      }
                      className={`p-3 rounded-2xl text-left border transition-colors ${
                        config.showPerformanceOverlay
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-semibold">60fps Overlay</div>
                      <div className="text-[10px] opacity-85 mt-0.5">
                        {config.showPerformanceOverlay ? 'Visible' : 'Hidden'}
                      </div>
                    </button>
                  </div>

                  {/* Active Debug Notification Card */}
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-sky-400 font-medium">
                      <span>USB Debugging Connected</span>
                      <span className="font-mono">~18 MB RAM</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      DroidLite lightweight runtime active. QEMU virtualization bypassed.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShadeOpen(false)}
                  className="mx-auto w-12 h-1.5 rounded-full bg-slate-700 hover:bg-slate-500"
                />
              </div>
            )}

            {/* Screen Body Content Based on System View */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              {systemView === 'lock-screen' && (
                <div
                  onClick={handlePowerButton}
                  className="h-full w-full bg-gradient-to-b from-slate-950 via-[#0F172A] to-slate-950 flex flex-col items-center justify-between py-14 px-6 text-center cursor-pointer"
                >
                  <div className="space-y-2">
                    <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                    <div className="text-5xl font-bold font-mono tabular-nums tracking-tight text-white">
                      {clockText}
                    </div>
                    <div className="text-xs text-slate-400">
                      {device.name} · {config.gpsLocation.name.split('(')[0]}
                    </div>
                  </div>

                  <div className="w-full p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-left">
                    <div className="text-[11px] font-medium text-sky-400">Flutter Debug Service</div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      App state preserved in memory. Tap anywhere or press the side Power button to unlock.
                    </div>
                  </div>
                </div>
              )}

              {systemView === 'home-screen' && (
                <div className="h-full w-full bg-gradient-to-b from-[#0F172A] via-[#111827] to-[#090D14] p-5 flex flex-col justify-between">
                  <div className="mt-4 space-y-1">
                    <div className="text-2xl font-semibold text-white">At a Glance</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {device.androidVersion} · Zero-VM Lightweight Mode
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 my-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateConfig({ sourceMode: 'sandbox' });
                        onChangeSystemView('running-app');
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                        <Zap className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] text-slate-200 font-medium">
                        Flutter Sandbox
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onUpdateConfig({ sourceMode: 'localhost' });
                        onChangeSystemView('running-app');
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                        <Play className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] text-slate-200 font-medium">Localhost Dev</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onUpdateConfig({ sourceMode: 'usb-mirror' });
                        onChangeSystemView('running-app');
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shadow-md group-hover:scale-105 transition-transform">
                        <Usb className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] text-slate-200 font-medium">USB Mirror</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center text-[11px] text-slate-400">
                    Tap an app icon above to launch inside {device.name}
                  </div>
                </div>
              )}

              {systemView === 'recents' && (
                <div className="h-full w-full bg-slate-950/95 p-5 flex flex-col justify-between">
                  <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
                    <span>Recent Running Tasks</span>
                    <span className="font-mono text-[11px]">~24 MB RAM used</span>
                  </div>

                  <div
                    onClick={() => onChangeSystemView('running-app')}
                    className="my-auto mx-2 p-4 rounded-2xl bg-[#151C28] border border-slate-700 hover:border-sky-400 cursor-pointer transition-all shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        {config.sourceMode === 'sandbox'
                          ? 'Flutter M3 Debug Sandbox'
                          : config.sourceMode === 'localhost'
                          ? `Flutter Dev Server (:${config.flutterWebPort})`
                          : 'Physical USB ADB Mirror'}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
                    </div>
                    <div className="h-44 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col items-center justify-center p-4 text-center">
                      <Smartphone className="w-7 h-7 text-sky-400 mb-2" />
                      <div className="text-xs text-slate-200 font-medium">
                        Tap card to resume app
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {device.widthDp} × {device.heightDp} dp · {device.ppi} PPI
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => onChangeSystemView('home-screen')}
                      className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {systemView === 'running-app' && (
                <>
                  {config.sourceMode === 'sandbox' && (
                    <FlutterSandboxApp
                      config={config}
                      onEmitLog={onEmitLog}
                      onEmitNetwork={onEmitNetwork}
                      backSignal={backSignal}
                    />
                  )}

                  {config.sourceMode === 'localhost' && (
                    <div className="h-full w-full flex flex-col bg-[#0B0F17]">
                      <div className="px-3 py-2 bg-[#111827] border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-300 truncate">
                          {config.flutterServerUrl}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={onTriggerHotReload}
                            className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-medium text-white flex items-center gap-1"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            Reload
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateConfig({ sourceMode: 'sandbox' })}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                          >
                            Sandbox
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 relative bg-slate-950">
                        <iframe
                          key={iframeRefreshKey}
                          src={config.flutterServerUrl}
                          title="Flutter Dev Server Viewport"
                          className="w-full h-full border-0 bg-white"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                        />

                        <div className="absolute inset-x-2.5 bottom-2.5 p-3 rounded-xl bg-slate-950/95 border border-slate-800 shadow-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-white">
                              Run Your Flutter App Here (Zero Emulator Lag)
                            </span>
                            <a
                              href={config.flutterServerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
                            >
                              Open tab <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Run this in your Flutter project terminal to stream into this phone frame:
                          </p>
                          <div className="flex items-center justify-between gap-1.5 bg-[#0B0F17] border border-slate-800 rounded-lg px-2.5 py-1.5">
                            <code className="text-[10px] font-mono text-sky-300 truncate">
                              {flutterCmd}
                            </code>
                            <button
                              type="button"
                              onClick={copyFlutterCommand}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
                              title="Copy Flutter command"
                            >
                              {copiedCmd ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {config.sourceMode === 'usb-mirror' && (
                    <div className="h-full w-full bg-[#0B0F17] p-4 flex flex-col justify-between text-slate-200">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <Usb className="w-4 h-4 text-sky-400" />
                          <span>Physical Android Hardware Mirror</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Run real `.apk` builds on your physical phone with 0% PC virtualization overhead.
                        </p>
                      </div>

                      {bridgeOnline && bridgeScreenshotUrl ? (
                        <div className="my-auto space-y-2">
                          <img
                            src={bridgeScreenshotUrl}
                            alt="Physical Android Screen via ADB"
                            referrerPolicy="no-referrer"
                            className="w-full max-h-[480px] object-contain rounded-xl border border-slate-800"
                          />
                          <button
                            type="button"
                            onClick={onRefreshBridgeScreenshot}
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white"
                          >
                            Refresh ADB Frame
                          </button>
                        </div>
                      ) : (
                        <div className="my-auto p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-3 text-center">
                          <Smartphone className="w-8 h-8 text-sky-400 mx-auto" />
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-white">
                              {usbDeviceName
                                ? `USB Paired: ${usbDeviceName}`
                                : 'Connect Physical Phone via USB or Local Bridge'}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Pair directly via WebUSB below, or use the `.bat`/`.sh` launcher to start a borderless `scrcpy` window.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              type="button"
                              onClick={onPairWebUsb}
                              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                            >
                              Pair Physical Phone (WebUSB)
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateConfig({ sourceMode: 'sandbox' })}
                              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                            >
                              Return to Flutter Sandbox
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-slate-500 text-center">
                        ADB Bridge Target: 127.0.0.1:4040 · {bridgeOnline ? 'CONNECTED' : 'STANDBY'}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Android 14 Bottom System Navigation Bar */}
            {config.navMode === '3-button' ? (
              <div className="h-11 bg-black/90 border-t border-slate-900 grid grid-cols-3 items-center px-6 shrink-0 z-30">
                <button
                  type="button"
                  onClick={handleBackPress}
                  title="Android Back Button"
                  className="flex items-center justify-center py-1.5 text-slate-300 hover:text-white active:scale-90 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleHomePress}
                  title="Android Home Button"
                  className="flex items-center justify-center py-1.5 text-slate-300 hover:text-white active:scale-90 transition-all cursor-pointer"
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRecentsPress}
                  title="Android Recents / App Switcher"
                  className="flex items-center justify-center py-1.5 text-slate-300 hover:text-white active:scale-90 transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleHomePress}
                title="Click Gesture Pill to return Home"
                className="h-7 bg-black/90 flex items-center justify-center shrink-0 z-30 cursor-pointer group"
              >
                <div className="w-28 h-1 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SLIM VERTICAL HARDWARE TOOLBAR (Android Studio Emulator Side Rail) */}
      <div className="w-12 bg-[#111827] border border-slate-800/90 rounded-2xl py-2.5 px-1.5 flex flex-col items-center gap-1 shadow-2xl shrink-0">
        {/* Power */}
        <button
          type="button"
          onClick={handlePowerButton}
          title="Power / Lock Screen"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            systemView === 'lock-screen'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Power className="w-4 h-4" />
        </button>

        {/* Volume Up */}
        <button
          type="button"
          onClick={() => triggerVolumeChange(10)}
          title="Volume Up (+10%)"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Volume Down */}
        <button
          type="button"
          onClick={() => triggerVolumeChange(-10)}
          title="Volume Down (-10%)"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Volume1 className="w-4 h-4" />
        </button>

        {/* Rotate */}
        <button
          type="button"
          onClick={handleRotate}
          title="Rotate Orientation (Portrait / Landscape)"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-slate-800 my-0.5" />

        {/* Flutter Hot Reload */}
        <button
          type="button"
          onClick={onTriggerHotReload}
          title="Flutter Hot Reload (r)"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600/20 text-sky-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-colors cursor-pointer"
        >
          <Zap className="w-4 h-4" />
        </button>

        {/* Flutter Debug Paint */}
        <button
          type="button"
          onClick={() =>
            onUpdateConfig({ debugPaintSizeEnabled: !config.debugPaintSizeEnabled })
          }
          title="Toggle Flutter Debug Paint Bounds"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            config.debugPaintSizeEnabled
              ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* 60fps Performance Overlay */}
        <button
          type="button"
          onClick={() =>
            onUpdateConfig({ showPerformanceOverlay: !config.showPerformanceOverlay })
          }
          title="Toggle 60fps Performance Overlay"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            config.showPerformanceOverlay
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-slate-800 my-0.5" />

        {/* Back */}
        <button
          type="button"
          onClick={handleBackPress}
          title="Android Back"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Home */}
        <button
          type="button"
          onClick={handleHomePress}
          title="Android Home"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Circle className="w-3.5 h-3.5" />
        </button>

        {/* Recents */}
        <button
          type="button"
          onClick={handleRecentsPress}
          title="Android Recents / Overview"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <div className="w-6 h-px bg-slate-800 my-0.5" />

        {/* Mini Logs / Quick Settings Drawer (in Standalone Phone Mode) */}
        {onToggleMiniDrawer && (
          <button
            type="button"
            onClick={onToggleMiniDrawer}
            title="Toggle Quick Device & Logcat Drawer"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              miniDrawerOpen
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
          </button>
        )}

        {/* Download .bat / .sh Desktop Launcher */}
        {onOpenLauncherModal && (
          <button
            type="button"
            onClick={onOpenLauncherModal}
            title="Download Windows (.bat) / macOS & Linux (.sh) Standalone Phone Launcher"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sky-400 hover:bg-slate-800 hover:text-sky-300 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Expand / Collapse between Standalone Phone Mode & Full Studio Mode */}
        {onToggleStandaloneMode && (
          <button
            type="button"
            onClick={onToggleStandaloneMode}
            title={
              isStandalonePhoneMode
                ? 'Expand Full Studio Dashboard'
                : 'Collapse to Standalone Phone-Only View'
            }
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {isStandalonePhoneMode ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
