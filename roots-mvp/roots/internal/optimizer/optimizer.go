package optimizer

import (
	"fmt"
	"strings"

	"roots/internal/cache"
	"roots/internal/compressor"
	"roots/internal/htmlopt"
	"roots/internal/scanner"
	"roots/internal/types"
)

type Result struct {
	ScannerResult    *scanner.Result
	CompressResult   *compressor.Result
	HTMLResult       *htmlopt.Result
	CacheResult      *cache.Result
}

type Optimizer struct {
	opts types.Options
}

func New(opts types.Options) *Optimizer {
	return &Optimizer{opts: opts}
}

func (o *Optimizer) Run() (*Result, error) {
	outputDir := o.opts.OutputDir
	if outputDir == "" {
		outputDir = o.opts.DistDir
	}

	scanResult, err := scanner.Scan(o.opts.DistDir)
	if err != nil {
		return nil, fmt.Errorf("scan failed: %w", err)
	}

	compressResult := &compressor.Result{}
	if o.opts.Brotli || o.opts.Gzip {
		c := compressor.New(o.opts.Brotli, o.opts.Gzip)
		compressResult, err = c.CompressAll(scanResult.Assets)
		if err != nil {
			return nil, fmt.Errorf("compression failed: %w", err)
		}
	}

	htmlResult := &htmlopt.Result{}
	if o.opts.HTML {
		h := htmlopt.New()
		htmlResult, err = h.OptimizeAll(scanResult.Assets, o.opts.Minify)
		if err != nil {
			return nil, fmt.Errorf("html optimization failed: %w", err)
		}
	}

	cacheResult := &cache.Result{}
	if o.opts.Cache {
		g := cache.New()
		cacheResult, err = g.Generate(scanResult.Assets, o.opts.DistDir, outputDir)
		if err != nil {
			return nil, fmt.Errorf("cache generation failed: %w", err)
		}
	}

	return &Result{
		ScannerResult:  scanResult,
		CompressResult: compressResult,
		HTMLResult:     htmlResult,
		CacheResult:    cacheResult,
	}, nil
}

func (r *Result) Summary() string {
	var sb strings.Builder
	sb.WriteString("\n")
	sb.WriteString("⚡ Roots Optimization Complete\n")
	sb.WriteString("\n")

	if r.CompressResult != nil && r.CompressResult.CompressedFiles > 0 {
		sb.WriteString(fmt.Sprintf("  Assets Compressed:    %d\n", r.CompressResult.CompressedFiles))
		if r.CompressResult.OriginalSize > 0 && r.CompressResult.BrotliSize > 0 {
			pct := (r.CompressResult.OriginalSize - r.CompressResult.BrotliSize) * 100 / r.CompressResult.OriginalSize
			if pct < 0 {
				pct = 0
			}
			sb.WriteString(fmt.Sprintf("  Brotli Reduction:     %d%%\n", pct))
		}
		if r.CompressResult.OriginalSize > 0 && r.CompressResult.GzipSize > 0 {
			pct := (r.CompressResult.OriginalSize - r.CompressResult.GzipSize) * 100 / r.CompressResult.OriginalSize
			if pct < 0 {
				pct = 0
			}
			sb.WriteString(fmt.Sprintf("  Gzip Reduction:       %d%%\n", pct))
		}
	}

	if r.ScannerResult != nil {
		st := r.ScannerResult.Stats
		sb.WriteString(fmt.Sprintf("  JS Files:             %d\n", st.JSFiles))
		sb.WriteString(fmt.Sprintf("  CSS Files:            %d\n", st.CSSFiles))
		sb.WriteString(fmt.Sprintf("  HTML Files:           %d\n", st.HTMLFiles))
		sb.WriteString(fmt.Sprintf("  SVG Files:            %d\n", st.SVGFiles))
	}

	sb.WriteString(fmt.Sprintf("  Total Assets:         %d\n", r.ScannerResult.Stats.TotalFiles))
	sb.WriteString(fmt.Sprintf("  Total Size:           %.1f KB\n", float64(r.ScannerResult.Stats.TotalSize)/1024))

	if r.HTMLResult != nil && r.HTMLResult.FilesProcessed > 0 {
		sb.WriteString(fmt.Sprintf("  Modulepreloads:       %d\n", r.HTMLResult.ModulePreloads))
		sb.WriteString(fmt.Sprintf("  Preconnects:          %d\n", r.HTMLResult.Preconnects))
		sb.WriteString(fmt.Sprintf("  DNS Prefetches:       %d\n", r.HTMLResult.DNSPreretches))
		if r.HTMLResult.BytesSaved > 0 {
			sb.WriteString(fmt.Sprintf("  HTML Savings:         %.1f KB\n", float64(r.HTMLResult.BytesSaved)/1024))
		}
	}

	if r.CacheResult != nil && r.CacheResult.ManifestPath != "" {
		sb.WriteString(fmt.Sprintf("  Cache Manifest:       roots-cache-manifest.json\n"))
	}

	sb.WriteString("\n")
	return sb.String()
}
