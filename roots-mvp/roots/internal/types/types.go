package types

import "time"

type AssetType int

const (
	AssetJS   AssetType = iota
	AssetCSS
	AssetHTML
	AssetSVG
	AssetOther
)

type Asset struct {
	Path    string
	Type    AssetType
	Size    int64
	Hash    string
	URLPath string
}

type Options struct {
	DistDir   string
	OutputDir string
	Brotli    bool
	Gzip      bool
	HTML      bool
	Cache     bool
	Minify    bool
}

type CacheManifest struct {
	Version     string       `json:"version"`
	GeneratedAt string       `json:"generatedAt"`
	Assets      []CacheAsset `json:"assets"`
	Stats       CacheStats   `json:"stats"`
}

type CacheAsset struct {
	Path           string `json:"path"`
	Hash           string `json:"hash"`
	Size           int64  `json:"size"`
	CompressedSize int64  `json:"compressedSize,omitempty"`
	MimeType       string `json:"mimeType"`
}

type CacheStats struct {
	TotalFiles     int   `json:"totalFiles"`
	TotalSize      int64 `json:"totalSize"`
	CompressedSize int64 `json:"compressedSize"`
}

func DetectAssetType(path string) AssetType {
	switch {
	case HasExt(path, ".js", ".mjs", ".cjs"):
		return AssetJS
	case HasExt(path, ".css"):
		return AssetCSS
	case HasExt(path, ".html", ".htm"):
		return AssetHTML
	case HasExt(path, ".svg"):
		return AssetSVG
	default:
		return AssetOther
	}
}

func HasExt(path string, exts ...string) bool {
	pathLower := path
	for _, ext := range exts {
		if len(pathLower) >= len(ext) && pathLower[len(pathLower)-len(ext):] == ext {
			return true
		}
	}
	return false
}

func NewCacheManifest() CacheManifest {
	return CacheManifest{
		Version:     "0.0.1",
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Assets:      make([]CacheAsset, 0),
	}
}
