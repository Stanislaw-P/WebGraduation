// Сохранение прогресса в localStorage (аналог PlayerPrefs из Unity-версии).

import {
  FIVES_KEY, GRADE_EXCELLENT, GRADE_GOOD, LAST_RUN_TIME_KEY, RUN_TIME_KEY,
} from './constants';

// ---------- Сквозной счёт пятёрок (копится за весь забег, не сбрасывается
// между уровнями; «Играть» начинает новый забег с нуля) ----------

/** Накопленные пятёрки за текущий забег. */
export function getFives(): number {
  try {
    const v = parseInt(localStorage.getItem(FIVES_KEY) ?? '0', 10);
    return isNaN(v) || v < 0 ? 0 : v;
  } catch {
    return 0;
  }
}

export function setFives(n: number): void {
  try {
    localStorage.setItem(FIVES_KEY, String(Math.max(0, Math.floor(n))));
  } catch {
    /* нет localStorage — счёт живёт только внутри уровня */
  }
}

/** Новый забег («Играть») — счёт с нуля. */
export function resetFives(): void {
  setFives(0);
}

/** Оценка диплома по собранным пятёркам. */
export function gradeFor(fives: number): string {
  if (fives >= GRADE_EXCELLENT) return 'отлично';
  if (fives >= GRADE_GOOD) return 'хорошо';
  return 'удовлетворительно';
}

// ---------- Таймер прохождения (копится за весь забег, стоит на паузе
// и вне уровня; «Играть» начинает отсчёт заново) ----------

/** Накопленное игровое время текущего забега, сек. */
export function getRunTime(): number {
  try {
    const v = parseFloat(localStorage.getItem(RUN_TIME_KEY) ?? '0');
    return isNaN(v) || v < 0 ? 0 : v;
  } catch {
    return 0;
  }
}

export function setRunTime(sec: number): void {
  try {
    localStorage.setItem(RUN_TIME_KEY, String(Math.max(0, sec)));
  } catch {
    /* нет localStorage — таймер живёт только внутри уровня */
  }
}

/** Новый забег («Играть») — время с нуля. */
export function resetRunTime(): void {
  setRunTime(0);
}

// ---------- Время последнего ПОЛНОГО прохождения (до диплома) ----------

/** Время последнего полученного диплома, сек (0 — игру ещё не проходили). */
export function getLastRunTime(): number {
  try {
    const v = parseFloat(localStorage.getItem(LAST_RUN_TIME_KEY) ?? '0');
    return isNaN(v) || v < 0 ? 0 : v;
  } catch {
    return 0;
  }
}

/** Записывается в момент подбора диплома. */
export function setLastRunTime(sec: number): void {
  try {
    localStorage.setItem(LAST_RUN_TIME_KEY, String(Math.max(0, sec)));
  } catch {
    /* нет localStorage — рекорд не сохранится */
  }
}

/** «мм:сс» (при часе и дольше — «ч:мм:сс»). */
export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mm = Math.floor(s / 60) % 60;
  const ss = s % 60;
  const hh = Math.floor(s / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}
