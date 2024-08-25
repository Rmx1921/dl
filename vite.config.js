const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  base: process.env.ELECTRON == "true" ? './' : '/',
  build: {
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
  },
});