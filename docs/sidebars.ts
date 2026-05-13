import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'installation',
    {
      type: 'category',
      label: 'Core Concepts',
      items: ['core-concepts/mental-model', 'core-concepts/calendar-systems'],
    },
    {
      type: 'category',
      label: 'Hooks',
      items: [
        'hooks/use-calendar-days',
        'hooks/use-calendar-months',
        'hooks/use-calendar-years',
        'hooks/use-calendar-actions',
        'hooks/use-calendar-selector',
      ],
    },
    {
      type: 'category',
      label: 'Calendar Systems',
      items: [
        'systems/gregorian',
        'systems/hijri',
        'systems/jalali',
        'systems/custom-system',
      ],
    },
    {
      type: 'category',
      label: 'Types & Interfaces',
      items: [
        'types/calendar-system',
        'types/day-cell-info',
        'types/calendar-modifiers',
        'types/calendar-matcher',
        'types/calendar-selection-payload',
      ],
    },
    {
      type: 'category',
      label: 'Recipes',
      items: [
        'recipes/single-date-picker',
        'recipes/date-range-picker',
        'recipes/multi-date-picker',
        'recipes/bounded-selection',
        'recipes/multi-month-grid',
        'recipes/custom-day-cell',
        'recipes/week-numbers',
        'recipes/bottom-sheet-picker',
        'recipes/vertical-list',
        'recipes/flight-price-calendar',
        'recipes/wheel-date-picker',
      ],
    },
  ],
};

export default sidebars;
