# React Native Fast Calendar Documentation

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Documentation Structure

```
docs/
├── docs/
│   ├── intro.md                    # Introduction
│   ├── installation.md             # Installation guide
│   ├── core-concepts/              # Core concepts
│   │   ├── mental-model.md
│   │   ├── headless-design.md
│   │   ├── calendar-systems.md
│   │   └── theming.md
│   ├── components/                 # Components
│   │   ├── simple-calendar.md
│   │   ├── calendar-root.md
│   │   ├── calendar-daygrid.md
│   │   └── calendar-daycell.md
│   ├── hooks/                      # Hooks (18 total)
│   │   ├── use-calendar-store.md
│   │   ├── use-calendar-selector.md
│   │   ├── use-calendar-actions.md
│   │   └── ...
│   ├── types/                      # Types & Interfaces
│   │   ├── calendar-system.md
│   │   ├── calendar-theme.md
│   │   ├── day-cell-info.md
│   │   └── ...
│   ├── systems/                    # Calendar Systems
│   │   ├── gregorian.md
│   │   ├── hijri.md
│   │   ├── jalali.md
│   │   └── custom-system.md
│   ├── utilities/                  # Grid Utilities
│   │   ├── build-month-grid.md
│   │   ├── iso-week-number.md
│   │   └── ...
│   └── recipes/                    # Recipes & Examples
│       ├── single-date-picker.md
│       ├── date-range-picker.md
│       └── ...
└── src/
    └── css/
        └── custom.css
```

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

```bash
npm run deploy
```

## Documentation Features

- **Comprehensive API Reference**: Every component, hook, type, and utility is documented
- **Recipes**: Practical examples for common use cases
- **TypeScript**: All examples and interfaces are fully typed
- **Search**: Built-in search functionality
- **Dark Mode**: Automatic dark mode support

## Adding New Documentation

1. Create a new `.md` file in the appropriate folder
2. Add the file to `sidebars.ts` if needed
3. Use the existing files as templates for structure

## Writing Conventions

- Use code blocks with language tags
- Include runnable examples where possible
- Document parameters and return types
- Add cross-references to related topics
