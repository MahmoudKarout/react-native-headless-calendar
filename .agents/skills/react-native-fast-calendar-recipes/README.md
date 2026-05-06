# react-native-fast-calendar-recipes

Agent skill that teaches AI coding assistants (Cursor, Claude Code, Copilot, etc.) how to implement any of the 11 calendar recipes shipped with [`react-native-fast-calendar`](https://github.com/MahmoudKarout/react-native-fast-calendar).

## What it covers

| Pattern | What it gives you |
| --- | --- |
| `SimpleCalendar` | One-line drop-in date picker |
| Single date | `mode="single"` with custom header / footer / Today button |
| Date range | `minRangeDays`, `maxRangeDays`, `allowSameDay`, range readout |
| Multi-select | `mode="multiple"`, `maxSelected`, modifier dots |
| Bounded | `minDate`, `maxDate`, `disabledDates`, `disabledRanges`, `disabled` |
| Multi-month | `numberOfMonths`, ISO week numbers, Monday-first, collapsing rows |
| Multi-system | Gregorian + Hijri (or any community plugin) with system switcher |
| Custom slots | Replace `DayCell`, `WeekdayHeader`, `WeekdayCell`, `WeekNumberCell`, `MonthCaption` |
| Localised | French / Arabic / any language via `createGregorianSystem` |
| Image cells | `renderDay` swaps day numbers for `<Image>` / SVG / video poster |
| Bottom sheet | `@gorhom/bottom-sheet` integration (single + range) |
| Vertical list | iOS Calendar-style infinite month scroll via `@shopify/flash-list` |

## Install

```bash
npx skills add MahmoudKarout/react-native-fast-calendar/react-native-fast-calendar-recipes
```

(Replace the install path with your skill registry's convention if different.)

## Layout

```
react-native-fast-calendar-recipes/
├── SKILL.md                       # entry point — recipe decision tree + universal scaffold + rules
├── references/
│   ├── api-cheatsheet.md          # exports, hooks, prop tables, key types
│   ├── theme-tokens.md            # shadcn zinc + dark + vertical themes
│   ├── grid-recipes.md            # the 9 single-page grid recipes
│   ├── bottom-sheet.md            # @gorhom/bottom-sheet integration
│   └── vertical-list.md           # iOS-style infinite vertical month list
├── LICENSE.txt
└── README.md
```

The agent reads `SKILL.md` first, picks the matching recipe, then reads only the relevant reference file. Reference files are independent — none transitively requires another.

## License

MIT
