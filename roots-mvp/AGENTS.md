# Roots

Performance acceleration toolkit for Vite. Works alongside Vite as a lightweight optimization layer — not a replacement.

## Architecture

```
Vite Build  ──>  dist/           (Vite produces production build)
                    │
                    ▼
Roots Plugin  ──>  roots.exe      (Vite closeBundle hook triggers Go binary)
                    │
                    ▼
Go Optimization Engine
  ├── Scanner     — walks dist/, classifies assets by type (.js/.css/.html/.svg)
  ├── Compressor  — generates .br (Brotli) and .gz (Gzip) for each asset
  ├── HTML Opt    — parses HTML, injects modulepreload/preconnect/dns-prefetch, minifies
  ├── Cache Gen   — writes roots-cache-manifest.json with SHA256 hashes & sizes
  └── Optimizer   — orchestrates pipeline, prints summary
```

## Directory Structure

```
roots-mvp/
├── src/
│   └── index.ts              Vite plugin (TypeScript)
├── roots/                    Go optimization engine (module: "roots")
│   ├── go.mod
│   ├── cmd/roots/
│   │   └── main.go           CLI entry point (roots build <dist-dir>)
│   └── internal/
│       ├── types/            Shared types, constants, helpers
│       ├── scanner/          File walker, SHA256 hashing, asset classification
│       ├── compressor/       Brotli + Gzip compression (parallel, semaphore-limited)
│       ├── htmlopt/          HTML parsing, link injection, whitespace minification
│       ├── cache/            Cache manifest JSON generation
│       └── optimizer/        Pipeline orchestrator + CLI summary output
├── bin/                      Compiled Go binary output
├── dist/                     Compiled TypeScript output
├── icons/                    Project branding assets
├── project/demo/             Example Vite + React project using Roots
├── package.json              npm package config
├── tsconfig.json             TypeScript config
└── AGENTS.md                 This file
```

## How It Works

### 1. Vite Plugin (`src/index.ts`)

```ts
import { roots } from "roots"

export default defineConfig({
  plugins: [roots()]
})
```

The plugin:
- Registers with `enforce: "post"` and `apply: "build"` (only runs during `vite build`)
- On `closeBundle`: locates the Go binary, spawns it as a child process with `shell: false` (safe from command injection)
- Prints a startup banner showing version and enabled features
- Passes the Vite output directory to the Go binary

### 2. Go Binary (`roots/cmd/roots/main.go`)

CLI interface:
```
roots build <dist-dir> [flags]
  --brotli     enable brotli compression (default: true)
  --gzip       enable gzip compression (default: true)
  --html       enable html optimization (default: true)
  --cache      enable cache manifest (default: true)
  --minify     enable asset minification (default: true)
  --out        output directory for cache manifest (default: same as dist)
```

### 3. Internal Packages

**Scanner** (`internal/scanner/`):
- Walks the dist directory recursively
- Classifies files by extension: `.js/.mjs/.cjs` → JS, `.css` → CSS, `.html/.htm` → HTML, `.svg` → SVG
- Computes SHA256 hash (first 16 bytes) for each asset
- Filters out `node_modules`, `.git`, `.br`, `.gz`, and cache manifest files

**Compressor** (`internal/compressor/`):
- Runs compression in parallel (max 4 goroutines via semaphore)
- Brotli: `github.com/andybalholm/brotli` at `DefaultCompression` (level 6)
- Gzip: Go stdlib `compress/gzip` at `BestCompression` (level 9)
- Skips HTML files and unknown types
- Writes `.br` and `.gz` files alongside originals

**HTML Optimizer** (`internal/htmlopt/`):
- Uses `golang.org/x/net/html` for parsing
- Finds all `<script type="module">` tags → injects `<link rel="modulepreload">` (deduplicates existing ones)
- Finds external origins (scheme + host) from `src`/`href` attributes → injects `<link rel="preconnect">` and `<link rel="dns-prefetch">`
- If `<head>` is missing, creates it
- Minifies HTML: removes newlines, tabs, collapses whitespace, strips spaces between tags

**Cache Generator** (`internal/cache/`):
- Writes `roots-cache-manifest.json` with per-asset metadata
- Each entry: path, SHA256 hash, original size, compressed size (best of brotli/gzip), MIME type
- Paths are relative to the dist directory (not output directory)

**Optimizer** (`internal/optimizer/`):
- Runs the pipeline: scan → compress → html optimize → cache manifest
- Clamps negative compression percentages to 0 (small files may grow due to compression overhead)
- Prints a clean summary with emoji header

## Data Flow

```
1. Vite finishes build → writes files to dist/
2. closeBundle hook fires → Vite plugin spawns roots.exe
3. Scanner walks dist/ → returns []Asset with paths, types, sizes, hashes
4. Compressor reads each JS/CSS/SVG file → writes .br and .gz
5. HTML Optimizer reads each HTML file → parses, injects links, minifies, writes back
6. Cache Generator collects all asset metadata → writes roots-cache-manifest.json
7. Optimizer prints summary to stdout → Vite plugin captures output
```

## Key Design Decisions

- **No Vite replacement**: Roots post-processes Vite output, doesn't hook into the build pipeline
- **Go for performance**: Compression and file scanning are CPU-bound; Go handles this efficiently
- **Shell-free spawn**: Plugin uses `spawn()` with `shell: false` to prevent command injection
- **Semaphore-limited parallelism**: Max 4 concurrent compression operations
- **Minimal dependencies**: Go only needs brotli and x/net; TS only needs Vite as peer dependency
- **Duplicate prevention**: Existing `modulepreload` links are detected before injection

## Dependencies

**Go** (`roots/go.mod`):
- `github.com/andybalholm/brotli` — Brotli compression
- `golang.org/x/net` — HTML parsing (`html` package)

**TypeScript** (`package.json`):
- `vite` (peer) — Plugin interface
- `tsup` (dev) — Build tool
- `typescript` (dev) — Type checking

## Building

```bash
# Build everything
npm run build:all

# Build only Go binary
npm run build:go

# Build only TypeScript plugin
npm run build

# Type check
npm run typecheck
```

## Development

```bash
# Watch mode for TS plugin
npm run dev
```

## Common Tasks for AI Agents

### Adding a new asset type
1. Add constant in `roots/internal/types/types.go`
2. Add case in `DetectAssetType()`
3. Add MIME type in `internal/cache/cache.go` → `detectMimeType()`
4. Add compression logic in `internal/compressor/compressor.go`
5. Add count in `internal/scanner/scanner.go` → `ScanStats`
6. Display in `internal/optimizer/optimizer.go` → `Summary()`

### Adding a new optimization feature
1. Create new package under `roots/internal/`
2. Add call in `internal/optimizer/optimizer.go` → `Run()`
3. Add CLI flag in `cmd/roots/main.go`
4. Add Vite plugin option in `src/index.ts` → `RootsOptions`
5. Display results in `Summary()`
