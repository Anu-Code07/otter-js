# PixelPaw 🦦

A tiny **pixel-art otter** that lives on your desktop while you code.

PixelPaw watches your desktop, reacts to your cursor, and alerts you when something needs your attention — Claude, permission dialogs, builds, terminals, git, and custom integrations.

> "I have a tiny otter living on my desktop while I code."

## Features

- **Transparent desktop overlay** — frameless, always-on-top pixel otter
- **Cursor reactions** — looks, approaches, interacts (with personality-driven randomness)
- **Attention framework** — unified system for multiple alert sources
- **Claude detection** — local process/window detection (no screenshots)
- **Permission dialog detection** — macOS/Windows/Linux window title heuristics
- **Build & terminal watchers** — monitor log files for failures and prompts
- **Git detection** — merge conflicts and dirty states
- **Integration webhook** — local HTTP API for VS Code, CI, custom tools
- **System tray** — pause, settings, quick controls
- **Do not disturb** — scheduled quiet hours
- **Developer simulation** — test all attention sources without real triggers
- **Privacy-first** — everything runs locally

## Install & Run (easiest — Mac or Windows)

Requires **Node.js 18+**.

### One-liner (no install)

```bash
npx pixel-paw
```

### Global install

```bash
npm install -g pixel-paw
pixel-paw
```

First run downloads Electron (~150MB) — this is normal.

| Platform | After launch |
|----------|----------------|
| **Mac** | Otter on desktop + menu bar tray icon |
| **Windows** | Otter on desktop + system tray icon |

**Mac:** If permission detection is weak, grant **System Settings → Privacy & Security → Accessibility** to Terminal or your terminal app.

**Windows:** Allow through SmartScreen if prompted on first Electron download.

### Tray & controls

- **Right-click otter** → Pause, Settings, Quit  
- **Tray icon** → Settings, toggle alerts, quit  
- **Settings → Developer Mode** → test alerts without real triggers

---

## Quick Start (from source)

### Mac

```bash
git clone https://github.com/Anu-Code07/otter-js.git pixel-paw
cd pixel-paw
npm install
npm run dev
```

### Windows (PowerShell)

```powershell
git clone https://github.com/Anu-Code07/otter-js.git pixel-paw
cd pixel-paw
npm install
npm run dev
```

### Build an installer

```bash
npm run build
npm run package
```

| Platform | Output |
|----------|--------|
| macOS | `release/PixelPaw-x.x.x.dmg` |
| Windows | `release/PixelPaw Setup x.x.x.exe` |
| Linux | `release/PixelPaw-x.x.x.AppImage` |

**Mac first launch:** Right-click app → Open (unsigned apps).  
**Windows:** SmartScreen → More info → Run anyway (self-built).

## How to Use

### Desktop otter

| Action | Result |
|--------|--------|
| Hover near otter | Looks toward cursor |
| Click otter | Wave, excited, speech bubbles |
| Drag otter | Reposition on desktop |
| Right-click | Pause, settings, quit |

### Settings

Open via tray → **Settings** or right-click otter → **Settings**.

| Section | Options |
|---------|---------|
| **General** | Size, opacity, startup, always on top |
| **Behaviour** | Follow cursor, wandering, sleep |
| **Attention Alerts** | Master toggle, notifications, DND hours |
| **Attention Sources** | Per-source detect/alert toggles |
| **Appearance** | Pet selector (otter available now) |
| **Developer Mode** | Simulate all attention sources |

### Attention Sources

| Source | What it detects |
|--------|-----------------|
| **Claude** | Claude Desktop process + window state |
| **Permission** | OS permission/access dialogs |
| **Build / CI** | Failures/success in `build.log` |
| **Terminal** | Prompts and errors in `terminal.log` |
| **Git** | Merge conflicts in repo |
| **Integration** | Webhook from VS Code, scripts, CI |

### Log watching

```bash
mkdir -p ~/.pixelpaw
npm run build 2>&1 | tee ~/.pixelpaw/build.log
npm test 2>&1 | tee ~/.pixelpaw/terminal.log
```

Or set custom paths in Settings → Attention Sources.

### Webhook integration

```bash
curl -X POST http://127.0.0.1:47832/attention \
  -H 'Content-Type: application/json' \
  -d '{"status":"needs_user","message":"CI failed","title":"GitHub Actions"}'
```

See [integrations/README.md](integrations/README.md) for VS Code extension and API docs.

### macOS permissions

For Claude and permission detection, grant **Accessibility** access:

**System Settings → Privacy & Security → Accessibility** → add PixelPaw (or Terminal when running from source).

## Architecture

```text
Attention Sources → AttentionManager → IPC → Pet State Machine → Otter
     ↑
  Claude / Permission / Build / Terminal / Git / Webhook
```

```text
pixel-paw/
├── electron/services/attention/   # Attention framework
├── electron/platform/             # OS-specific detection
├── src/pets/                      # Pet definitions + registry
├── integrations/                  # VS Code extension, webhook docs
└── public/assets/pets/otter/      # Pixel sprites (64×64 PNG)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development mode |
| `npm run build` | Production build |
| `npm run package` | Create OS installer |
| `npm run test` | Run tests |
| `npm run lint` | ESLint |

## Privacy

- ❌ No keyboard recording
- ❌ No screenshot uploads
- ❌ No cloud telemetry
- ❌ No conversation access
- ✅ Local webhook on `127.0.0.1` only
- ✅ OS signals and optional log files only

## Adding Pets

1. Add sprites to `public/assets/pets/<animal>/`
2. Create `src/pets/<animal>/definition.ts`
3. Register in `src/pets/registry.ts`

## Adding Attention Sources

1. Create `electron/services/attention/MySource.ts` extending `BaseAttentionSource`
2. Register in `AttentionManager.ts`
3. Add settings toggles in `src/types/system.ts`
4. Add UI in `SettingsWindow.tsx`

## License

MIT
