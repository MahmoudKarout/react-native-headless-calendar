import type { JSX } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

const SINGLE_EXAMPLE = `import { Pressable, Text, View } from 'react-native';
import {
  SingleDateProvider,
  selectSingleDays,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-headless-calendar';

export function PickerScreen() {
  return (
    <SingleDateProvider onConfirm={({ date }) => console.log(date)}>
      <DayGrid />
    </SingleDateProvider>
  );
}

function DayGrid() {
  const days = useSingleCalendarSelector(selectSingleDays);
  const { selectDate, goPrevMonth, goNextMonth } = useSingleCalendarActions();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={goPrevMonth}><Text>‹</Text></Pressable>
        <Text>{days.displayedMonthLabel} {days.displayedYearLabel}</Text>
        <Pressable onPress={goNextMonth}><Text>›</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <Pressable
            key={cell.nativeDate.toISOString()}
            onPress={() => selectDate(cell.date)}
            disabled={cell.isDisabled}
          >
            <Text>{cell.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}`;

const RANGE_EXAMPLE = `import { Pressable, Text, View } from 'react-native';
import {
  RangeDateProvider,
  selectRangeCanConfirm,
  selectRangeDays,
  useRangeCalendarActions,
  useRangeCalendarSelector,
} from 'react-native-headless-calendar';

export function CustomCalendar() {
  return (
    <RangeDateProvider>
      <Grid />
      <Footer />
    </RangeDateProvider>
  );
}

function Grid() {
  const days = useRangeCalendarSelector(selectRangeDays);
  const { selectDate } = useRangeCalendarActions(); // stable, zero subscriptions
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {days.cells.map((cell) => (
        <Pressable
          key={cell.nativeDate.toISOString()}
          onPress={() => selectDate(cell.date)}
        >
          <Text>{cell.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Footer() {
  const start = useRangeCalendarSelector((s) => s.rangeStart);
  const { confirm } = useRangeCalendarActions();
  const canConfirm = useRangeCalendarSelector(selectRangeCanConfirm);
  return (
    <View>
      <Text>{start ? 'Pick checkout' : 'Pick check-in'}</Text>
      <Pressable onPress={confirm} disabled={!canConfirm}>
        <Text>Done</Text>
      </Pressable>
    </View>
  );
}`;

const SYSTEMS_EXAMPLE = `import { SingleDateProvider } from 'react-native-headless-calendar';
import { gregorianSystem } from 'react-native-headless-calendar';
import { hijriSystem } from 'react-native-headless-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-headless-calendar/systems/jalali';

const systems = [gregorianSystem, hijriSystem, jalaliSystem];

export function MultiSystemPicker() {
  return (
    <SingleDateProvider systems={systems} activeSystemId="hijri">
      <MyDayGrid />
    </SingleDateProvider>
  );
}`;

type FeatureProps = {
  title: string;
  description: string;
  icon: JSX.Element;
};

