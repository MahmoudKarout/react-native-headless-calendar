import type { JSX } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';

import CalendarDemo from '@site/src/components/CalendarDemo';
import PerfCalendarDemo from '@site/src/components/PerfCalendarDemo';
import styles from './index.module.css';

const SIMPLE_EXAMPLE = `import { SimpleCalendar } from 'react-native-fast-calendar';

export function BookingScreen() {
  return (
    <SimpleCalendar
      mode="range"
      minRangeDays={2}
      onConfirm={({ startDate, endDate }) => {
        console.log('Booked', startDate, endDate);
      }}
    />
  );
}`;

const HEADLESS_EXAMPLE = `import {
  Calendar,
  useCalendarSelector,
  useCalendarActions,
} from 'react-native-fast-calendar';

export function CustomCalendar() {
  return (
    <Calendar.Root mode="range">
      <Calendar.DayGrid swipeable />
      <Footer />
    </Calendar.Root>
  );
}

function Footer() {
  const range = useCalendarSelector((s) => s.rangeStart);
  const { confirm, canConfirm } = useCalendarActions();
  return (
    <View>
      <Text>{range ? 'Pick checkout' : 'Pick check-in'}</Text>
      <Button title="Done" onPress={confirm} disabled={!canConfirm} />
    </View>
  );
}`;

const SYSTEMS_EXAMPLE = `import {
  Calendar,
  hijriSystem,
  jalaliSystem,
  gregorianSystem,
} from 'react-native-fast-calendar';

const systems = [gregorianSystem, hijriSystem, jalaliSystem];

export function MultiSystemPicker() {
  return (
    <Calendar.Root systems={systems} mode="single">
      <Calendar.DayGrid />
    </Calendar.Root>
  );
}`;

type FeatureProps = {
  title: string;
  description: string;
  icon: JSX.Element;
};

const FEATURES: FeatureProps[] = [
  {
    title: 'Headless by design',
    description:
      'Bring your own UI. Hooks expose exactly the state you need, when you need it.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 7h16M4 12h16M4 17h10"
        />
      </svg>
    ),
  },
  {
    title: 'Granular subscriptions',
    description:
      'Tap a day and only that day re-renders. Header, footer, and pickers stay still.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"
        />
      </svg>
    ),
  },
  {
    title: 'Multi-calendar systems',
    description:
      'Gregorian, Hijri, and Jalali built-in. Plug in any custom system you like.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="12" r="9" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"
        />
      </svg>
    ),
  },
  {
    title: 'TypeScript first',
    description:
      'Every prop, hook, and slot is fully typed with discriminated unions you can lean on.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 9h6M12 9v8M16 13c1.5 0 2.5 1 2.5 2.2 0 1.4-1.2 1.8-2.5 1.8"
        />
      </svg>
    ),
  },
  {
    title: 'Cross-platform',
    description:
      'Runs on iOS, Android, and web via React Native Web — including this very page.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 20h8M12 18v2"
        />
      </svg>
    ),
  },
  {
    title: 'Composable slots',
    description:
      'Replace DayCell, MonthCaption, WeekNumberCell, or the whole grid — keep state, swap UI.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
];

const RECIPES = [
  {
    title: 'Date Range Picker',
    description: 'Hotel-style range with min/max nights.',
    href: '/docs/recipes/date-range-picker',
  },
  {
    title: 'Flight Price Calendar',
    description: 'Dark, fare-aware range picker with per-day prices.',
    href: '/docs/recipes/flight-price-calendar',
  },
  {
    title: 'Multi-Date Picker',
    description: 'Toggle multiple dates with a hard cap.',
    href: '/docs/recipes/multi-date-picker',
  },
  {
    title: 'Multi-Month Grid',
    description: 'Two months side-by-side, like Airbnb.',
    href: '/docs/recipes/multi-month-grid',
  },
  {
    title: 'Custom Day Cell',
    description: 'Modifier dots, prices, status badges.',
    href: '/docs/recipes/custom-day-cell',
  },
  {
    title: 'Bottom Sheet Picker',
    description: 'Mobile-first modal date picker.',
    href: '/docs/recipes/bottom-sheet-picker',
  },
  {
    title: 'Wheel Date Picker',
    description: 'iOS drum-roll wheel — day, month, year columns.',
    href: '/docs/recipes/wheel-date-picker',
  },
];

const STATS = [
  { value: '0', label: 'runtime deps in core' },
  { value: '18+', label: 'composable hooks' },
  { value: '60fps', label: 'on every day tap' },
  { value: '∞', label: 'calendar systems' },
];

