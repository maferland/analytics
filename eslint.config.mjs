import { FlatCompat } from '@eslint/eslintrc'
import { globalIgnores } from 'eslint/config'

const compat = new FlatCompat()

const config = [
  ...compat.extends('next/core-web-vitals'),
  globalIgnores(['.next/**', 'coverage/**', 'node_modules/**']),
]

export default config
