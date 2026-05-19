package scanner

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"roots/internal/types"
)

type Result struct {
	Assets []types.Asset
	Stats  ScanStats
}

type ScanStats struct {
	TotalFiles int
	TotalSize  int64
	JSFiles    int
	CSSFiles   int
	HTMLFiles  int
	SVGFiles   int
}

func Scan(dir string) (*Result, error) {
	info, err := os.Stat(dir)
	if err != nil {
		return nil, fmt.Errorf("cannot access directory %s: %w", dir, err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("%s is not a directory", dir)
	}

	result := &Result{Assets: make([]types.Asset, 0)}

	err = filepath.Walk(dir, func(path string, fi os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if fi.IsDir() {
			return nil
		}

		relPath, _ := filepath.Rel(dir, path)
		relPath = filepath.ToSlash(relPath)

		if isIgnored(relPath) {
			return nil
		}

		assetType := types.DetectAssetType(relPath)
		if assetType == types.AssetOther {
			return nil
		}

		hash, err := computeHash(path)
		if err != nil {
			return err
		}

		asset := types.Asset{
			Path:    path,
			Type:    assetType,
			Size:    fi.Size(),
			Hash:    hash,
			URLPath: "/" + relPath,
		}

		result.Assets = append(result.Assets, asset)
		result.Stats.TotalFiles++
		result.Stats.TotalSize += fi.Size()

		switch assetType {
		case types.AssetJS:
			result.Stats.JSFiles++
		case types.AssetCSS:
			result.Stats.CSSFiles++
		case types.AssetHTML:
			result.Stats.HTMLFiles++
		case types.AssetSVG:
			result.Stats.SVGFiles++
		}

		return nil
	})

	return result, err
}

func isIgnored(path string) bool {
	ignored := []string{
		"node_modules",
		".git",
		".br",
		".gz",
		"roots-cache-manifest.json",
	}
	lower := strings.ToLower(path)
	for _, ign := range ignored {
		if strings.Contains(lower, ign) {
			return true
		}
	}
	return false
}

func computeHash(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)[:16]), nil
}
