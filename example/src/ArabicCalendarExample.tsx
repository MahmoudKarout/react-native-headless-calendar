/**
 * Arabic copy for month names / weekday captions + RTL-friendly Saturday-first grid.
 *
 * Same pattern everywhere: swap the bundled `*_System` instances for
 * `createGregorianSystem` / `createHijriSystem` / `createJalaliSystem` options.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CalendarSystem } from 'react-native-fast-calendar';
import { SimpleCalendar } from 'react-native-fast-calendar';
import { createGregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { createHijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { createJalaliSystem } from 'react-native-fast-calendar/systems/jalali';

/** Library order: Sun (0) → Sat (6). `firstDayOfWeek` on Root rotates presentation. */
const AR_WEEKDAYS_SUN_FIRST = Object.freeze([
  'أحد',
  'اثنين',
  'ثلاثاء',
  'أربعاء',
  'خميس',
  'جمعة',
  'سبت',
]);

const gregorianArabic = createGregorianSystem({
  label: 'ميلادي',
  monthLabels: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  weekdayLabels: AR_WEEKDAYS_SUN_FIRST,
});

const hijriArabic = createHijriSystem({
  label: 'هجري',
  monthLabels: [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ],
  weekdayLabels: AR_WEEKDAYS_SUN_FIRST,
});

/** Persian solar months — Arabic-script spellings commonly used in Arabic locales. */
const jalaliArabic = createJalaliSystem({
  label: 'جلالي',
  monthLabels: [
    'فروردين',
    'أرديبهشت',
    'خرداد',
    'تير',
    'مرداد',
    'شهريور',
    'مهر',
    'آبان',
    'آذر',
    'دي',
    'بهمن',
    'إسفند',
  ],
  weekdayLabels: AR_WEEKDAYS_SUN_FIRST,
});

const SYSTEMS_AR: readonly CalendarSystem[] = [
  gregorianArabic,
  hijriArabic,
  jalaliArabic,
];

const LABELS_AR = Object.freeze({
  confirm: 'تأكيد',
  clear: 'مسح',
  prev: 'السابق',
  next: 'التالي',
  selectMonth: 'اختر الشهر',
  selectYear: 'اختر السنة',
});

export default function ArabicCalendarExample() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Arabic systems</Text>
        <Text style={styles.introBody}>
          Gregorian, Hijri, and Jalali month names plus weekdays come from{' '}
          createGregorianSystem / createHijriSystem / createJalaliSystem. Footer
          and nav strings use SimpleCalendar labels overrides. Switch the
          segmented control above the grid to change calendars. This screen uses{' '}
          firstDayOfWeek=6 (Saturday-first), common in Gulf layouts; use 0–6 for
          your locale.
        </Text>
      </View>
      <SimpleCalendar
        firstDayOfWeek={6}
        labels={LABELS_AR}
        swipeable
        systems={SYSTEMS_AR}
        testID="arabic-demo"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  intro: {
    maxWidth: 360,
    gap: 6,
    marginBottom: 4,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  introBody: {
    fontSize: 13,
    lineHeight: 18,
    color: '#71717A',
  },
});
