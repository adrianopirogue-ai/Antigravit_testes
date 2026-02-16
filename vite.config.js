import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isVercel = process.env.VERCEL === '1'
  const base =
    process.env.VITE_BASE_PATH || (isVercel ? '/' : '/Antigravit_testes/')

  return {
    plugins: [react()],
    base,
  }
})
