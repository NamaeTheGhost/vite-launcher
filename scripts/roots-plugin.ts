import { spawn } from 'child_process'
import { resolve } from 'path'
import { existsSync } from 'fs'
import type { Plugin, ResolvedConfig } from 'vite'

export function rootsPlugin(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'roots',
    enforce: 'post',
    apply: 'build',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async closeBundle() {
      const projectRoot = process.cwd()
      const distDir = resolve(projectRoot, 'out', 'renderer')

      if (!existsSync(distDir)) {
        config.logger.warn(`[roots] output not found: ${distDir}`)
        return
      }

      const binaryName = process.platform === 'win32' ? 'roots.exe' : 'roots'
      const binaryPath = resolve(projectRoot, 'bin', binaryName)

      if (!existsSync(binaryPath)) {
        config.logger.warn('[roots] binary not found at ' + binaryPath)
        return
      }

      config.logger.info('[roots] optimizing ' + distDir)

      const child = spawn(binaryPath, ['build', distDir], {
        stdio: 'inherit',
        cwd: projectRoot,
        shell: false
      })

      await new Promise<void>((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`roots exited with code ${code}`))
        })
        child.on('error', reject)
      })
    }
  }
}
