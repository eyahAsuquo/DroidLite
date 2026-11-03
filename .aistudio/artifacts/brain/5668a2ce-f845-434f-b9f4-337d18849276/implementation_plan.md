# DroidLite Standalone Phone Window & Desktop Launchers

This upgrade transforms DroidLite so it can run as a **true standalone phone window**—just the realistic Android phone chassis and a slim vertical strip of hardware buttons on the side, matching the look and feel of Android Studio's standalone Emulator without any surrounding dashboard clutter. It also provides downloadable **Windows (`.bat`) and macOS/Linux (`.sh`) Desktop Launchers** that open DroidLite in a phone-sized (`460×920`) desktop window while automatically launching your Flutter dev server or borderless `scrcpy` physical phone mirror.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Why the Installed Desktop App Looked Like a Full Dashboard Before**
> Previously, installing the app opened the full 1440px 3-column studio workspace. With this update, launching the installed desktop app (or launching via `?mode=phone` / clicking **Standalone Phone Mode**) switches to a **Phone-Only View** with a slim vertical hardware toolbar right beside the phone bezel, and automatically resizes standalone desktop windows to fit the phone dimensions.

- **Confirmed Decision 1 (Window Layout)**: **Phone-only view with slim side toolbar** — hides all left/right studio panels and headers, leaving only the realistic Android device frame and a vertical strip of hardware controls (Power, Volume Up/Down, Rotate, Hot Reload, Back, Home, Recents, Debug Paint, and Expand Studio).
- **Confirmed Decision 2 (PC Desktop Launchers)**: **Windows `.bat` and macOS/Linux `.sh` launcher scripts** — one-click downloadable scripts that launch Chrome/Edge in `--app` chromeless window mode sized strictly to the phone (`--window-size=470,920`).
- **Confirmed Decision 3 (Automated Workflows)**: **Auto-launch Flutter web-server & Auto-launch borderless Scrcpy** — the desktop launcher scripts automatically start `flutter run -d web-server --web-port=5050` in your Flutter project folder (or launch borderless `scrcpy` for a physical USB phone) and pipe it straight into the standalone phone window.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Standalone Phone Mode (In-App, Pop-Out, & Installed PWA Default)**: Collapses the surrounding studio workspace so only the Android phone frame and a docked vertical hardware bar are visible. Includes a **Pop-Out Standalone Phone Window** button that spawns a dedicated `470×920` desktop window containing only the phone and side toolbar.
  2. **One-Click Windows `.bat` & macOS/Linux `.sh` Desktop Launchers**: Generates customized, downloadable launcher scripts (`DroidLite-Flutter-Emulator.bat` and `droidlite-emulator.sh`) that you can drop into any Flutter project or your desktop. Double-clicking the script starts your Flutter app on port `5050` (or connects to your USB phone via `scrcpy`) and opens the compact standalone phone window automatically.
- **Target Audience / Persona**: Flutter developers on Windows, macOS, or Linux who want the exact visual ergonomics of a standalone Android phone emulator window on their desktop with near-zero RAM/CPU usage.
- **Key Value**: Eliminates the 4GB+ RAM overhead of QEMU/AVD while giving you a dedicated, phone-sized window right next to VS Code or Android Studio.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Instant Standalone Phone Mode Toggle**: Clicking **Standalone Phone View** (or launching with `?mode=phone` or in installed standalone mode) switches the viewport to the compact phone-only layout with the slim right-hand vertical hardware bar.
  2. **Pop-Out Phone Window**: Clicking **Pop-Out Phone Window** opens a chromeless `470×920` window resized to wrap the phone chassis and its slim vertical toolbar.
  3. **Download & Run `.bat` / `.sh` Desktop Launcher**: From the **Desktop Launchers** modal or toolbar button, download `DroidLite-Flutter-Emulator.bat` (Windows) or `droidlite-emulator.sh` (macOS/Linux). Double-clicking it on your PC starts `flutter run -d web-server --web-port=5050` and opens the standalone phone window pointed directly at your live Flutter app.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Hardware-authentic Android Emulator appliance—matte obsidian/titanium phone chassis paired with a dark anthracite vertical utility rail (`#111827` surface, `#1E293B` 1px border).
  - *Color Palette & Mood*: Deep neutral slate background (`#0B0F17`), subtle structural tool rail (`#111827`), high-intent electric blue (`#2563EB`) and sky (`#38BDF8`) active indicators for active debug overlays (`Debug Paint`, `60fps Perf Overlay`, `Hot Reload`).
  - *Typography & Hierarchy*: `Plus Jakarta Sans` for crisp UI controls and tooltips; `JetBrains Mono` (`tabular-nums`) for device dimensions, port numbers, and frame timing metrics.
  - *Component Styling & Layout*:
    - **Full Studio Mode**: 1440px 3-zone header + 12-column studio grid (Left hardware controls, Center phone viewport, Right Logcat/Widget Inspector).
    - **Standalone Phone Mode**: Centered compact container (`phone chassis + 48px vertical hardware toolbar`) with zero outer dashboard panels, plus a slide-over mini-drawer if the user clicks the Logcat/Inspector icon on the side rail.
