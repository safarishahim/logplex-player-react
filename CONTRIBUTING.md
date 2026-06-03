# Contributing

Thanks for your interest in improving `logplex-player-react`! 🎉

## Getting started

```bash
git clone https://github.com/safarishahim/logplex-player-react.git
cd logplex-player-react
npm install
npm run dev        # runs the docs/demo site (your changes hot-reload)
```

## Before opening a pull request

Please make sure these pass:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest
npm run build       # library build (dist/)
```

`npm run format` runs Prettier over the codebase.

## Conventions

- **TypeScript**, strict mode. No `any` unless unavoidable (and commented).
- The library defines its public API in `src/index.ts`; keep it intentional.
- Player UI lives in `src/skin/`, the headless wiring in `src/player/`, styles in `src/styles/player.css`.
- The player must keep working **without** the `analytics` prop (no required backend).
- RTL only right-aligns text — layout, seek direction and gestures stay physical.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

## Reporting bugs / requesting features

Use the [issue templates](https://github.com/safarishahim/logplex-player-react/issues/new/choose). A minimal reproduction (or the `src` URL and props) helps a lot.

By contributing you agree your work is licensed under the project's [MIT License](./LICENSE).
