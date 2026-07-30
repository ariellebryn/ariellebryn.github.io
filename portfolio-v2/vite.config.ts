import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enables Emotion's css prop — styled() works out of the box too
      jsxImportSource: '@emotion/react',
    }),
  ],
  // When deploying to GitHub Pages with a custom domain (e.g. ariellechapin.com),
  // base stays '/'. If you ever deploy to a sub-path (e.g. username.github.io/repo),
  // change this to '/repo/'.
  base: '/',
})
