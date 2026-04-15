import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { rm } from 'fs/promises';
import { join } from 'path';

// Test fixture files in public/ that are needed for local QA testing
// but should not ship in the production dist.
const QA_FIXTURES = [
  'large-source.csv',
  'large-target.csv',
  'wide-source.csv',
  'wide-target.csv',
  'multi-sheet.xlsx',
];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'exclude-qa-fixtures',
      apply: 'build',
      async closeBundle() {
        const outDir = join(__dirname, 'dist');
        await Promise.all(
          QA_FIXTURES.map((f) =>
            rm(join(outDir, f), { force: true }).catch(() => {})
          )
        );
      },
    },
  ],
});
