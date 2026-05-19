package compressor

import (
	"fmt"
	"os"
	"sync"

	"roots/internal/types"
)

type Result struct {
	CompressedFiles int
	OriginalSize    int64
	BrotliSize      int64
	GzipSize        int64
}

type Compressor struct {
	Brotli bool
	Gzip   bool
}

func New(brotli, gzip bool) *Compressor {
	return &Compressor{Brotli: brotli, Gzip: gzip}
}

func (c *Compressor) CompressAll(assets []types.Asset) (*Result, error) {
	result := &Result{}

	type job struct {
		asset types.Asset
	}

	jobs := make([]job, 0)
	for _, a := range assets {
		if a.Type == types.AssetHTML || a.Type == types.AssetOther {
			continue
		}
		jobs = append(jobs, job{asset: a})
	}

	var mu sync.Mutex
	var wg sync.WaitGroup
	errCh := make(chan error, len(jobs)*2)

	sem := make(chan struct{}, 4)

	for _, j := range jobs {
		wg.Add(1)
		go func(j job) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			data, err := os.ReadFile(j.asset.Path)
			if err != nil {
				errCh <- fmt.Errorf("read %s: %w", j.asset.Path, err)
				return
			}

			origSize := int64(len(data))

			var bSize, gSize int64

			if c.Brotli {
				compressed, err := compressBrotli(data)
				if err != nil {
					errCh <- fmt.Errorf("brotli %s: %w", j.asset.Path, err)
					return
				}
				outPath := j.asset.Path + ".br"
				if err := os.WriteFile(outPath, compressed, 0644); err != nil {
					errCh <- fmt.Errorf("write %s: %w", outPath, err)
					return
				}
				bSize = int64(len(compressed))
			}

			if c.Gzip {
				compressed, err := compressGzip(data)
				if err != nil {
					errCh <- fmt.Errorf("gzip %s: %w", j.asset.Path, err)
					return
				}
				outPath := j.asset.Path + ".gz"
				if err := os.WriteFile(outPath, compressed, 0644); err != nil {
					errCh <- fmt.Errorf("write %s: %w", outPath, err)
					return
				}
				gSize = int64(len(compressed))
			}

			mu.Lock()
			result.OriginalSize += origSize
			result.BrotliSize += bSize
			result.GzipSize += gSize
			if c.Brotli {
				result.CompressedFiles++
			}
			if c.Gzip {
				result.CompressedFiles++
			}
			mu.Unlock()
		}(j)
	}

	wg.Wait()
	close(errCh)

	for err := range errCh {
		if err != nil {
			return result, err
		}
	}

	return result, nil
}


