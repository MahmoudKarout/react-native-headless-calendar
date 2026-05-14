import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const SITE_URL = 'https://mahmoudkarout.github.io';
const SITE_BASE_URL = '/react-native-fast-calendar/';
const GITHUB_URL =
  'https://github.com/MahmoudKarout/react-native-fast-calendar';

const SITE_TITLE = 'react-native-fast-calendar';
const SITE_TAGLINE =
  'A headless, high-performance, multi-calendar-system primitive for React Native — Gregorian, Hijri, Jalali, custom — bring your own UI.';

const KEYWORDS = [
  'react-native',
  'react native calendar',
  'headless calendar',
  'date picker',
  'date range picker',
  'react native date picker',
  'hijri calendar',
  'jalali calendar',
  'gregorian calendar',
  'flash-list calendar',
  'composable calendar',
  'typescript calendar',
];

const config: Config = {
  title: SITE_TITLE,
  tagline: SITE_TAGLINE,
  favicon: 'img/logo.svg',

  url: SITE_URL,
  baseUrl: SITE_BASE_URL,
  trailingSlash: false,

  organizationName: 'MahmoudKarout',
  projectName: 'react-native-fast-calendar',
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',

  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
      },
    },
    {
      tagName: 'meta',
      attributes: { name: 'keywords', content: KEYWORDS.join(', ') },
    },
    {
      tagName: 'meta',
      attributes: { name: 'author', content: 'Mahmoud Karout' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:type', content: 'website' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'twitter:card', content: 'summary_large_image' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'theme-color', content: '#171717' },
    },
  ],

  markdown: {
    mdx1Compat: {
      comments: false,
      admonitions: false,
      headingIds: false,
    },
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `${GITHUB_URL}/tree/main/docs/`,
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.7,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    metadata: [
      { name: 'description', content: SITE_TAGLINE },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_TAGLINE },
      { property: 'og:site_name', content: SITE_TITLE },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_TAGLINE },
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: false,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    navbar: {
      title: 'react-native-fast-calendar',
      logo: {
        alt: 'react-native-fast-calendar logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/recipes/single-date-picker',
          label: 'Recipes',
          position: 'left',
        },
        {
          to: '/docs/hooks/use-calendar-selector',
          label: 'API',
          position: 'left',
        },
        {
          href: GITHUB_URL,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/intro' },
            { label: 'Installation', to: '/docs/installation' },
            { label: 'Mental Model', to: '/docs/core-concepts/mental-model' },
          ],
        },
        {
          title: 'Recipes',
          items: [
            {
              label: 'Single Date Picker',
              to: '/docs/recipes/single-date-picker',
            },
            {
              label: 'Date Range Picker',
              to: '/docs/recipes/date-range-picker',
            },
            {
              label: 'Bottom Sheet Picker',
              to: '/docs/recipes/bottom-sheet-picker',
            },
            {
              label: 'Flight Price Calendar',
              to: '/docs/recipes/flight-price-calendar',
            },
          ],
        },
        {
          title: 'API',
          items: [
            {
              label: 'useCalendarSelector',
              to: '/docs/hooks/use-calendar-selector',
            },
            {
              label: 'useCalendarActions',
              to: '/docs/hooks/use-calendar-actions',
            },
            { label: 'Selectors', to: '/docs/hooks/select-days' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: GITHUB_URL },
            { label: 'Issues', href: `${GITHUB_URL}/issues` },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/react-native-fast-calendar',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} react-native-fast-calendar — MIT licensed. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['bash', 'json', 'tsx', 'typescript'],
      magicComments: [
        {
          className: 'theme-code-block-highlighted-line',
          line: 'highlight-next-line',
          block: { start: 'highlight-start', end: 'highlight-end' },
        },
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
