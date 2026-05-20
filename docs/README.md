# react-native-fast-calendar — documentation site

Static docs built with [Docusaurus](https://docusaurus.io/), published to GitHub Pages.

## Structure

```
docs/
├── docs/
│   ├── intro.md
│   ├── installation.md
│   ├── core-concepts/
│   ├── hooks/           # providers, selector hook, actions hook, selectors
│   ├── types/
│   └── systems/
├── src/
│   └── pages/           # Landing page
├── sidebars.ts
└── docusaurus.config.ts
```

## Commands

```bash
cd docs
yarn install
yarn start      # dev server
yarn build      # production build
yarn deploy     # gh-pages
```

## Adding a page

1. Create `docs/docs/<section>/<slug>.md` with front matter (`sidebar_position`, `title`, …).
2. Register the slug in `sidebars.ts`.
3. Use the current API: `SingleDateProvider` / `RangeDateProvider` / `MultipleDateProvider` and matching hooks.

## Conventions

- Code examples must match `src/index.ts` exports.
- Prefer linking to [Providers](./docs/hooks/providers.md) for shared prop tables.
- `firstDayOfWeek` defaults to Monday (`1`).
