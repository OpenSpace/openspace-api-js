import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

export default defineConfig({
  input: 'src/browserglobal.ts',
  output: {
    file: 'dist/openspace-api.js',
    format: 'iife',
    name: 'openspaceApi'
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.rollup.json'
    })
  ]
});
