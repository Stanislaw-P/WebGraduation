/// <reference types="vite/client" />
// Загрузка PNG-моделек профессоров из web/public/professors/.
// Файлы: prof1.png … prof4.png (по номеру уровня). Пока файла нет
// (или он не загрузился) — game.ts рисует процедурную заглушку.
// Добавление модельки не требует изменений кода: достаточно положить PNG.

const cache = new Map<number, HTMLImageElement | 'failed'>();

/** Начать фоновую загрузку модельки профессора уровня level (1..4). */
export function preloadProfessor(level: number): void {
  if (cache.has(level)) return;
  const img = new Image();
  img.onload = () => cache.set(level, img);
  img.onerror = () => cache.set(level, 'failed');
  img.src = `${import.meta.env.BASE_URL}professors/prof${level}.png`;
}

/** Загруженная моделька профессора или null (рисуем заглушку). */
export function getProfessor(level: number): HTMLImageElement | null {
  const v = cache.get(level);
  return v && v !== 'failed' && v.complete ? v : null;
}
