const { readdirSync, copyFileSync } = require('fs');
const { extname, dirname, join } = require('path');
const { userInfo } = require('os');
const { fileURLToPath } = require('url');

function defaultViteConfig(args = {}) {
  const entry = args.entry ?? 'main.ts';
  const outDir = args.outDir ?? 'dist';
  const destDir = args.destDir ?? '/Library/Containers/app.cyan.markedit/Data/Documents/scripts/';

  const rootDir = (() => {
    const stackTrace = Error.prepareStackTrace;
    try {
      Error.prepareStackTrace = (_, stack) => stack;
      const error = new Error();
      const stack = error.stack;
      return dirname(fileURLToPath(stack[2].getFileName())).replace('/node_modules/.vite-temp', '');
    } finally {
      Error.prepareStackTrace = stackTrace;
    }
  })();

  return {
    build: {
      outDir,
      rollupOptions: {
        external: [
          'markedit-api',
          '@codemirror/view',
          '@codemirror/state',
          '@codemirror/language',
          '@codemirror/commands',
          '@codemirror/search',
          '@lezer/common',
          '@lezer/highlight',
          '@lezer/markdown',
          '@lezer/lr',
        ],
      },
      lib: {
        entry,
        formats: ['cjs'],
      },
    },
    plugins: [
      {
        name: 'markedit-copy-dist-file',
        closeBundle: () => {
          const distDir = join(rootDir, outDir);
          const filename = readdirSync(distDir).find(name => extname(name) === '.js');
          if (filename === undefined) {
            console.error('Failed to find generated .js file in dist directory.');
            return;
          }

          const sourcePath = join(distDir, filename);
          const destPath = join(userInfo().homedir, destDir, filename);
          copyFileSync(sourcePath, destPath);
          console.log(`Successfully deployed to ${destPath}.`);
        },
      },
    ],
  };
}

module.exports = { defaultViteConfig };
