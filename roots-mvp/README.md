<div align="center">
  <h1>Roots</h1>
  <p><strong>Performance acceleration toolkit for Vite</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Go-1.21%2B-00ADD8" alt="Go">
    <img src="https://img.shields.io/badge/Node-18%2B-339933" alt="Node">
    <img src="https://img.shields.io/badge/Vite-5%2B-646CFF" alt="Vite">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  </p>
  <p><em>Install once → everything becomes faster.</em></p>
</div>

---

Roots works alongside Vite as a lightweight optimization layer. It post-processes your production build to reduce asset sizes, improve loading performance, and generate cache metadata — all with zero configuration.

**Roots is not a replacement for Vite.** It hooks into Vite's build pipeline and optimizes the output automatically.

---

## Features

| Feature | Description |
|---------|-------------|
| **Brotli Compression** | Generates `.br` files for JS, CSS, and SVG assets with up to 73% reduction |
| **Gzip Compression** | Generates `.gz` files alongside originals for broader server support |
| **HTML Optimization** | Injects `modulepreload`, `preconnect`, and `dns-prefetch` links; minifies HTML |
| **Smart Cache Manifest** | Generates `roots-cache-manifest.json` with SHA256 hashes, sizes, and MIME types |
| **Asset Optimization** | Strips unnecessary whitespace and optimizes delivery size |

---

## Quick Start

### 1. Install

```bash
npm install roots
```

### 2. Add to Vite config

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { roots } from 'roots'

export default defineConfig({
  plugins: [roots()]
})
```

### 3. Build

```bash
npm run build
```

That's it. Roots runs automatically after `vite build` completes.

---

## Usage

### Plugin Options

```ts
roots({
  brotli: true,   // Enable Brotli compression
  gzip: true,     // Enable Gzip compression
  html: true,     // Enable HTML optimization
  cache: true,    // Enable cache manifest generation
  minify: true,   // Enable HTML minification
})
```

### CLI (Standalone)

```bash
roots build ./dist

# With options:
roots build ./dist --brotli --gzip --html --cache --minify
roots build ./dist --out ./cache-output
```

### CLI Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--brotli` | `true` | Enable Brotli compression |
| `--gzip` | `true` | Enable Gzip compression |
| `--html` | `true` | Enable HTML optimization |
| `--cache` | `true` | Enable cache manifest generation |
| `--minify` | `true` | Enable HTML minification |
| `--out` | *same as dist* | Output directory for cache manifest |

---

## Output

After running Roots, your `dist/` directory will include:

```
dist/
├── assets/
│   ├── index.js             (original)
│   ├── index.js.br          (Brotli compressed)
│   ├── index.js.gz          (Gzip compressed)
│   ├── style.css
│   ├── style.css.br
│   ├── style.css.gz
│   └── ...
├── index.html               (optimized, minified)
└── roots-cache-manifest.json
```

### Example CLI Output

```text
  ⚡ roots v0.0.1
  ─── brotli + gzip + html + cache + minify ───

⚡ Roots Optimization Complete

  Assets Compressed:    12
  Brotli Reduction:     73%
  Gzip Reduction:       69%
  JS Files:             1
  CSS Files:            1
  HTML Files:           1
  SVG Files:            4
  Total Assets:         7
  Total Size:           220.0 KB
  Modulepreloads:       1
  Preconnects:          0
  DNS Prefetches:       0
  Cache Manifest:       roots-cache-manifest.json
```

---

## Cache Manifest

Roots generates a `roots-cache-manifest.json` file with metadata for every asset:

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-05-19T08:41:22Z",
  "assets": [
    {
      "path": "/assets/index.js",
      "hash": "f625382914e85fa5623b22012648b556",
      "size": 784,
      "compressedSize": 358,
      "mimeType": "application/javascript"
    }
  ],
  "stats": {
    "totalFiles": 3,
    "totalSize": 1553,
    "compressedSize": 433
  }
}
```

---

## How It Works

```
vite build  ──>  dist/  ──>  Roots Plugin  ──>  roots.exe
                                                    │
                              ┌──────────────────────┐
                              │  Go Optimization     │
                              │  Engine              │
                              │                      │
                              │  Scanner             │
                              │    ↓                 │
                              │  Compressor          │
                              │  (Brotli + Gzip)     │
                              │    ↓                 │
                              │  HTML Optimizer      │
                              │    ↓                 │
                              │  Cache Generator     │
                              └──────────────────────┘
                                    │
                              Optimized Production
                              Assets
