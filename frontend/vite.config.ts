import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // Necessary for docker to have an up-to-date frontend
    },
    host: true, // Enables access for external hosts
    port: 5173, // default port for vite
  },
})
