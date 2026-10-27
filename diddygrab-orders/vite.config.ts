import { whop } from '@whop/cli/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

// Whop hosting runs on Cloudflare Workers: index.html builds to dist/client, the
// worker (orders API + passcode gate) builds to dist/server, and whop() packs both
// into dist/whop-build.zip for `whop apps deploy`.
export default defineConfig({
  plugins: [whop({ disableTanstackDevtools: true }), cloudflare({ viteEnvironment: { name: 'ssr' } })],
  environments: {
    ssr: { build: { outDir: 'dist/server' } },
    client: { build: { outDir: 'dist/client' } },
  },
})
