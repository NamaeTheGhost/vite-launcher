import { spawn } from "node:child_process"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync } from "node:fs"
import type { Plugin, ResolvedConfig } from "vite"

function getDir(metaUrl: string): string {
  if (typeof __dirname !== "undefined") return __dirname
  return dirname(fileURLToPath(metaUrl))
}

export interface RootsOptions {
  brotli?: boolean
  gzip?: boolean
  html?: boolean
  cache?: boolean
  minify?: boolean
  outDir?: string
  binaryPath?: string
  enabled?: boolean
}

export function roots(options: RootsOptions = {}): Plugin {
  let config: ResolvedConfig

  return {
    name: "roots",
    enforce: "post",
    apply: "build",

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async closeBundle() {
      const enabled = options.enabled ?? true
      if (!enabled) return

      const distDir = options.outDir
        ? resolve(config.root, options.outDir)
        : resolve(config.root, config.build.outDir)

      if (!existsSync(distDir)) {
        config.logger.warn(`[roots] dist directory not found: ${distDir}`)
        return
      }

      const binaryName = process.platform === "win32" ? "roots.exe" : "roots"
      const searchPaths = [
        options.binaryPath,
        resolve(getDir(import.meta.url), "..", "bin", binaryName),
        resolve(config.root, "node_modules", ".bin", binaryName),
        resolve(config.root, "bin", binaryName),
      ].filter(Boolean) as string[]

      let binaryPath: string | undefined
      for (const p of searchPaths) {
        if (p && existsSync(p)) {
          binaryPath = p
          break
        }
      }

      if (!binaryPath) {
        config.logger.warn(
          "[roots] binary not found. Run `npx roots-build` or place roots in node_modules/.bin/"
        )
        return
      }

      const args = ["build", distDir]

      if (options.brotli !== undefined) args.push("--brotli", String(options.brotli))
      if (options.gzip !== undefined) args.push("--gzip", String(options.gzip))
      if (options.html !== undefined) args.push("--html", String(options.html))
      if (options.cache !== undefined) args.push("--cache", String(options.cache))
      if (options.minify !== undefined) args.push("--minify", String(options.minify))

      try {
        const features = [
          options.brotli !== false && "brotli",
          options.gzip !== false && "gzip",
          options.html !== false && "html",
          options.cache !== false && "cache",
          options.minify !== false && "minify",
        ].filter(Boolean).join(" + ")

        config.logger.info([
          "",
          "  ⚡ roots v0.0.1",
          `  ─── ${features} ───`,
          "",
        ].join("\n"))

        const child = spawn(binaryPath, args, {
          stdio: "inherit",
          cwd: config.root,
          shell: false,
        })
        await new Promise<void>((resolve, reject) => {
          child.on("close", (code) => {
            if (code === 0) resolve()
            else reject(new Error(`roots exited with code ${code}`))
          })
          child.on("error", reject)
        })
      } catch (err) {
        config.logger.error("[roots] optimization failed")
        if (err instanceof Error) {
          config.logger.error(err.message)
        }
      }
    },
  }
}
