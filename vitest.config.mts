import { defineConfig } from 'vitest/config'

// .cache/repos holds cloned upstream sources that ship their own test suites.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
