import type { UserConfig } from 'vite';

export const defaultViteConfig: (args?: {
  entry?: string;
  outDir?: string;
  destDir?: string;
}) => UserConfig;
