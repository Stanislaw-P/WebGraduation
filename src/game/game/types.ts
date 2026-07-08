// Общие типы игрового мира.
// Все координаты — в «юнитах» (1 юнит = 120 px), как в Unity-версии.
// Ось Y направлена ВВЕРХ; переворотом при отрисовке занимается рендер.

export interface Vec2 { x: number; y: number }

/** Прямоугольник; (x, y) — его ЦЕНТР. */
export interface Rect { x: number; y: number; w: number; h: number }

export type ObstacleKind = 'desk' | 'bench' | 'books';

/** Препятствие: твёрдое, при боковом касании наносит урон. */
export interface Obstacle extends Rect { kind: ObstacleKind }

export type EnemyKind = 'dvoyka' | 'formula' | 'nk';

/** Описание врага в данных уровня. */
export interface EnemySpawn {
  kind: EnemyKind;
  x: number; y: number;   // стартовая позиция (центр)
  ax: number; ay: number; // смещение точки маршрута A относительно старта
  bx: number; by: number; // смещение точки маршрута B
  speed: number;
}

/** Профессор-экзаменатор: размер модельки и запас здоровья. */
export interface ProfessorConfig {
  w: number;            // размер профессора (виден за кафедрой)
  h: number;
  hp: number;           // сколько верных ответов нужно для победы
}

/** Настройки арены-экзамена. */
export interface ArenaConfig {
  xLeft: number;                        // левый край арены
  level: number;                        // 1..4 — банк вопросов и спрайт профессора
  prof: ProfessorConfig;
  lectern: Vec2;                        // x — центр кафедры, y — верх балкона (декор, НЕ solid)
  answerPlatforms: [Rect, Rect, Rect];  // платформы-ответы (0 = А, 1 = Б, 2 = В), те же, что в solids
}

/** Полное описание уровня — по нему Game строит мир. */
export interface LevelData {
  course: string;       // название курса (для экрана победы)
  theme: number;        // номер визуальной темы (см. themes.ts)
  platforms: Rect[];    // земля, платформы, стены арены — всё твёрдое и безопасное
  obstacles: Obstacle[];
  enemies: EnemySpawn[];
  fives: Vec2[];        // «пятёрки»
  checkpoints: number[];// X-координаты флажков (стоят на земле)
  arena?: ArenaConfig;  // нет арены — нет босса (финальный коридор)
  diploma?: Vec2;       // лежащий в конце диплом (только уровень 5)
  camMaxX: number;      // правая граница камеры
  length: number;       // длина уровня
}

/** Пересечение двух прямоугольников (по центрам и размерам). */
export function overlaps(a: Rect, b: Rect): boolean {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
