export const APP_TIME_ZONE = "Asia/Singapore";
const APP_UTC_OFFSET = "+08:00";

function getDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function toDateKey(value: Date | null | undefined) {
  if (!value) return "";
  const { year, month, day } = getDateParts(value);
  return `${year}-${month}-${day}`;
}

export function toDateTimeText(value: Date | null | undefined) {
  if (!value) return "";
  const { year, month, day, hour, minute } = getDateParts(value);
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00${APP_UTC_OFFSET}`);
}

export function parseDateTimeInput(value: string) {
  if (/(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    return new Date(value);
  }
  return new Date(`${value}:00${APP_UTC_OFFSET}`);
}

export function todayDateKey(now = new Date()) {
  return toDateKey(now);
}

export function addDaysToDateKey(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekdayFromDateKey(value: string) {
  return new Date(`${value}T00:00:00Z`).getUTCDay();
}
