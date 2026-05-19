package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"roots/internal/optimizer"
	"roots/internal/types"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	buildCmd := flag.NewFlagSet("build", flag.ExitOnError)
	brotli := buildCmd.Bool("brotli", true, "enable brotli compression")
	gzip := buildCmd.Bool("gzip", true, "enable gzip compression")
	html := buildCmd.Bool("html", true, "enable html optimization")
	cache := buildCmd.Bool("cache", true, "enable cache manifest")
	minify := buildCmd.Bool("minify", true, "enable asset minification")
	out := buildCmd.String("out", "", "output directory (default: same as dist)")

	if len(os.Args) < 2 {
		printUsage()
		return nil
	}

	switch os.Args[1] {
	case "build":
		if err := buildCmd.Parse(os.Args[2:]); err != nil {
			return err
		}
		args := buildCmd.Args()
		if len(args) < 1 {
			return fmt.Errorf("usage: roots build <dist-dir> [flags]")
		}
		distDir := args[0]

		absDist, err := filepath.Abs(distDir)
		if err != nil {
			return fmt.Errorf("invalid dist dir: %w", err)
		}

		if _, err := os.Stat(absDist); os.IsNotExist(err) {
			return fmt.Errorf("dist directory not found: %s", absDist)
		}

		outputDir := *out
		if outputDir != "" {
			absOut, err := filepath.Abs(outputDir)
			if err != nil {
				return fmt.Errorf("invalid output dir: %w", err)
			}
			outputDir = absOut
		}

		opts := types.Options{
			DistDir:   absDist,
			OutputDir: outputDir,
			Brotli:    *brotli,
			Gzip:      *gzip,
			HTML:      *html,
			Cache:     *cache,
			Minify:    *minify,
		}

		opt := optimizer.New(opts)
		result, err := opt.Run()
		if err != nil {
			return err
		}

		fmt.Print(result.Summary())
		return nil

	case "help", "--help", "-h":
		printUsage()
		return nil

	default:
		return fmt.Errorf("unknown command: %s", os.Args[1])
	}
}

func printUsage() {
	fmt.Println("Roots - Performance Acceleration Toolkit")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  roots build <dist-dir> [flags]")
	fmt.Println()
	fmt.Println("Flags:")
	fmt.Println("  --brotli     enable brotli compression (default: true)")
	fmt.Println("  --gzip       enable gzip compression (default: true)")
	fmt.Println("  --html       enable html optimization (default: true)")
	fmt.Println("  --cache      enable cache manifest (default: true)")
	fmt.Println("  --minify     enable asset minification (default: true)")
	fmt.Println("  --out        output directory (default: same as dist)")
}
