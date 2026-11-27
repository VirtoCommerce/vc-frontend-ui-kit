# vc-frontend-ui-kit

The UI kit of the [Virto Commerce storefront](https://github.com/VirtoCommerce/vc-frontend): `Vc*` components,
their styles and tokens, the Tailwind preset and the stock color presets. It will ship as the npm package
`@vc-frontend/ui-kit`.

## `src/` is a mirror

ui-kit is still developed in vc-frontend, in `client-app/ui-kit`. Every merge to vc-frontend's `dev` that changes
that folder is copied into `src/` here by a bot, as a `sync: vc-frontend@<sha>` commit.

- **Don't edit `src/` here.** The next sync overwrites it, and CI fails any pull request that touches it.
  Change ui-kit with a pull request to vc-frontend.
- Everything outside `src/` (build, CI, Storybook) is edited here as usual.

## The package

The package ships the kit's sources (`.vue`, `.ts`, SCSS, icons, locales), not a build: the app compiles them
with its own Vite, Tailwind and Sass. `node scripts/pack.mjs` (run by `npm pack` / `npm publish`) copies `src/`
into `dist/` without tests and stories and turns relative imports between kit files into `@/ui-kit/…`, so an app
can replace any kit file with its own copy.

### Using it in an app

1. Install `@vc-frontend/ui-kit` and its peers: `vue`, `vue-i18n`, `vue-router`, `@vueuse/core`, `tailwindcss` 3,
   `sass`.
2. `vite.config.ts`: add `uiKitVitePlugin()` from `@vc-frontend/ui-kit/vite` before `vue()`. It resolves
   `@/ui-kit/…`, keeps icons as files and pre-bundles the kit's dependencies.
3. `tailwind.config.ts`: `presets: [uiKitPreset]` from `@vc-frontend/ui-kit/tailwind-preset`, and add
   `./node_modules/@vc-frontend/ui-kit/dist/**/*.{vue,ts}` to `content`.
4. `tsconfig.json`: the package's global types and the same lookup order as the plugin:

   ```json
   {
     "include": ["node_modules/@vc-frontend/ui-kit/dist/**/*.d.ts"],
     "compilerOptions": {
       "paths": {
         "@/ui-kit": ["./client-app/ui-kit", "./node_modules/@vc-frontend/ui-kit/dist"],
         "@/ui-kit/*": ["./client-app/ui-kit/*", "./node_modules/@vc-frontend/ui-kit/dist/*"]
       }
     }
   }
   ```

`smoke/` is such an app; `node scripts/smoke.mjs` installs the packed package into a copy of it and builds it.

### Replacing a kit file

Put a file at the same path under `client-app/ui-kit` (or the `local` folder passed to the plugin), for example
`client-app/ui-kit/components/molecules/button/vc-button.vue`. Every import of it, from the app and from inside the
package, gets the app's file. `import.meta.glob` inside the kit (icons, preset stylesheets) sees only the package's
files, so icons and presets can't be added this way.

### Checks

```bash
yarn check-locales
yarn validate:types
yarn test:unit run
node scripts/pack.mjs && node scripts/smoke.mjs
```

## License

[Virto Commerce Open Software License](LICENSE.txt).
