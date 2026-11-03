import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CloudDownload,
  Code2,
  Compass,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { LogEntry, NetworkRequestEntry, SimulatorConfig } from '../types/simulator';

interface FlutterSandboxAppProps {
  config: SimulatorConfig;
  onEmitLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onEmitNetwork: (req: Omit<NetworkRequestEntry, 'id' | 'timestamp'>) => void;
  backSignal: number;
}

interface SandboxTask {
  id: string;
  title: string;
  route: string;
  completed: boolean;
  renderMs: number;
}

export const FlutterSandboxApp: React.FC<FlutterSandboxAppProps> = ({
  config,
  onEmitLog,
  onEmitNetwork,
  backSignal,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'network' | 'forms'>('home');
  const [counter, setCounter] = useState<number>(4);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [apiResponseText, setApiResponseText] = useState<string | null>(null);
  const [formInput, setFormInput] = useState<string>('');
  const [tasks, setTasks] = useState<SandboxTask[]>([
    { id: 't-1', title: 'Verify SliverAppBar pinned scroll physics', route: '/home/slivers', completed: true, renderMs: 2.4 },
    { id: 't-2', title: 'Test Material 3 adaptive color scheme', route: '/theme/m3', completed: true, renderMs: 1.8 },
    { id: 't-3', title: 'Profile list item rebuilds at 60fps', route: '/profile/list', completed: false, renderMs: 4.1 },
    { id: 't-4', title: 'Validate offline retry state handling', route: '/api/sync', completed: false, renderMs: 3.2 },
  ]);

  // React to hardware Back button press
  React.useEffect(() => {
    if (backSignal > 0 && activeTab !== 'home') {
      setActiveTab('home');
      onEmitLog({
        level: 'debug',
        tag: 'flutter',
        message: 'Navigator.pop(context) -> returned to /home route',
      });
    }
  }, [backSignal]);

  const animDuration = config.slowAnimations ? 'duration-1000' : 'duration-150';
  const isDark = config.darkMode;

  const debugBorder = config.debugPaintSizeEnabled
    ? 'outline outline-1 outline-cyan-400/80 relative'
    : '';

  const handleIncrement = () => {
    const next = counter + 1;
    setCounter(next);
    onEmitLog({
      level: 'info',
      tag: 'flutter',
      message: `setState(() { _counter = ${next}; }) — Dirty widget rebuilt in 1.2ms`,
    });
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = !item.completed;
          onEmitLog({
            level: 'debug',
            tag: 'flutter',
            message: `CheckboxListTile(${item.route}) changed -> ${updated}`,
          });
          return { ...item, completed: updated };
        }
        return item;
      })
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.trim()) return;
    const newTask: SandboxTask = {
      id: `t-${Date.now()}`,
      title: formInput.trim(),
      route: '/custom/widget',
      completed: false,
      renderMs: Number((Math.random() * 2.5 + 1.2).toFixed(1)),
    };
    setTasks((prev) => [newTask, ...prev]);
    setFormInput('');
    onEmitLog({
      level: 'info',
      tag: 'flutter',
      message: `SliverList inserted item "${newTask.title}" (Key: ValueKey('${newTask.id}'))`,
    });
  };

  const handleDeleteTask = (id: string, title: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    onEmitLog({
      level: 'warn',
      tag: 'flutter',
      message: `Dismissible removed "${title}" from widget tree`,
    });
  };

  const handleTriggerApiCall = (method: 'GET' | 'POST', endpoint: string) => {
    if (config.networkProfile === 'offline') {
      onEmitLog({
        level: 'error',
        tag: 'network',
        message: `SocketException: Failed host lookup '${endpoint}' (OS Error: Network is unreachable)`,
      });
      onEmitNetwork({
        method,
        endpoint,
        status: 0,
        durationMs: 4,
        sizeKb: '0.0 KB',
        responsePreview: 'SocketException: Offline mode active in DroidLite Simulator',
      });
      setApiResponseText('SocketException: Offline mode active. Toggle network profile to Wi-Fi or 4G.');
      return;
    }

    setIsLoadingApi(true);
    const simulatedLatency =
      config.networkProfile === 'wifi'
        ? Math.floor(Math.random() * 45 + 35)
        : config.networkProfile === '4g'
        ? Math.floor(Math.random() * 110 + 110)
        : Math.floor(Math.random() * 250 + 480);

    const effectiveDelay = config.slowAnimations ? simulatedLatency * 2.5 : simulatedLatency;

    setTimeout(() => {
      setIsLoadingApi(false);
      const payload = JSON.stringify(
        {
          ok: true,
          device: config.deviceId,
          gps: { lat: config.gpsLocation.lat, lng: config.gpsLocation.lng },
          battery: `${config.batteryLevel}%`,
          itemsSynced: tasks.length,
          latencyMs: simulatedLatency,
        },
        null,
        2
      );
      setApiResponseText(payload);

      onEmitNetwork({
        method,
        endpoint,
        status: method === 'POST' ? 201 : 200,
        durationMs: simulatedLatency,
        sizeKb: '1.8 KB',
        responsePreview: payload,
      });

      onEmitLog({
        level: 'info',
        tag: 'network',
        message: `HTTP ${method} ${endpoint} -> ${method === 'POST' ? 201 : 200} OK (${simulatedLatency}ms via ${config.networkProfile.toUpperCase()})`,
      });
    }, effectiveDelay);
  };

  const handleThrowTestError = () => {
    onEmitLog({
      level: 'error',
      tag: 'flutter',
      message:
        '══╡ EXCEPTION CAUGHT BY WIDGETS LIBRARY ╞══ RenderFlex overflowed by 24 pixels on the right.',
    });
  };

  return (
    <div
      style={{ fontSize: `${config.textScaleFactor * 100}%` }}
      className={`h-full w-full flex flex-col select-none transition-colors ${animDuration} ${
        isDark ? 'bg-[#0F141C] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Optional Flutter Performance Overlay (60fps UI & Raster Threads) */}
      {config.showPerformanceOverlay && (
        <div className="bg-black/90 border-b border-emerald-500/40 px-3 py-1.5 text-[10px] font-mono text-emerald-300 shrink-0 z-20">
          <div className="flex items-center justify-between">
            <span>UI Thread: 60.0 FPS (2.1 ms/frame)</span>
            <span>Max: 16.6 ms</span>
          </div>
          <div className="flex items-end gap-0.5 h-4 mt-1">
            {[22, 18, 25, 19, 30, 24, 16, 21, 28, 19, 20, 42, 23, 18, 22, 20, 17, 25, 21, 19, 24, 22, 18, 20].map(
              (val, idx) => (
                <div
                  key={idx}
                  style={{ height: `${val}%` }}
                  className={`flex-1 rounded-t-xs ${val > 38 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
              )
            )}
          </div>
          <div className="flex items-center justify-between mt-1 text-sky-300">
            <span>Raster Thread (Impeller): 60.0 FPS (3.4 ms)</span>
            <span>~28 MB Heap</span>
          </div>
        </div>
      )}

      {/* Flutter Material 3 AppBar */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b shrink-0 ${debugBorder} ${
          isDark
            ? 'bg-[#151C28] border-slate-800/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">Flutter M3 Debug Sandbox</span>
          </div>
          <p className={`text-[11px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Impeller · {config.gpsLocation.name.split('(')[0].trim()}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleThrowTestError}
            title="Simulate Flutter RenderFlex Exception"
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              isDark
                ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Test Error
          </button>
        </div>
      </div>

      {/* Main Scrollable Viewport */}
      <div className={`flex-1 overflow-y-auto px-3.5 py-3 space-y-3 ${debugBorder}`}>
        {activeTab === 'home' && (
          <>
            {/* Stateful Counter & Metrics Row */}
            <div className={`grid grid-cols-2 gap-2.5 ${debugBorder}`}>
              <div
                className={`p-3 rounded-xl border ${debugBorder} ${
                  isDark
                    ? 'bg-[#172030] border-slate-800/90'
                    : 'bg-white border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-400">Stateful Counter</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono tabular-nums text-sky-400">
                    {counter}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                  >
                    +1 State
                  </button>
                </div>
                <div className="mt-1.5 text-[10px] font-mono text-slate-400">
                  ValueNotifier&lt;int&gt;
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${debugBorder} ${
                  isDark
                    ? 'bg-[#172030] border-slate-800/90'
                    : 'bg-white border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-400">Device Telemetry</div>
                <div className="mt-1 text-xs font-mono space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">TextScale:</span>
                    <span className="tabular-nums font-semibold">{config.textScaleFactor.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Net:</span>
                    <span className="uppercase font-semibold text-emerald-400">
                      {config.networkProfile}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GPS:</span>
                    <span className="tabular-nums">
                      {config.gpsLocation.lat.toFixed(1)}, {config.gpsLocation.lng.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Add Widget Item */}
            <form onSubmit={handleAddTask} className={`flex gap-1.5 ${debugBorder}`}>
              <input
                type="text"
                value={formInput}
                onChange={(e) => setFormInput(e.target.value)}
                placeholder="Add item to SliverList..."
                className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-xs border focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-[#151C28] border-slate-800 text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            {/* SliverList Items */}
            <div className={`space-y-2 ${debugBorder}`}>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                <span>SliverList.separated ({tasks.length} widgets)</span>
                <span className="font-mono">RepaintBoundary</span>
              </div>

              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${animDuration} ${debugBorder} ${
                    isDark
                      ? 'bg-[#151C28] border-slate-800/80 hover:border-slate-700'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="flex items-start gap-2.5 text-left min-w-0 flex-1"
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        task.completed
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : isDark
                          ? 'border-slate-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-medium leading-snug ${
                          task.completed ? 'line-through opacity-55' : ''
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {task.route} · {task.renderMs}ms
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id, task.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors shrink-0"
                    title="Dismiss widget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'network' && (
          <div className={`space-y-3 ${debugBorder}`}>
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#151C28] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold">HTTP & Dio Client Sandbox</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Test how your Flutter app handles network throttling, offline errors, and GPS headers.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  disabled={isLoadingApi}
                  onClick={() => handleTriggerApiCall('GET', '/api/v1/user/profile')}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  GET /profile
                </button>
                <button
                  type="button"
                  disabled={isLoadingApi}
                  onClick={() => handleTriggerApiCall('POST', '/api/v1/telemetry/sync')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  POST /sync
                </button>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border font-mono text-[11px] ${
                isDark ? 'bg-[#0B0F17] border-slate-800 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 pb-1.5 mb-2 border-b border-slate-800">
                <span>Response Inspector</span>
                <span>Profile: {config.networkProfile.toUpperCase()}</span>
              </div>
              {isLoadingApi ? (
                <div className="py-6 flex items-center justify-center gap-2 text-sky-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Awaiting HTTP response...</span>
                </div>
              ) : apiResponseText ? (
                <pre className="whitespace-pre-wrap break-all text-[10px] leading-relaxed text-emerald-300">
                  {apiResponseText}
                </pre>
              ) : (
                <div className="py-5 text-center text-slate-500">
                  Tap GET or POST above to inspect HTTP latency and payload.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'forms' && (
          <div className={`space-y-3 ${debugBorder}`}>
            <div
              className={`p-3 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-[#151C28] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold">Layout & Accessibility Stress Test</div>
              <p className="text-[11px] text-slate-400">
                Use the simulator controls on the left to adjust Text Scale ({config.textScaleFactor}x) or toggle Debug Paint.
              </p>
              <div className="pt-1 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40">
                  <span className="text-slate-400">MediaQuery.textScaler</span>
                  <span className="font-mono font-semibold">{config.textScaleFactor.toFixed(2)}x</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40">
                  <span className="text-slate-400">ThemeMode</span>
                  <span className="font-mono font-semibold">{config.darkMode ? 'ThemeMode.dark' : 'ThemeMode.light'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">debugPaintSizeEnabled</span>
                  <span className="font-mono font-semibold">{String(config.debugPaintSizeEnabled)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FloatingActionButton */}
      <div className="px-4 pb-2 flex justify-end pointer-events-none">
        <button
          type="button"
          onClick={handleIncrement}
          className={`pointer-events-auto px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center gap-1.5 text-xs font-semibold transition-transform active:scale-95 ${debugBorder}`}
        >
          <Plus className="w-4 h-4" />
          <span>Rebuild ({counter})</span>
        </button>
      </div>

      {/* Material 3 Bottom NavigationBar */}
      <div
        className={`h-14 border-t grid grid-cols-3 items-center px-2 shrink-0 ${debugBorder} ${
          isDark ? 'bg-[#151C28] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('home');
            onEmitLog({ level: 'debug', tag: 'flutter', message: 'NavigationBar selected index 0 (/home)' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'home'
              ? 'text-sky-400'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>Widgets</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('network');
            onEmitLog({ level: 'debug', tag: 'flutter', message: 'NavigationBar selected index 1 (/network)' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'network'
              ? 'text-sky-400'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span>HTTP API</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('forms');
            onEmitLog({ level: 'debug', tag: 'flutter', message: 'NavigationBar selected index 2 (/metrics)' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'forms'
              ? 'text-sky-400'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 mb-0.5" />
          <span>MediaQuery</span>
        </button>
      </div>
    </div>
  );
};
