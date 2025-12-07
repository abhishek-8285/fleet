import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
// Polyfill global crypto for older Node versions running Vite
try {
  // @ts-ignore
  if (!(globalThis as any).crypto) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { webcrypto } = require('crypto')
    ;(globalThis as any).crypto = webcrypto
  }
} catch (_) {
  // ignore
}

// Ensure globalThis.crypto is present even when the shell Node lacks webcrypto
const cryptoPolyfillPlugin = (): Plugin => ({
  name: 'crypto-polyfill',
  config () {
    try {
      if (!(globalThis as any).crypto || !(globalThis as any).crypto.getRandomValues) {
        try {
          // Prefer Node built-in if present
          const { webcrypto } = require('crypto')
          if (webcrypto && webcrypto.getRandomValues) {
            ;(globalThis as any).crypto = webcrypto
          }
        } catch {}
        if (!(globalThis as any).crypto || !(globalThis as any).crypto.getRandomValues) {
          // Fallback to @peculiar/webcrypto
          const { Crypto } = require('@peculiar/webcrypto')
          ;(globalThis as any).crypto = new Crypto()
        }
      }
    } catch (_) {}
    return {}
  }
})

export default defineConfig({
  plugins: [cryptoPolyfillPlugin(), react()],
  // test: {
  //   environment: 'jsdom',
  //   globals: true
  // },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})

