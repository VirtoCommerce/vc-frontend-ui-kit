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

## License

[Virto Commerce Open Software License](LICENSE.txt).