const FEATURES: FeatureProps[] = [
  {
    title: 'Zero wasted re-renders',
    description:
      'Tap a day and only that cell updates — every other day gets 0 wasted re-renders. Header, footer, and month chrome never wake up.',
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
    title: 'You focus on UI only',
    description:
      'No grid math, no range rules, no confirm/clear state machines. The provider owns selection logic — you wire hooks to your design system.',
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
    title: 'Tedious logic, handled',
    description:
      'Disabled dates, min/max ranges, multi-select caps, month navigation, and calendar-system switching — all built in so you never reimplement them.',
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
          d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  {
    title: 'Multi-calendar systems',
    description:
      'Gregorian, Hijri, and Jalali are 100% accurate and ship built-in. Plug in any custom system via the same adapter API.',
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
      'Typed providers, per-mode snapshots, cell info, and selection payloads — no `any` in the hot path.',
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
    title: 'Headless by design',
    description:
      'No bundled chrome. Two hooks per mode expose exactly what your cells need — nothing more, nothing less.',
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

const MODES = [
  {
    name: 'SingleDateProvider',
    blurb: 'One selected day — date pickers, forms, filters.',
    href: '/docs/hooks/providers#singledateprovider',
  },
  {
    name: 'RangeDateProvider',
    blurb: 'Start and end — hotels, travel, booking flows.',
    href: '/docs/hooks/providers#rangedateprovider',
  },
  {
    name: 'MultipleDateProvider',
    blurb: 'Many days — shifts, multi-day events, caps via maxSelected.',
    href: '/docs/hooks/providers#multipledateprovider',
  },
];

const STATS = [
  { value: '0', label: 'wasted re-renders on idle cells' },
  { value: '1', label: 'cell updates per tap' },
  { value: '2', label: 'hooks per mode' },
  { value: '100%', label: 'accurate built-in systems' },
];

export default function Home(): JSX.Element {
  return (
    <Layout
      title="react-native-headless-calendar"
      description="Headless React Native calendar with zero wasted re-renders and 100% accurate Gregorian, Hijri, and Jalali systems. We handle selection logic — you focus on UI only."
    >
      <main className={styles.page}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroBgMesh} aria-hidden="true" />
          <div className={styles.heroBgGrid} aria-hidden="true" />

          <div className={styles.heroInner}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              React Native · iOS · Android · Web
            </div>

            <h1 className={styles.heroTitle}>
              You build the UI.
              <br />
              We handle the logic — at zero wasted re-renders.
            </h1>

            <p className={styles.heroSubtitle}>
              Selection state, grid layout, range rules, disabled dates, and
              100% accurate Gregorian, Hijri, and Jalali systems are all built
              in. Tap a day and only that
              cell re-renders — every other day gets{' '}
              <strong>0 wasted re-renders</strong>. No more rewriting tedious
              calendar
              code; just compose your design system on top of two hooks.
            </p>

            <div className={styles.ctaRow}>
              <Link className={styles.ctaPrimary} to="/docs/intro">
                Read the docs
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
                yarn add react-native-headless-calendar
              </code>
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

        {/* MODES */}
        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Pick your mode"
              title="Three providers, one mental model"
              description="Each mode ships its own selection engine — range min/max, multi-select caps, confirm/clear, and view state are handled for you. You only wire the UI."
            />
            <div className={styles.modeGrid}>
              {MODES.map((mode) => (
                <Link key={mode.name} className={styles.modeCard} to={mode.href}>
                  <h3 className={styles.modeCardTitle}>
                    <code>{mode.name}</code>
                  </h3>
                  <p className={styles.modeCardDescription}>{mode.blurb}</p>
                  <span className={styles.modeCardCta}>
                    View API
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M13 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PERFORMANCE */}
        <section className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={styles.container}>
            <SectionHeader
              eyebrow="High performance"
              title="One tap. Zero wasted re-renders."
              description="Each day cell is an isolated reactive unit with stable props via useSyncExternalStore. Tap a date and only the cells whose selection or range state changed update — header, footer, and every idle day get zero wasted re-renders."
            />
          </div>
        </section>

        {/* FEATURES */}
        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Why this calendar"
              title="Stop rewriting calendar logic"
              description="Most calendar libraries make you own the hard parts — or ship opinionated UI you fight against. This one takes the tedious logic off your plate and leaves performance and pixels to you."
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
              title="Your components. Our state machine."
              description="Wrap a provider once — it owns selection, navigation, and constraints. You map hooks to Pressables and Text. No grid math in your codebase."
            />

            <div className={styles.codeGrid}>
              <div className={styles.codeCard}>
                <div className={styles.codeCardHeader}>
                  <div className={styles.codeCardTitle}>Date picker</div>
                  <div className={styles.codeCardSubtitle}>
                    SingleDateProvider · your own UI
                  </div>
                </div>
                <div className={styles.codeCardBody}>
                  <CodeBlock language="tsx">{SINGLE_EXAMPLE}</CodeBlock>
                </div>
              </div>

              <div className={styles.codeCard}>
                <div className={styles.codeCardHeader}>
                  <div className={styles.codeCardTitle}>Booking screen</div>
                  <div className={styles.codeCardSubtitle}>
                    RangeDateProvider · grid + confirm footer
                  </div>
                </div>
                <div className={styles.codeCardBody}>
                  <CodeBlock language="tsx">{RANGE_EXAMPLE}</CodeBlock>
                </div>
              </div>

              <div className={`${styles.codeCard} ${styles.codeCardWide}`}>
                <div className={styles.codeCardHeader}>
                  <div className={styles.codeCardTitle}>
                    Multiple calendar systems
                  </div>
                  <div className={styles.codeCardSubtitle}>
                    100% accurate Gregorian, Hijri, and Jalali — or your own.
                    Switch at runtime.
                  </div>
                </div>
                <div className={styles.codeCardBody}>
                  <CodeBlock language="tsx">{SYSTEMS_EXAMPLE}</CodeBlock>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaCard}>
              <h2 className={styles.ctaTitle}>
                Ship a fast calendar without the tedious logic.
              </h2>
              <p className={styles.ctaDescription}>
                Drop in a provider, subscribe with two hooks, and style your
                cells — <strong>0 wasted re-renders</strong> on idle days,{' '}
                <strong>100% focus</strong> on the UI your product needs.
              </p>
              <div className={styles.ctaRow}>
                <Link className={styles.ctaPrimary} to="/docs/intro">
                  Read the docs
                </Link>
                <Link
                  className={styles.ctaSecondary}
                  to="/docs/hooks/providers"
                >
                  API reference
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
