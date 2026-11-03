export type DeviceId = 'pixel-8-pro' | 'galaxy-s24-ultra' | 'pixel-7a' | 'redmi-note-13' | 'pixel-fold';

export interface DeviceProfile {
  id: DeviceId;
  name: string;
  manufacturer: string;
  androidVersion: string;
  apiLevel: number;
  widthDp: number;
  heightDp: number;
  resolutionPx: string;
  ppi: number;
  aspectRatio: string;
  bezelRadius: number;
  screenRadius: number;
  cutoutType: 'punch-center' | 'punch-small' | 'fold-crease';
  frameColor: string;
  ramProfile: string;
}

export type SimulatorSourceMode = 'sandbox' | 'localhost' | 'usb-mirror';

export type PhoneSystemView = 'running-app' | 'home-screen' | 'recents' | 'lock-screen';

export type NetworkProfile = 'wifi' | '4g' | '3g-slow' | 'offline';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'debug' | 'warn' | 'error';
  tag: 'flutter' | 'network' | 'system' | 'adb';
  message: string;
}

export interface NetworkRequestEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  durationMs: number;
  sizeKb: string;
  responsePreview: string;
}

export interface WidgetNode {
  id: string;
  name: string;
  type: 'StatelessWidget' | 'StatefulWidget' | 'RenderObject' | 'Sliver';
  size: string;
  constraints: string;
  padding?: string;
  stateSummary?: string;
  children?: WidgetNode[];
}

export interface SimulatorConfig {
  deviceId: DeviceId;
  orientation: 'portrait' | 'landscape';
  zoomScale: number;
  sourceMode: SimulatorSourceMode;
  flutterServerUrl: string;
  flutterWebPort: string;
  // Flutter Debug Flags
  debugPaintSizeEnabled: boolean;
  showPerformanceOverlay: boolean;
  slowAnimations: boolean;
  showSafeAreaBounds: boolean;
  showTouchIndicator: boolean;
  darkMode: boolean;
  textScaleFactor: number;
  // Hardware & Sensors
  batteryLevel: number;
  isCharging: boolean;
  networkProfile: NetworkProfile;
  navMode: '3-button' | 'gesture';
  gpsLocation: {
    name: string;
    lat: number;
    lng: number;
  };
}
