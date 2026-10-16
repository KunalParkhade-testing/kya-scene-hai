import { defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig(
  [...nextVitals, ...nextTypescript],
  {
    files: ['src/components/admin/AdminStudio.tsx'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
)
