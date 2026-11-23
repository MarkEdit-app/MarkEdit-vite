# MarkEdit-vite

Default [Vite](https://vite.dev/) configuration for building [MarkEdit](https://github.com/MarkEdit-app/MarkEdit) extensions.

See [MarkEdit-api](https://github.com/MarkEdit-app/MarkEdit-api) to learn more.

## Usage

Add `markedit-vite` to your (TypeScript) project's devDependencies:

```json
{
  "devDependencies": {
    "markedit-vite": "0.6.0"
  }
}
```

Import `defaultViteConfig` and use it in your Vite config file:

```ts
import { defineConfig } from 'vite';
import { defaultViteConfig } from 'markedit-vite';

export default defineConfig(defaultViteConfig(options));
```

If the `options` is not provided, or some values are missing, the following is used:

```js
{
  entry: 'main.ts',
  format: 'cjs',
  outDir: 'dist',
  destDir: '/Library/Containers/app.cyan.markedit/Data/Documents/scripts/',
  copyDistFile: true,
}
```

You can also use it with the [mergeConfig](https://vite.dev/guide/api-javascript#mergeconfig) function.

IIFE output maps external imports to MarkEdit's runtime globals:

```ts
defaultViteConfig({ format: 'iife' });
```

IIFE/UMD infer a JavaScript-safe `name` from the project's package metadata, including for merged outputs. Pass `name: 'MyExtension'` to override it.

For IIFE/UMD without package metadata, supply `name`; when deploying, also override `build.lib.fileName` using `mergeConfig`.

CJS keeps Vite's existing filename behavior. Automatically deployed IIFE/UMD builds default to `<package-name>.js` (without the scope), matching typical CJS filenames. Deployment uses the output's basename, even for nested build paths. Remove any previously deployed `.iife.js` or `.umd.js` copies to avoid duplicates.

Automatic deployment requires one `.js` bundle in the selected format. ES/SystemJS and multi-format builds require `copyDistFile: false`. Vite 8 does not support SystemJS.