```

1. **Vite** completes the build and writes files to `dist/`
2. **Roots Plugin** (`closeBundle` hook) spawns the Go binary
3. **Scanner** walks `dist/`, classifies assets by type (.js/.css/.html/.svg), computes SHA256 hashes
4. **Compressor** generates `.br` (Brotli) and `.gz` (Gzip) files in parallel (max 4 concurrent)
5. **HTML Optimizer** parses HTML, injects `modulepreload`/`preconnect`/`dns-prefetch` links, minifies
6. **Cache Generator** writes `roots-cache-manifest.json` with all asset metadata
7. **Optimizer** prints a clean summary to the terminal

---

## Performance Impact

Roots is designed to be fast. The Go binary processes assets in parallel with a semaphore-limited pool (max 4 goroutines). Typical build times are under 1 second for most projects.

| Asset Type | Original | Brotli | Gzip |
|-----------|----------|--------|------|
| JavaScript (193 KB) | 193 KB | 51 KB (-73%) | 60 KB (-69%) |
| CSS (4.1 KB) | 4.1 KB | 1.2 KB | 1.4 KB |
| SVG (8.7 KB) | 8.7 KB | 1.3 KB | 1.5 KB |

---

## Build From Source

### Prerequisites

- Go 1.21+
- Node.js 18+

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/roots.git
cd roots

# Install Node dependencies
npm install

# Build the Go binary
npm run build:go

# Build the TypeScript plugin
npm run build

# Build everything at once
npm run build:all

# Type check
npm run typecheck
```

### Development

```bash
# Watch mode for TypeScript plugin
npm run dev
```

---

## Architecture

```
roots/
├── cmd/roots/main.go          CLI entry point
├── internal/
│   ├── types/                 Shared types and helpers
│   ├── scanner/               File walker and hashing
│   ├── compressor/            Brotli + Gzip (parallel)
│   ├── htmlopt/               HTML parser and optimizer
│   ├── cache/                 Manifest generator
│   └── optimizer/             Pipeline orchestrator
├── go.mod
├── go.sum
```

```
src/
└── index.ts                   Vite plugin
```

---

## Design Principles

- **No Vite replacement** — Roots post-processes output, doesn't hook into the build pipeline
- **Go for performance** — Compression and file scanning are CPU-bound; Go handles this efficiently
- **Shell-free spawn** — Plugin uses `spawn()` with `shell: false` to prevent command injection
- **Parallel processing** — Max 4 concurrent compression operations via semaphore
- **Minimal dependencies** — Go needs only brotli and x/net; TypeScript only needs Vite as peer
- **Duplicate prevention** — Existing `modulepreload` links are detected before injection

---

## Why Roots?

### Without Roots

```
vite build
  → dist/index.html         (not minified)
  → dist/assets/app.js      (193 KB, no compression)
  → dist/assets/style.css   (4.1 KB, no compression)
  → No cache strategy
```

### With Roots

```
vite build → Roots
  → dist/index.html              (minified, with modulepreload/preconnect)
  → dist/assets/app.js           (193 KB)
  → dist/assets/app.js.br        (51 KB, Brotli)
  → dist/assets/app.js.gz        (60 KB, Gzip)
  → dist/assets/style.css        (4.1 KB)
  → dist/assets/style.css.br     (1.2 KB, Brotli)
  → dist/assets/style.css.gz     (1.4 KB, Gzip)
  → dist/assets/cache-manifest.json (SHA256 hashes, metadata)
```

---

## Roadmap

### Current (MVP)
- [x] Brotli compression (.br)
- [x] Gzip compression (.gz)
- [x] modulepreload injection
- [x] preconnect + dns-prefetch injection
- [x] HTML minification
- [x] SHA256 cache manifest
- [x] Parallel compression
- [x] CLI + Vite plugin

### Future Ideas
- Image optimization (WebP/AVIF)
- Route prediction prefetching
- Intelligent preload analysis
- Edge cache integration
- Service worker acceleration
- Runtime performance analytics

---

## License

MIT
