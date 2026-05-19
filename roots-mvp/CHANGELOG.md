# Changelog

## [0.0.1] — 2026-05-19

### MVP Release — Initial Development

Roots is a performance acceleration toolkit for Vite. This initial release delivers core optimization capabilities as a post-processing layer that runs automatically after `vite build`.

#### Features

**Brotli Compression**
- Generates `.br` files for JavaScript, CSS, and SVG assets
- Uses `github.com/andybalholm/brotli` at DefaultCompression level 6
- Achieves up to 73% size reduction on production JS bundles
- Skips HTML files (handled by server-level compression)

**Gzip Compression**
- Generates `.gz` files alongside originals for broader server support
- Uses Go stdlib `compress/gzip` at BestCompression level 9
- Achieves up to 69% size reduction

**HTML Optimization**
- Parses HTML using `golang.org/x/net/html`
- Scans for `<script type="module">` tags and injects `<link rel="modulepreload">`
- Detects existing modulepreload links to prevent duplicates
- Extracts external origins (scheme + host) from `src`/`href` attributes
- Injects `<link rel="preconnect">` and `<link rel="dns-prefetch">` for external origins
- Creates `<head>` section if missing from the document
- Minifies HTML by removing newlines, tabs, and collapsing whitespace

**Smart Cache Manifest**
- Generates `roots-cache-manifest.json` with per-asset metadata
- SHA256 hash (first 16 bytes) for cache invalidation
- Original size, compressed size (best of Brotli/Gzip), and MIME type
- Asset paths relative to the dist directory
- Skips manifest generation when no assets are present

**Asset Scanner**
- Recursive directory walk with SHA256 hashing
- Classifies files by extension: `.js/.mjs/.cjs` → JS, `.css` → CSS, `.html/.htm` → HTML, `.svg` → SVG
- Filters out `node_modules`, `.git`, `.br`, `.gz`, and cache manifest files
- Reports per-type file counts and total size

**Vite Plugin**
- Registers with `enforce: "post"` and `apply: "build"` (build-only)
- `closeBundle` hook triggers the Go binary after Vite finishes
- Locates binary via multiple search paths (plugin dir, node_modules/.bin, project root)
- Prints startup banner with version and enabled features
- Supports all compression and optimization toggles from plugin options

**CLI Interface**
- `roots build <dist-dir>` command with flag-based configuration
- `--brotli`, `--gzip`, `--html`, `--cache`, `--minify` toggle flags
- `--out` for separate cache manifest output directory
- Clean summary output with emoji header and formatted statistics

**Architecture**
- Go core for CPU-bound processing (compression, file scanning, hashing)
- TypeScript Vite plugin for seamless integration
- Semaphore-limited parallel compression (max 4 concurrent goroutines)
- Shell-free process spawn (`spawn()` with `shell: false`) for security
- Minimal dependencies: 2 Go packages, 1 peer dependency (Vite)
- Modular internal packages with clean separation of concerns

#### Bug Fixes (pre-release)
- Fixed command injection vulnerability by replacing `execSync` with `spawn`
- Fixed duplicate modulepreload injection by scanning existing links
- Fixed missing `<head>` tag handling by creating one when absent
- Fixed negative compression percentage display for small files
- Fixed cache manifest paths when `--out` differs from dist directory
- Removed dead code (`CompressFile`, `ScriptsOptimized`, `scanDirForOrigins`)
- Changed Brotli from BestCompression (slow) to DefaultCompression (balanced)
- Changed Gzip from default level 6 to BestCompression level 9

#### Known Limitations
- Only processes JS, CSS, HTML, and SVG files (no image optimization yet)
- Minification is whitespace-only (no structural JS/CSS minification — Vite handles this)
- Windows-only binary distribution for now
