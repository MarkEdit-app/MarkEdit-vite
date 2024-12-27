# MarkEdit-vite

Default [Vite](https://vite.dev/) configuration for building [MarkEdit](https://github.com/MarkEdit-app/MarkEdit) extensions.

See [MarkEdit-api](https://github.com/MarkEdit-app/MarkEdit-api) to learn more.

## Usage

Add `markedit-vite` to your (TypeScript) project's devDependencies:

```json
{
  "devDependencies": {
    "markedit-vite": "https://github.com/MarkEdit-app/MarkEdit-vite#v0.1.0"
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
  outDir: 'dist',
  destDir: '/Library/Containers/app.cyan.markedit/Data/Documents/scripts/',
}
```

You can also use it with the [mergeConfig](https://vite.dev/guide/api-javascript#mergeconfig) function.
