import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: '.',
      emptyOutDir: true,
    },
  }

  if (command !== 'serve') {
    config.define = {
      'process.env.NODE_ENV': '"production"'
    }
  }

  return config
})