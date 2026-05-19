import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { roots } from 'roots'

export default defineConfig({
  plugins: [react(), roots()],
})
