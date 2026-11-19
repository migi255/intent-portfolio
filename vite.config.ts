import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode, isPreview }) => {
  const draft = fileURLToPath(new URL('./.private/review.ts', import.meta.url))
  const review = command === 'serve' && !isPreview && mode === 'review' && existsSync(draft)
  return review ? {
    server: { host: '127.0.0.1' },
    resolve: { alias: { './review.js': draft } },
  } : {}
})
