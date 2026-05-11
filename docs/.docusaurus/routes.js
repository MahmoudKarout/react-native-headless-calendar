import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/blog',
    component: ComponentCreator('/blog', '98b'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'e1c'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', 'be5'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '096'),
            routes: [
              {
                path: '/docs/advanced/custom-calendar-system',
                component: ComponentCreator('/docs/advanced/custom-calendar-system', 'd28'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/advanced/performance-optimization',
                component: ComponentCreator('/docs/advanced/performance-optimization', 'a6f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/advanced/testing',
                component: ComponentCreator('/docs/advanced/testing', '735'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/components/calendar-daycell',
                component: ComponentCreator('/docs/components/calendar-daycell', '9cb'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/components/calendar-daygrid',
                component: ComponentCreator('/docs/components/calendar-daygrid', '8d0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/components/calendar-root',
                component: ComponentCreator('/docs/components/calendar-root', '172'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/components/simple-calendar',
                component: ComponentCreator('/docs/components/simple-calendar', '443'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/core-concepts/calendar-systems',
                component: ComponentCreator('/docs/core-concepts/calendar-systems', '456'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/core-concepts/headless-design',
                component: ComponentCreator('/docs/core-concepts/headless-design', '5ff'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/core-concepts/mental-model',
                component: ComponentCreator('/docs/core-concepts/mental-model', '937'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/core-concepts/theming',
                component: ComponentCreator('/docs/core-concepts/theming', 'da9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-actions',
                component: ComponentCreator('/docs/hooks/use-calendar-actions', 'f50'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-components',
                component: ComponentCreator('/docs/hooks/use-calendar-components', 'f3e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-config',
                component: ComponentCreator('/docs/hooks/use-calendar-config', 'd73'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-first-day-of-week',
                component: ComponentCreator('/docs/hooks/use-calendar-first-day-of-week', '04d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-header',
                component: ComponentCreator('/docs/hooks/use-calendar-header', 'bbf'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-labels',
                component: ComponentCreator('/docs/hooks/use-calendar-labels', '634'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-month-label',
                component: ComponentCreator('/docs/hooks/use-calendar-month-label', 'ec9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-month-picker',
                component: ComponentCreator('/docs/hooks/use-calendar-month-picker', 'ba6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-navigation',
                component: ComponentCreator('/docs/hooks/use-calendar-navigation', '914'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-selected-dates',
                component: ComponentCreator('/docs/hooks/use-calendar-selected-dates', '4c8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-selector',
                component: ComponentCreator('/docs/hooks/use-calendar-selector', 'eb3'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-store',
                component: ComponentCreator('/docs/hooks/use-calendar-store', 'bd5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-system-switcher',
                component: ComponentCreator('/docs/hooks/use-calendar-system-switcher', 'c63'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-theme',
                component: ComponentCreator('/docs/hooks/use-calendar-theme', '951'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-week-numbers',
                component: ComponentCreator('/docs/hooks/use-calendar-week-numbers', '1c1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-weekday-labels',
                component: ComponentCreator('/docs/hooks/use-calendar-weekday-labels', '6d7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-year-label',
                component: ComponentCreator('/docs/hooks/use-calendar-year-label', 'e16'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/hooks/use-calendar-year-picker',
                component: ComponentCreator('/docs/hooks/use-calendar-year-picker', '44b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/installation',
                component: ComponentCreator('/docs/installation', 'b74'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/bottom-sheet-picker',
                component: ComponentCreator('/docs/recipes/bottom-sheet-picker', '60d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/bounded-selection',
                component: ComponentCreator('/docs/recipes/bounded-selection', 'c60'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/custom-day-cell',
                component: ComponentCreator('/docs/recipes/custom-day-cell', '474'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/date-range-picker',
                component: ComponentCreator('/docs/recipes/date-range-picker', 'eef'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/flight-price-calendar',
                component: ComponentCreator('/docs/recipes/flight-price-calendar', 'b2d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/multi-date-picker',
                component: ComponentCreator('/docs/recipes/multi-date-picker', '7ef'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/multi-month-grid',
                component: ComponentCreator('/docs/recipes/multi-month-grid', 'cd7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/single-date-picker',
                component: ComponentCreator('/docs/recipes/single-date-picker', 'b97'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/vertical-list',
                component: ComponentCreator('/docs/recipes/vertical-list', '584'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/recipes/week-numbers',
                component: ComponentCreator('/docs/recipes/week-numbers', 'a29'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/systems/custom-system',
                component: ComponentCreator('/docs/systems/custom-system', '773'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/systems/gregorian',
                component: ComponentCreator('/docs/systems/gregorian', 'c32'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/systems/hijri',
                component: ComponentCreator('/docs/systems/hijri', 'b32'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/systems/jalali',
                component: ComponentCreator('/docs/systems/jalali', '7fa'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-components',
                component: ComponentCreator('/docs/types/calendar-components', '977'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-matcher',
                component: ComponentCreator('/docs/types/calendar-matcher', '5b0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-modifiers',
                component: ComponentCreator('/docs/types/calendar-modifiers', 'eab'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-root-props',
                component: ComponentCreator('/docs/types/calendar-root-props', '919'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-selection-payload',
                component: ComponentCreator('/docs/types/calendar-selection-payload', '5aa'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-snapshot',
                component: ComponentCreator('/docs/types/calendar-snapshot', '01b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-store',
                component: ComponentCreator('/docs/types/calendar-store', 'b44'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-system',
                component: ComponentCreator('/docs/types/calendar-system', 'bb0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/calendar-theme',
                component: ComponentCreator('/docs/types/calendar-theme', 'c06'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/day-cell-info',
                component: ComponentCreator('/docs/types/day-cell-info', '757'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/day-cell-props',
                component: ComponentCreator('/docs/types/day-cell-props', 'f42'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/day-grid-props',
                component: ComponentCreator('/docs/types/day-grid-props', '5e6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/types/simple-calendar-props',
                component: ComponentCreator('/docs/types/simple-calendar-props', 'da5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/utilities/build-month-grid',
                component: ComponentCreator('/docs/utilities/build-month-grid', '6c8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/utilities/get-year-page',
                component: ComponentCreator('/docs/utilities/get-year-page', 'd5d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/utilities/is-between',
                component: ComponentCreator('/docs/utilities/is-between', '8fe'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/utilities/is-explicitly-disabled',
                component: ComponentCreator('/docs/utilities/is-explicitly-disabled', '3da'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/utilities/iso-week-number',
                component: ComponentCreator('/docs/utilities/iso-week-number', 'f69'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/utilities/match-date',
                component: ComponentCreator('/docs/utilities/match-date', '8e5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/utilities/rotate-weekday-labels',
                component: ComponentCreator('/docs/utilities/rotate-weekday-labels', '999'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/utilities/used-rows',
                component: ComponentCreator('/docs/utilities/used-rows', '780'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