export default function Home(): JSX.Element {
  return (
    <Layout
      title="react-native-fast-calendar"
      description="A headless, high-performance calendar library for React Native — built for speed, composition, and any calendar system."
    >
      <main className={styles.page}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroBgGrid} aria-hidden="true" />
          <div className={styles.heroBgGlow} aria-hidden="true" />

          <div className={styles.heroInner}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              React Native · iOS · Android · Web
            </div>

            <h1 className={styles.heroTitle}>
              The headless calendar{' '}
              <span className={styles.heroTitleAccent}>built for speed.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              A composable calendar primitive for React Native. Granular state,
              multi-calendar systems, and zero opinions about your UI — ship
              single date pickers, range bookings, and infinite vertical grids
              without re-rendering the universe.
            </p>

            <div className={styles.ctaRow}>
              <Link className={styles.ctaPrimary} to="/docs/intro">
                Get started
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                className={styles.ctaSecondary}
                to="https://github.com/MahmoudKarout/react-native-fast-calendar"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.48 2 2 6.58 2 12.25c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.55 2.36 1.1 2.94.84.09-.66.35-1.1.64-1.36-2.22-.26-4.55-1.13-4.55-5.04 0-1.11.39-2.02 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.04A9.4 9.4 0 0 1 12 6.84c.85.004 1.7.12 2.5.34 1.91-1.31 2.74-1.04 2.74-1.04.55 1.42.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.74 0 3.92-2.34 4.78-4.57 5.03.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49 3.96-1.36 6.83-5.18 6.83-9.67C22 6.58 17.52 2 12 2Z"
                  />
                </svg>
                Star on GitHub
              </Link>
            </div>

            <div className={styles.installRow}>
              <span className={styles.installLabel}>$</span>
              <code className={styles.installCmd}>
                npm install react-native-fast-calendar
              </code>
            </div>
          </div>

          <div className={styles.heroDemoWrapper}>
            <div className={styles.heroDemoFrame}>
              <div className={styles.heroDemoBar}>
                <span className={styles.heroDemoDot} />
                <span className={styles.heroDemoDot} />
                <span className={styles.heroDemoDot} />
                <span className={styles.heroDemoLabel}>
                  Calendar.Root · mode="range"
                </span>
              </div>
              <CalendarDemo mode="range" minRangeDays={2} maxRangeDays={14} />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className={styles.stats}>
          <div className={styles.container}>
            <div className={styles.statsGrid}>
              {STATS.map((stat) => (
                <div key={stat.label} className={styles.statItem}>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PERF DEMO */}
        <section className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Granular re-renders"
              title="One tap. One re-render."
              description="Every day cell is an isolated reactive unit wrapped in React.memo. The tiny counter inside each cell shows exactly how many times it has rendered since the month was loaded — click any date and watch only the affected cells update."
            />
            <div className={styles.perfDemoWrapper}>
              <PerfCalendarDemo />
              <div className={styles.perfDemoCaption}>
                <svg
                  className={styles.perfDemoCaptionIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"
                  />
                </svg>
                <span>
                  Cells frozen at <strong>1×</strong> never re-rendered. Only
                  the cells whose state changed update — the header, footer, and
                  every other day stay completely still.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Why this calendar"
              title="Designed to disappear"
              description="A small surface area you compose into the calendar your product actually needs — no more fighting opinionated UI to look like your design system."
            />
            <div className={styles.featureGrid}>
              {FEATURES.map((feature) => (
                <div key={feature.title} className={styles.featureCard}>
                  <div className={styles.featureIcon}>{feature.icon}</div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CODE EXAMPLES */}
        <section className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Two layers, one library"
              title="Batteries-included or completely custom"
              description="Start with SimpleCalendar for the 90% case. Drop down to the headless layer when you need pixel-level control."
            />

            <div className={styles.codeGrid}>
              <div className={styles.codeCard}>
                <div className={styles.codeCardHeader}>
                  <div className={styles.codeCardTitle}>SimpleCalendar</div>
                  <div className={styles.codeCardSubtitle}>
                    one component · sane defaults · ready in 30 seconds
                  </div>
                </div>
                <div className={styles.codeCardBody}>
                  <CodeBlock language="tsx">{SIMPLE_EXAMPLE}</CodeBlock>
                </div>
              </div>

              <div className={styles.codeCard}>
                <div className={styles.codeCardHeader}>
                  <div className={styles.codeCardTitle}>Headless</div>
                  <div className={styles.codeCardSubtitle}>
                    your UI · our state · pick the hooks you need
                  </div>
                </div>
                <div className={styles.codeCardBody}>
                  <CodeBlock language="tsx">{HEADLESS_EXAMPLE}</CodeBlock>
                </div>
              </div>

              <div className={`${styles.codeCard} ${styles.codeCardWide}`}>
                <div className={styles.codeCardHeader}>
                  <div className={styles.codeCardTitle}>
                    Multiple calendar systems
                  </div>
                  <div className={styles.codeCardSubtitle}>
                    Gregorian, Hijri, Jalali — or your own. Switch at runtime.
                  </div>
                </div>
                <div className={styles.codeCardBody}>
                  <CodeBlock language="tsx">{SYSTEMS_EXAMPLE}</CodeBlock>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RECIPES */}
        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Recipes"
              title="What you can build"
              description="Production-ready patterns with interactive demos you can poke at right in the docs."
            />
            <div className={styles.recipeGrid}>
              {RECIPES.map((recipe) => (
                <Link
                  key={recipe.title}
                  to={recipe.href}
                  className={styles.recipeCard}
                >
                  <div className={styles.recipeCardTitle}>{recipe.title}</div>
                  <div className={styles.recipeCardDescription}>
                    {recipe.description}
                  </div>
                  <div className={styles.recipeCardCta}>
                    Read recipe
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M13 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaCard}>
              <h2 className={styles.ctaTitle}>
                Ship the calendar your design system deserves.
              </h2>
              <p className={styles.ctaDescription}>
                Read the docs, copy a recipe, or drop in{' '}
                <code>SimpleCalendar</code> and start picking dates.
              </p>
              <div className={styles.ctaRow}>
                <Link className={styles.ctaPrimary} to="/docs/intro">
                  Read the docs
                </Link>
                <Link
                  className={styles.ctaSecondary}
                  to="/docs/recipes/single-date-picker"
                >
                  Browse recipes
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionEyebrow}>{eyebrow}</div>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionDescription}>{description}</p>
    </div>
  );
}
