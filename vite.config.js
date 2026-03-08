import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: true,   // Listen on 0.0.0.0 so mobile devices on the same WiFi can connect
    port: 5173,
    https: true,  // Enable HTTPS — required for getUserMedia on mobile browsers
  },
})
