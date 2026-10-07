// ESLint 9 flat config. Next.js 16 removed `next lint`, and FlatCompat breaks on
// eslint-config-next 16's circular plugin objects, so we run ESLint directly
// and use the TypeScript-ESLint tooling that ships transitively with
// eslint-config-next. Full TypeScript *type* checking still happens in `next build`.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextPath = require.resolve('eslint-config-next');
const tseslint = require(require.resolve('typescript-eslint', { paths: [nextPath] }));

const eslintConfig = [
  {
    ignores: [
      'dist/**',
      '.next/**',
      'node_modules/**',
      'scripts/**',
      'extension/**',
      'training/**',
      'steps/**',
      'data/**',
      'docs/**',
      'build-output.log',
      'out.txt',
      'tsconfig.tsbuildinfo',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Keep the codebase's existing severity policy: warn, don't error, so
      // lint stays green while still surfacing real code-quality signals.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];

export default eslintConfig;