- **Interactive Feedback & Motion**: Smooth 150ms transitions between Studio Mode and Standalone Phone Mode, tactile button depression on hardware keys, and real-time Android 14 On-Screen Display (Volume HUD, Quick Settings shade, and Lock/Home/Recents transitions).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mode Architecture (Standalone Phone Mode vs. Full Studio Mode)**
  - *Chosen Approach*: Default to **Standalone Phone Mode** when launched with `?mode=phone`, when popped out into a phone-sized window (`window.innerWidth < 640`), or when toggled by the user, while keeping a single button on the bottom of the vertical side toolbar to expand back into the full 3-column Studio Inspector whenever deep Logcat/Widget inspection is needed.
  - *Why*: Directly solves the issue where the installed desktop app looked like a full webpage instead of a standalone phone emulator like Android Studio's AVD window.
  - *Alternatives Considered*: Removing the Logcat and Widget Inspector completely—rejected because developers still need quick access to logs and ADB commands via a toggle or slide-over drawer.
- **Decision 2: Native OS `.bat` and `.sh` Launcher Generator**
  - *Chosen Approach*: Provide downloadable `DroidLite-Flutter-Emulator.bat` (Windows) and `droidlite-emulator.sh` (macOS/Linux) scripts with an interactive menu (Option 1: Launch Standalone Flutter Phone Simulator + `flutter run -d web-server`; Option 2: Launch Borderless Physical Phone Mirror via `scrcpy`; Option 3: Start Local ADB Bridge + Phone Window).
  - *Why*: Browsers cannot resize an existing main tab cleanly due to security restrictions, whereas launching Chrome/Edge from a `.bat`/`.sh` script with `--app="<URL>?mode=phone" --window-size=470,920` creates an authentic, standalone phone-sized desktop window every time.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DroidLite Application Shell                       │
│         (Detects ?mode=phone, Standalone PWA, or User View Mode)        │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
      [Standalone Phone Mode]                [Full Studio Mode]
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│   Compact Phone + Side Rail Layout    │ │ 3-Column Developer Workspace  │
│ ┌─────────────────────────┬─────────┐ │ │ ┌─────────┬─────────┬───────┐ │
│ │                         │ [Power] │ │ │ │Hardware │ Phone   │Logcat │ │
│ │                         │ [Vol +] │ │ │ │& Sensor │ Chassis │Widget │ │
│ │     Android Hardware    │ [Vol -] │ │ │ │Controls │         │Tree & │ │
│ │      Phone Chassis      │ [Rotate]│ │ │ │         │         │HTTP   │ │
│ │   (Sandbox / Localhost  │ [Reload]│ │ │ └─────────┴─────────┴───────┘ │
│ │      / USB Mirror)      │ [Paint] │ │ └───────────────────────────────┘
│ │                         │ [Back]  │ │
│ │                         │ [Home]  │ │ ┌───────────────────────────────┐
│ │                         │ [Recent]│ │ │ Desktop Launcher Generator    │
│ │                         │ [Logs]  │ │ │ • Windows (.bat) Script       │
│ │                         │ [Studio]│ │ │ • macOS / Linux (.sh) Script  │
│ └─────────────────────────┴─────────┘ │ │ • Pop-Out 470x920 Window API  │
└───────────────────────────────────────┘ └───────────────────────────────┘
```

- **Data Model & State**:
  - `viewLayoutMode`: `'standalone-phone' | 'full-studio'` — persisted in `localStorage` and automatically initialized to `'standalone-phone'` when URL contains `?mode=phone`, when running in a narrow standalone window (`< 640px`), or when toggled by the user.
  - `miniLogsDrawerOpen`: `boolean` — allows viewing live Flutter/ADB logs as a compact overlay drawer while staying inside Standalone Phone Mode.
  - `launcherConfig`: Stores the user's preferred Flutter port (`5050`), project path (optional), device profile (`pixel-8-pro`), and default launch mode (`flutter-web` vs `scrcpy-borderless`) to dynamically generate the `.bat` and `.sh` launcher files.
- **Interactive Component & State Mapping**:
  - **Slim Vertical Hardware Rail**: 44×44px accessible icon buttons docked directly to the right of the phone frame:
    - `Power`: Toggles lock screen / wake state.
    - `Volume Up` / `Volume Down`: Adjusts Android stream volume and triggers on-screen Android 14 Volume HUD.
    - `Rotate`: Rotates phone between Portrait and Landscape and adjusts container dimensions.
    - `Hot Reload (⚡)`: Reloads the connected `localhost` Flutter app or sandbox state.
    - `Debug Paint / 60fps Overlay`: Toggles Flutter layout bounds and frame timing graphs directly from the rail.
    - `Back` / `Home` / `Recents`: Triggers Android system navigation.
    - `Mini Logs Drawer`: Opens a compact overlay log viewer without leaving Standalone Phone Mode.
    - `Pop-Out Window` / `Switch to Full Studio`: Opens a resized `470×920` standalone window or expands back to the 3-column Studio view.
