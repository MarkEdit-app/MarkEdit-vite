const { readFileSync, copyFileSync } = require('fs');
const { basename, extname, dirname, join } = require('path');
const { userInfo } = require('os');
const globals = require('globals');

const markeditGlobals = {
  'markedit-api': '({ MarkEdit })',
  '@codemirror/view': 'MarkEdit.codemirror.view',
  '@codemirror/state': 'MarkEdit.codemirror.state',
  '@codemirror/language': 'MarkEdit.codemirror.language',
  '@codemirror/lang-markdown': 'MarkEdit.codemirror.langMarkdown',
  '@codemirror/commands': 'MarkEdit.codemirror.commands',
  '@codemirror/search': 'MarkEdit.codemirror.search',
  '@codemirror/autocomplete': 'MarkEdit.codemirror.autocomplete',
  '@lezer/common': 'MarkEdit.lezer.common',
  '@lezer/highlight': 'MarkEdit.lezer.highlight',
  '@lezer/markdown': 'MarkEdit.lezer.markdown',
  '@lezer/lr': 'MarkEdit.lezer.lr',
};

const reservedIifeNames = new Set([
  ...Object.keys(globals.builtin),
  ...Object.keys(globals.browser),
  'MarkEdit', 'module', 'exports', '__FILE_PATH__', 'require',
]);

function defaultViteConfig(args = {}) {
  const entry = args.entry ?? 'main.ts';
  const format = args.format ?? 'cjs';
  const outDir = args.outDir ?? 'dist';
  const destDir = args.destDir ?? '/Library/Containers/app.cyan.markedit/Data/Documents/scripts/';
  const copyDistFile = args.copyDistFile ?? true;
  const canDeploy = ['cjs', 'iife', 'umd'].includes(format);

  if (copyDistFile && !canDeploy) {
    throw new Error(`Cannot deploy "${format}" output to MarkEdit. Set "copyDistFile" to false to build without deployment.`);
  }

  let projectRoot;
  return {
    build: {
      outDir,
      rollupOptions: {
        external: [
          'markedit-api',
          '@codemirror/view',
          '@codemirror/state',
          '@codemirror/language',
          '@codemirror/lang-markdown',
          '@codemirror/commands',
          '@codemirror/search',
          '@codemirror/autocomplete',
          '@lezer/common',
          '@lezer/highlight',
          '@lezer/markdown',
          '@lezer/lr',
        ],
      },
      lib: {
        entry,
        name: args.name,
        formats: [format],
      },
    },
    plugins: [
      {
        name: 'markedit-validate-output',
        configResolved(config) {
          projectRoot = config.root;
          const library = config.build.lib;
          const formats = library ? library.formats : undefined;
          const output = config.build.rollupOptions.output;
          const outputs = Array.isArray(output) ? output : [output ?? {}];
          if (copyDistFile) {
            if (!formats || formats.length !== 1 || formats[0] !== format || outputs.length !== 1
              || outputs.some(options => options.format !== undefined
                && (options.format === 'commonjs' ? 'cjs' : options.format) !== format)) {
              throw new Error(`Automatic deployment requires only the selected "${format}" format. Use "format" to select it, or set "copyDistFile" to false for other outputs.`);
            }
          }

          if (Array.isArray(output)) {
            for (const options of output) {
              if (options.format === 'iife' || options.format === 'umd') {
                options.name ??= library?.name ?? libraryName(projectRoot, options.format);
                if (options.format === 'iife') {
                  validateIifeName(options.name);
                }
              }
            }
          } else if (library && (formats?.includes('iife') || formats?.includes('umd'))) {
            const namedFormat = formats.includes('iife') ? 'iife' : 'umd';
            library.name ??= output?.name ?? libraryName(projectRoot, namedFormat);
            if (namedFormat === 'iife') {
              validateIifeName(output?.name ?? library.name);
            }
          }

          if (copyDistFile && (format === 'iife' || format === 'umd')) {
            library.fileName ??= () => `${packageName(projectRoot).split('/').pop()}.js`;
          }
        },
        outputOptions: {
          order: 'post',
          handler(output) {
            if (output.format !== 'iife' && output.format !== 'umd') {
              return null;
            }

            const name = output.name ?? libraryName(projectRoot, output.format);
            if (output.format === 'iife') {
              validateIifeName(name);
              return { ...output, name, globals: iifeGlobals(output.globals) };
            }

            return { ...output, name };
          },
        },
        renderStart(output) {
          if (output.format === 'iife') {
            validateIifeName(output.name);
          }

          if (copyDistFile && output.format !== format) {
            throw new Error(`Cannot deploy "${output.format}" output when "${format}" was selected. Set "copyDistFile" to false for other outputs.`);
          }
        },
      },
      ...(copyDistFile ? [{
        name: 'markedit-copy-dist-file',
        generateBundle(_, bundle) {
          deploymentFileName(bundle);
        },
        writeBundle(output, bundle) {
          const filename = deploymentFileName(bundle);
          const sourcePath = output.file ?? join(output.dir, filename);
          const destPath = join(userInfo().homedir, destDir, basename(filename));
          copyFileSync(sourcePath, destPath);
          console.log(`Successfully deployed to ${destPath}.`);
        },
      }] : []),
    ],
  };
}

function iifeGlobals(overrides) {
  if (typeof overrides === 'function') {
    return id => overrides(id) ?? markeditGlobals[id];
  }

  if (overrides !== undefined && (overrides === null || typeof overrides !== 'object')) {
    throw new Error('IIFE output globals must be an object or a function.');
  }

  return { ...markeditGlobals, ...overrides };
}

function validateIifeName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('IIFE output requires a non-empty "name".');
  }

  const root = name.split('.')[0];
  if (reservedIifeNames.has(root)) {
    throw new Error(`The IIFE library name "${name}" conflicts with the runtime. Choose a different "name".`);
  }
}

function deploymentFileName(bundle) {
  const chunks = Object.values(bundle).filter(output => output.type === 'chunk');
  if (chunks.length !== 1 || !chunks[0].isEntry || extname(chunks[0].fileName) !== '.js') {
    throw new Error('MarkEdit deployment requires a single .js entry bundle. Configure "build.lib.fileName" or set "copyDistFile" to false.');
  }

  return chunks[0].fileName;
}

function libraryName(rootDir, format) {
  const parts = packageName(rootDir).match(/[a-z0-9]+/gi);
  if (parts === null) {
    throw new Error(`Cannot infer a library name for ${rootDir}. Set the "name" option explicitly.`);
  }

  const name = parts.map(part => part[0].toUpperCase() + part.slice(1)).join('');
  const identifier = /^[0-9]/.test(name) ? `_${name}` : name;
  return format === 'iife' ? `MarkEditExtension_${identifier}` : identifier;
}

function packageName(rootDir) {
  let directory = rootDir;
  while (true) {
    const packagePath = join(directory, 'package.json');
    let contents;
    try {
      contents = readFileSync(packagePath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      const parent = dirname(directory);
      if (parent === directory) {
        throw new Error(`Cannot find package.json for ${rootDir}. Provide package metadata or set "name" and "build.lib.fileName" explicitly.`);
      }

      directory = parent;
      continue;
    }

    const name = JSON.parse(contents)?.name;
    if (typeof name !== 'string' || !name.trim() || !name.split('/').pop()) {
      throw new Error(`A non-empty package name is required in ${packagePath}. Provide it or set "name" and "build.lib.fileName" explicitly.`);
    }

    return name;
  }
}

module.exports = { defaultViteConfig };
