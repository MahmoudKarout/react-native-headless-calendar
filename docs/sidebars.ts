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
      label: 'Hooks & Selectors',
      items: [
        'hooks/providers',
        'hooks/use-calendar-selector',
        'hooks/use-calendar-actions',
        'hooks/selectors',
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
  ],
};

export default sidebars;
