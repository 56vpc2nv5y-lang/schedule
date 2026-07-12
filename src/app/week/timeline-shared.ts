// 时间轴共享逻辑：周计划（7 列）与「今日」页（单列）复用同一套小时网格数学，避免重复。

export const START_HOUR = 6;
export const END_HOUR = 23;
export const HOUR_PX = 44;
export const SNAP = 15;
export const RANGE_MIN = (END_HOUR - START_HOUR) * 60;

/** 分钟数 → 距顶部像素 */
export function minToTop(min: number) {
  return ((min - START_HOUR * 60) / 60) * HOUR_PX;
}

/** 840 → "14:00"（小时不补零） */
export function fmt(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** 840 → "14:00"（小时补零，用于 <input type=time>） */
export function fmtHM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(
    min % 60,
  ).padStart(2, "0")}`;
}

/** "2026-07-12 14:00" → 840（缺失时回退 9:00） */
export function parseTimeToMin(text: string) {
  const time = text.slice(11);
  if (!time) return 540;
  const [h, m] = time.split(":").map(Number);
  return (h || 9) * 60 + (m || 0);
}

export const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);
