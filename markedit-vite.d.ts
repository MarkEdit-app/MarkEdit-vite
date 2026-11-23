import type { LibraryFormats, UserConfig } from 'vite';

export const defaultViteConfig: (args?: {
  entry?: string;
  name?: string;
  format?: LibraryFormats;
  outDir?: string;
  destDir?: string;
  copyDistFile?: boolean;
}) => UserConfig;
