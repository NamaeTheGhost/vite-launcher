package cache

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"roots/internal/types"
)

type Generator struct{}

func New() *Generator {
	return &Generator{}
}

type Result struct {
	ManifestPath string
	TotalFiles   int
	TotalSize    int64
}

func (g *Generator) Generate(assets []types.Asset, distDir, outputDir string) (*Result, error) {
	if len(assets) == 0 {
		return &Result{}, nil
	}

	manifest := types.NewCacheManifest()

	for _, a := range assets {
		mimeType := detectMimeType(a.Type)
		relPath, _ := filepath.Rel(distDir, a.Path)
		relPath = filepath.ToSlash(relPath)

		ca := types.CacheAsset{
			Path:     "/" + relPath,
			Hash:     a.Hash,
			Size:     a.Size,
			MimeType: mimeType,
		}

		if brPath := a.Path + ".br"; fileExists(brPath) {
			info, _ := os.Stat(brPath)
			if info != nil {
				ca.CompressedSize = info.Size()
			}
		}
		if ca.CompressedSize == 0 {
			if gzPath := a.Path + ".gz"; fileExists(gzPath) {
				info, _ := os.Stat(gzPath)
				if info != nil {
					ca.CompressedSize = info.Size()
				}
			}
		}

		manifest.Assets = append(manifest.Assets, ca)
		manifest.Stats.TotalFiles++
		manifest.Stats.TotalSize += ca.Size
		manifest.Stats.CompressedSize += ca.CompressedSize
	}

	manifestPath := filepath.Join(outputDir, "roots-cache-manifest.json")
	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("marshal manifest: %w", err)
	}

	if err := os.WriteFile(manifestPath, data, 0644); err != nil {
		return nil, fmt.Errorf("write manifest: %w", err)
	}

	return &Result{
		ManifestPath: manifestPath,
		TotalFiles:   manifest.Stats.TotalFiles,
		TotalSize:    manifest.Stats.TotalSize,
	}, nil
}

func detectMimeType(assetType types.AssetType) string {
	switch assetType {
	case types.AssetJS:
		return "application/javascript"
	case types.AssetCSS:
		return "text/css"
	case types.AssetHTML:
		return "text/html"
	case types.AssetSVG:
		return "image/svg+xml"
	default:
		return "application/octet-stream"
	}
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
