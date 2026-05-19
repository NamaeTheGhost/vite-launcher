import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { statfs, mkdir } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import icon from '../../resources/icon.png?asset'

const execAsync = promisify(exec)

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 620,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })

  ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })

  ipcMain.handle('get-disk-space', async (_event, drivePath: string) => {
    try {
      const stats = await statfs(drivePath, {})
      return {
        free: Number(stats.bsize) * Number(stats.bfree),
        total: Number(stats.bsize) * Number(stats.blocks)
      }
    } catch {
      return { free: 0, total: 0 }
    }
  })

  ipcMain.handle('select-directory', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Kurulum Klasörünü Seçin'
    })

    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain.handle(
    'create-project',
    async (
      _event,
      config: {
        targetDir: string
        projectName: string
        features: string[]
      }
    ) => {
      const { targetDir, projectName, features } = config
      const win = BrowserWindow.getFocusedWindow()

      const sendProgress = (stage: string, message: string, percent: number): void => {
        win?.webContents.send('project-progress', { stage, message, percent })
      }

      try {
        const projectPath = join(targetDir, projectName)

        sendProgress('scaffold', 'Proje klasörü oluşturuluyor...', 5)

        await mkdir(projectPath, { recursive: true })

        sendProgress('scaffold', 'Vite projesi oluşturuluyor...', 15)

        await execAsync(`npx create-vite@latest "${projectName}" --template react-ts`, {
          cwd: targetDir,
          windowsHide: true
        })

        sendProgress('deps', 'Temel bağımlılıklar yükleniyor...', 35)

        await execAsync('npm install', { cwd: projectPath, windowsHide: true })

        const extraDevDeps: string[] = []

        if (features.includes('tw')) {
          extraDevDeps.push('tailwindcss@3', 'postcss', 'autoprefixer')
        }

        if (features.includes('pret')) {
          extraDevDeps.push('prettier', 'eslint-config-prettier')
        }

        if (extraDevDeps.length > 0) {
          sendProgress('deps', 'Ek bağımlılıklar yükleniyor...', 55)
          await execAsync(`npm install -D ${extraDevDeps.join(' ')}`, {
            cwd: projectPath,
            windowsHide: true
          })
        }

        if (features.includes('tw')) {
          sendProgress('config', 'Tailwind CSS yapılandırılıyor...', 70)
        }

        sendProgress('finalize', 'Proje hazırlanıyor...', 90)

        return { success: true, path: projectPath }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'linux') {
    app.quit()
  }
})
