# demo

Electron + React + TypeScript app built with [`electron-vite`](https://electron-vite.org) that scaffolds Vite projects via a GUI installer wizard.

## Architecture

```
User clicks install ──>  Renderer (React/MemoryRouter)
                              │
                    IPC invoke via contextBridge
                              │
                              ▼
                     Main Process (Node)
                    ┌─────────────────────┐
                    │  createProject()    │
                    │  ─> npx create-vite │
                    │  ─> npm install     │
                    │  ─> npm install -D  │
                    └─────────────────────┘
                              │
                    IPC send (progress events)
                              │
                              ▼
                    Renderer progress bar
```

Roots (Go optimization engine) runs as a Vite plugin on the renderer build:

```
electron-vite build  ──>  out/renderer/
                              │
                    closeBundle hook
                              │
                              ▼
                   roots.exe (Go binary)
                    ├── Brotli compression (.br)
                    ├── Gzip compression (.gz)
                    ├── HTML optimization (modulepreload, preconnect, minify)
                    └── Cache manifest (roots-cache-manifest.json)
```

Roots plugin lives in `scripts/roots-plugin.ts`. During build, `config.root` points to the renderer source directory, so `process.cwd()` is used to locate `bin/roots.exe` and `out/renderer/` at the project root.

Three Electron processes:

| Directory | Role | tsconfig |
|-----------|------|----------|
| `src/main/index.ts` | Main process entry: window mgmt, IPC handlers, project creation | `tsconfig.node.json` |
| `src/preload/index.ts` | Context bridge (`electron` + `api` objects) | `tsconfig.node.json` |
| `src/preload/index.d.ts` | Global `Window` type augmentation | — |
| `src/renderer/src/` | React SPA (wizard screens) | `tsconfig.web.json` |
| `scripts/roots-plugin.ts` | Vite plugin that spawns Go binary after renderer build | — |
| `bin/roots.exe` | Pre-compiled Go optimization binary | — |

## Directory Structure

```
src/
├── main/
│   └── index.ts              Main process (Node)
├── preload/
│   ├── index.ts              Preload bridge (contextBridge)
│   └── index.d.ts            Window type augmentation
└── renderer/
    ├── index.html            Entry HTML (CSP, Google Fonts)
    └── src/
        ├── main.tsx          React entry (MemoryRouter)
        ├── App.tsx           Route definitions + Layout wrapper
        ├── env.d.ts          Renderer-side Window type
        ├── assets/
        │   ├── base.css      CSS variables, reset
        │   └── main.css      Tailwind directives, installer-window, titlebar
        └── components/
            ├── InstallerContext.tsx  Global state (projectName, features, diskSpace, etc.)
            ├── Layout.tsx            Sidebar + titlebar + step navigation
            ├── Footer.tsx            Shared Back/Next buttons
            ├── WelcomeScreen.tsx     Step 1: intro
            ├── DetailsScreen.tsx     Step 2: project name input
            ├── FeaturesScreen.tsx    Step 3: feature toggles (TS/Tailwind/ESLint/Prettier)
            ├── LocationScreen.tsx    Step 4: path selector, disk space, install trigger
            └── Versions.tsx          Electron/Chrome/Node version display (unused in wizard)
```

## How It Works

### 1. Main Process (`src/main/index.ts`)

Creates a frameless, transparent, non-resizable `BrowserWindow` (960×620). IPC handlers:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `window-minimize` | renderer → main | Minimize window |
| `window-close` | renderer → main | Close window |
| `get-disk-space` | renderer ⇄ main | `fs.promises.statfs()` for drive capacity |
| `select-directory` | renderer ⇄ main | `dialog.showOpenDialog` (folder picker) |
| `create-project` | renderer ⇄ main | Scaffold + install a Vite project |
| `project-progress` | main → renderer | Streaming progress events during install |

`create-project` handler:
1. Creates target directory
2. Runs `npx create-vite@latest "<name>" --template react-ts`
3. Runs `npm install`
4. If `tw` feature: installs `tailwindcss@3 postcss autoprefixer`
5. If `pret` feature: installs `prettier eslint-config-prettier`

### 2. Preload (`src/preload/index.ts`)

Exposes two objects via `contextBridge.exposeInMainWorld`:
- `window.electron` — from `@electron-toolkit/preload` (`ipcRenderer` proxy)
- `window.api` — custom API with `getDiskSpace`, `selectDirectory`, `createProject`, `onProjectProgress`

### 3. Renderer Screens

Uses `MemoryRouter` (no URL bar). Four steps, each guarded by `InstallerContext`:

| Step | Screen | Route | Gate |
|------|--------|-------|------|
| 1 | WelcomeScreen | `/` | none |
| 2 | DetailsScreen | `/details` | projectName non-empty |
| 3 | FeaturesScreen | `/features` | at least one feature checked |
| 4 | LocationScreen | `/location` | enough disk space |

`Layout.tsx` renders sidebar + titlebar + main content. Sidebar has a 4-step stepper with navigation gating. Titlebar has minimize/close buttons that send IPC messages.

`Footer.tsx` provides Back/Next buttons, used by every screen.

### 4. InstallerContext (`InstallerContext.tsx`)

React Context providing global wizard state:

```ts
interface InstallerState {
  projectName: string
  features: Feature[]          // [{id, label, desc, icon, checked, sizeMB}]
  totalSizeMB: number
  diskSpace: { free: number; total: number } | null
  installPath: string          // default: C:\Program Files\ViteInstaller
  isInstalling: boolean
}
```

Default features:
- **TypeScript** (checked, 85 MB) — always included
- **Tailwind CSS** (checked, 45 MB)
- **ESLint** (unchecked, 25 MB)
- **Prettier** (unchecked, 18 MB)

### 5. Project Creation Flow

```
1. Main process receives `create-project` IPC
2. Creates project dir on disk
3. Sends progress: scaffold (5%) → npx create-vite (15%)
4. Runs npm install in project dir (35%)
5. Installs extra devDeps if requested (55%)
6. Finalizes (90%) → sends success (100%)
7. All progress sent as `project-progress` IPC events
8. Renderer displays progress bar via `onProjectProgress` listener
```

### 6. Styling

- **Tailwind CSS**: dark mode via `class` strategy (`<html class="dark">`)
- **Custom tokens**: `tailwind.config.js` defines a custom color palette (Material 3 style), spacing (`stack-sm`, `gutter-md`, `app-width`), border radii, font sizes, font families
- **Font**: Hanken Grotesk (Google Fonts) + Material Symbols Outlined (icon font)
- **Window**: `<html>` and `<body>` have `border-radius: 16px`, scrollbars hidden everywhere
- **CSP**: Inline styles allowed, fonts from `https://fonts.googleapis.com` and `https://fonts.gstatic.com`, images from `data:` and `https:`

## Data Flow

```
1. User opens app → WelcomeScreen shown
2. User clicks "Start Setup" → navigate to /details
3. User enters project name → state stored in InstallerContext
4. User clicks Next → navigate to /features
5. User toggles features → state updated in InstallerContext
6. User clicks Next → navigate to /location
7. User browses target folder → selectDirectory IPC → path stored
8. User clicks "Kurulumu Başlat" → createProject IPC sent
9. Main process begins scaffolding → sends progress IPC events
10. Renderer shows progress bar with percent
11. On success → "Kurulum başarıyla tamamlandı!"
    On error → error message displayed
```

## Key Design Decisions

- **electron-vite over plain Vite**: Handles HMR and bundling for all 3 Electron processes (main/preload/renderer) in one config
- **Frameless transparent window**: Custom titlebar with IPC-based minimize/close (no native titlebar)
- **MemoryRouter**: No URL bar needed in Electron; React Router still provides navigation gating
- **create-vite for scaffolding**: Delegates project creation to Vite's official CLI tool (reliable, always up-to-date)
- **Shell exec via `execAsync`**: Uses `child_process.exec` with `windowsHide: true` for scaffold/install commands
- **Context over Redux/Zustand**: Simple 4-step wizard doesn't need external state management
- **Turkish UI**: User-facing strings are in Turkish (e.g., "Kurulum Klasörünü Seçin")
- **Sandbox disabled**: `sandbox: false` in webPreferences (required for Node integration in preload)
- **No test framework**: Not configured; manual testing only

## Dependencies

**Runtime** (`dependencies`):
- `@electron-toolkit/preload` — Preload utilities (expose electron API)
- `@electron-toolkit/utils` — Main process utilities (app model ID, window shortcuts)
- `react-router-dom` — Client-side routing (MemoryRouter)
- `tailwindcss`, `postcss`, `autoprefixer` — CSS framework

**Dev** (`devDependencies`):
- `electron` — Runtime
- `electron-vite` — Build/dev tool for Electron + Vite
- `electron-builder` — Packaging for Windows/macOS/Linux
- `@vitejs/plugin-react` — Vite React plugin
- `react`, `react-dom` — UI library
- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- `eslint`, `@electron-toolkit/eslint-config-ts`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` — Linting
- `prettier`, `@electron-toolkit/eslint-config-prettier` — Formatting

## Building

```bash
# Development (HMR for all 3 processes)
npm run dev

# Type check (separate from dev, NOT automatic)
npm run typecheck         # both node + web
npm run typecheck:node    # main + preload only
npm run typecheck:web     # renderer only

# Production build (roots Go binary + typecheck + electron-vite build)
npm run build

# Build Roots Go binary only (from roots-mvp/roots source)
npm run build:roots

# Build + package for distribution
npm run build:win          # Windows (NSIS installer)
npm run build:mac          # macOS (DMG)
npm run build:linux        # Linux (AppImage + snap + deb)

# Preview built output (no build step)
npm start

# Lint
npm run lint               # eslint --cache .

# Format
npm run format             # prettier --write .

# Postinstall (automatic)
npm install                # also runs electron-builder install-app-deps
```

## Common Tasks for AI Agents

### Adding a new wizard screen
1. Create component in `src/renderer/src/components/`
2. Add `<Route>` in `App.tsx`
3. Add step entry in `Layout.tsx` `steps` array
4. Wire Footer with Back/Next navigation

### Adding a new IPC handler
1. Add `ipcMain.handle` / `ipcMain.on` in `src/main/index.ts`
2. Add method in `src/preload/index.ts` `api` object
3. Add type signature in `src/renderer/src/env.d.ts`
4. If needed, also update `src/preload/index.d.ts`

### Adding a new feature toggle
1. Add entry in `InstallerContext.tsx` `defaultFeatures` array
2. Handle the feature's `id` in `src/main/index.ts` `create-project` handler
3. Add the feature as a conditional `features.includes('...')` block

### Debugging in VS Code
- Launch configs in `.vscode/launch.json`:
  - `Debug All` — compound of main + renderer debug
  - `Debug Main Process` — runs `electron-vite --sourcemap`
  - `Debug Renderer Process` — attaches Chrome debugger on port 9222

### Building Roots binary from source
- Go source in `roots-mvp/roots/` — run `npm run build:roots` to recompile
- Output goes to `bin/roots.exe`
- Included automatically in `npm run build` pipeline

### Understanding build output
- `out/main/` — compiled main process
- `out/preload/` — compiled preload
- `out/renderer/` — compiled renderer (Vite bundle)
- `dist/` — electron-builder output (installers)

Roots creates the following inside the renderer output (e.g., `out/renderer/`):
- `*.br` / `*.gz` — Brotli/Gzip compressed versions of JS/CSS/SVG assets
- `roots-cache-manifest.json` — SHA256 hashes, sizes, MIME types per asset
- Modified `index.html` — modulepreload/preconnect/dns-prefetch links injected, minified

### Style conventions
- Prettier: `singleQuote: true`, `semi: false`, `printWidth: 100`, `trailingComma: none` (`.prettierrc.yaml`)
- EditorConfig: 2-space indent, LF line endings, trailing newline (`.editorconfig`)
- Prettier ignores: `out/`, `dist/`, lockfiles, tsconfig files (`.prettierignore`)
- ESLint: flat config (`eslint.config.mjs`) with React + Hooks + Refresh rules
- All CSS via Tailwind utility classes (no separate component CSS files)
