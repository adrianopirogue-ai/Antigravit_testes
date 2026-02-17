import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Se estiver no Vercel, o base é '/', se for GitHub Pages é o nome do repo
  base: process.env.NODE_ENV === 'production' && !process.env.VERCEL ? '/Antigravit_testes/' : '/'
})
