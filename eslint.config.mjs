import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals, ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts']),
  // TSL uniforms are imperative GPU handles, not immutable React state.
  { files: ['src/experience/**'], rules: { 'react-hooks/immutability': 'off' } },
]);
