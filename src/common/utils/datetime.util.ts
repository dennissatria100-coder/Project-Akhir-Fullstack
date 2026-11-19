import { DayType } from '../enums';

/** Venue berada di WIB (UTC+7, tanpa DST). */
export const WIB_OFFSET = '+07:00';
const WIB_MS = 7 * 60 * 60 * 1000;

export const pad = (n: number) => String(n).padStart(2, '0');

export function todayWIB(): string {
  return new Date(Date.now() + WIB_MS).toISOString().slice(0, 10);
}

export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(s: string, n: number): string {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function getDayType(s: string): DayType {
  const day = new Date(`${s}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6 ? DayType.WEEKEND : DayType.WEEKDAY;
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Gabungkan tanggal (YYYY-MM-DD) + jam (HH:mm) WIB menjadi Date absolut. */
export function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${WIB_OFFSET}`);
}

export function priceForHour(
  prices: { startTime: string; endTime: string; pricePerHour: number }[],
  hour: number,
): number | null {
  const min = hour * 60;
  const p = prices.find(
    (x) => toMinutes(x.startTime) <= min && min < toMinutes(x.endTime),
  );
  return p ? p.pricePerHour : null;
}
