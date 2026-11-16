/** Day keys are UTC calendar dates, `YYYY-MM-DD`. One town per key. */
export type DayKey = string;

const DAY_MS = 86_400_000;

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function isDayKey(value: unknown): value is DayKey {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function dayKeyOf(date: Date): DayKey {
  return date.toISOString().slice(0, 10);
}

export function dateOfDayKey(key: DayKey): Date {
  return new Date(`${key}T00:00:00Z`);
}

export function addDays(key: DayKey, days: number): DayKey {
  return dayKeyOf(new Date(dateOfDayKey(key).getTime() + days * DAY_MS));
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round(
    (dateOfDayKey(to).getTime() - dateOfDayKey(from).getTime()) / DAY_MS
  );
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: DayKey): number {
  return dateOfDayKey(key).getUTCDay();
}

/** Town No. 1 is the launch day. */
export function puzzleNumber(key: DayKey, launchKey: DayKey): number {
  return daysBetween(launchKey, key) + 1;
}

export function msUntilNextDay(now: Date): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return next - now.getTime();
}

/** A solve time as the result card shows it: "1:42", "12:05". Never "0:00". */
export function formatClock(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "Monday 14 December" */
export function longDate(key: DayKey): string {
  const date = dateOfDayKey(key);
  return `${WEEKDAY_NAMES[date.getUTCDay()]} ${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]}`;
}
