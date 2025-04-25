import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // <-- allows 127.0.0.1 and custom names like 'manikandan'
    port: 5173,      // <-- optional, default is 5173
    allowedHosts: ['manikandan']
  }
})
