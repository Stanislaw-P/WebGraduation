// Данные всех 4 уровней. Планировки перенесены из Unity-версии (LevelBuilder.cs).
// Уровень описывается декларативно; Game строит по нему мир.

import { BOSS_HP } from './constants';
import type {
  ArenaConfig, EnemySpawn, LevelData, Obstacle, ProfessorConfig, Rect, Vec2,
} from './types';

// ---------- Помощники (аналог методов LevelBuilder) ----------

/** Блок земли от x0 до x1, верх на Y = 0.5. */
const span = (x0: number, x1: number): Rect =>
  ({ x: (x0 + x1) / 2, y: 0, w: x1 - x0, h: 1 });

/** Висячая платформа шириной w с центром (x, y). */
const plat = (x: number, y: number, w: number): Rect => ({ x, y, w, h: 0.4 });

// Препятствия стоят на земле (верх земли — Y = 0.5)
const desk  = (x: number): Obstacle => ({ kind: 'desk',  x, y: 0.875, w: 1.6, h: 0.75 });
const bench = (x: number): Obstacle => ({ kind: 'bench', x, y: 0.65,  w: 2.0, h: 0.3 });
const books = (x: number): Obstacle => ({ kind: 'books', x, y: 0.95,  w: 0.6, h: 0.9 });

/** «Двойка» — ходит по земле влево-вправо на ±range (y = верх земли + полувысота). */
const dvoyka = (x: number, range: number, speed = 2): EnemySpawn =>
  ({ kind: 'dvoyka', x, y: 0.9, ax: -range, ay: 0, bx: range, by: 0, speed });

/** «Формула» — летает между двумя точками (смещения от старта). */
const formula = (x: number, y: number, a: Vec2, b: Vec2, speed = 2.5): EnemySpawn =>
  ({ kind: 'formula', x, y, ax: a.x, ay: a.y, bx: b.x, by: b.y, speed });

/** «НК» — быстрый наземный враг (y = верх земли + полувысота). */
const nk = (x: number, range: number, speed = 3): EnemySpawn =>
  ({ kind: 'nk', x, y: 0.95, ax: -range, ay: 0, bx: range, by: 0, speed });

const fiveRow = (x: number, y: number, count: number, step = 0.8): Vec2[] =>
  Array.from({ length: count }, (_, i) => ({ x: x + i * step, y }));

// Модельки 4 профессоров. Крупные, чтобы над трибуной читались причёска
// и одежда каждого преподавателя.
const PROF_SIZES: Record<number, ProfessorConfig> = {
  1: { w: 2.0, h: 2.6, hp: BOSS_HP }, // Койбаев В. А.
  2: { w: 2.1, h: 2.7, hp: BOSS_HP }, // Кулаев Р. Ч.
  3: { w: 2.0, h: 3.0, hp: BOSS_HP }, // Тотиева Ж. Д.
  4: { w: 2.3, h: 2.8, hp: BOSS_HP }, // Макаренко М. Д.
};

// Ширина арены-экзамена (юниты).
const ARENA_W = 16;

/**
 * Арена-экзамен от xLeft: сплошной пол, высокая стена справа,
 * 3 платформы-ответа (А/Б/В) и кафедра профессора высоко по центру.
 * Кафедра на y = 11 — у самого верха кадра (панель вопроса ложится под ней)
 * и сильно выше максимума прыжка даже со средней платформы (3.5 + 2.82 ≈ 6.32);
 * к тому же это чистый декор: в solids не попадает, так что профессора
 * не достать. Возвращает геометрию, конфиг и правый край.
 */
function arena(
  xLeft: number, level: number,
): { solids: Rect[]; cfg: ArenaConfig; right: number } {
  const right = xLeft + ARENA_W;
  // Платформы-ответа: 0 = А (левая), 1 = Б (средняя, выше), 2 = В (правая)
  const answerPlatforms: [Rect, Rect, Rect] = [
    plat(xLeft + 3, 2.6, 2),
    plat(xLeft + 8, 3.3, 2),
    plat(xLeft + 13, 2.6, 2),
  ];
  return {
    solids: [
      span(xLeft, right),                          // сплошной пол арены
      { x: right - 0.25, y: 3, w: 0.5, h: 6 },     // высокая правая стена
      ...answerPlatforms,
    ],
    cfg: {
      xLeft, level,
      prof: PROF_SIZES[level],
      lectern: { x: xLeft + 8, y: 8.5 },
      answerPlatforms,
    },
    right,
  };
}

// ---------- Уровень 1: Линейная алгебра (Койбаев В. А.) ----------

function level1(): LevelData {
  const a = arena(53, 1);
  return {
    course: 'Линейная алгебра',
    theme: 1,
    platforms: [
      span(-2, 10), span(12, 18), span(20, 30), span(32, 40), span(42, 53),
      plat(11, 1.5, 2), plat(19, 1.8, 2), plat(31, 2, 2),
      ...a.solids,
    ],
    obstacles: [bench(7), desk(26), books(45)],
    enemies: [dvoyka(15, 1.5), dvoyka(25, 2.5), dvoyka(47, 2.5)],
    fives: [
      ...fiveRow(5, 1.6, 4),
      ...fiveRow(10.2, 2.6, 3),
      ...fiveRow(18.2, 2.9, 3),
      ...fiveRow(30.2, 3.1, 3),
      ...fiveRow(48.5, 1.6, 3),
    ],
    checkpoints: [24, 51.5],
    arena: a.cfg,
    camMaxX: a.right - 4.5,
    length: a.right,
  };
}

// ---------- Уровень 2: Математический анализ (Кулаев Р. Ч.) ----------

function level2(): LevelData {
  const a = arena(55, 2);
  return {
    course: 'Математический анализ',
    theme: 2,
    platforms: [
      span(-2, 8), span(10, 16), span(18.5, 26), span(28, 34),
      span(36.5, 44), span(46, 55),
      plat(9, 1.6, 1.6), plat(17.2, 1.8, 1.8), plat(27, 2, 1.6),
      plat(35.2, 1.8, 1.8), plat(45, 2, 1.6),
      // «лесенка-матрица»
      plat(30, 2.2, 1.5), plat(32.5, 3.4, 1.5),
      ...a.solids,
    ],
    obstacles: [desk(5), bench(21), desk(40), books(50)],
    enemies: [
      dvoyka(13, 2), dvoyka(22, 2.5), dvoyka(41, 2.5),
      formula(21, 3, { x: -2.5, y: 0 }, { x: 2.5, y: 0 }),   // прямо над скамейкой
      formula(48, 2.8, { x: -2.5, y: 0 }, { x: 2.5, y: 0 }),
      nk(52, 2),
    ],
    fives: [
      ...fiveRow(4, 1.6, 3),
      { x: 9, y: 2.6 }, { x: 17.2, y: 2.8 }, { x: 27, y: 3 }, { x: 45, y: 3 },
      ...fiveRow(31.7, 4.4, 3),   // награда на вершине лесенки
      ...fiveRow(38, 1.6, 4),
      ...fiveRow(52.5, 1.6, 3),
    ],
    checkpoints: [24, 43, 53.5],
    arena: a.cfg,
    camMaxX: a.right - 4.5,
    length: a.right,
  };
}

// ---------- Уровень 3: Математическое моделирование (Тотиева Ж. Д.) ----------

function level3(): LevelData {
  const a = arena(60, 3);
  return {
    course: 'Математическое моделирование',
    theme: 3,
    platforms: [
      span(-2, 8), span(10, 15), span(17, 24), span(26, 31),
      span(33, 42), span(44, 50), span(52, 60),
      plat(9, 1.6, 1.6), plat(16, 1.8, 1.6), plat(25, 2, 1.6),
      plat(32, 1.8, 1.6), plat(43, 1.6, 1.6), plat(51, 1.8, 1.6),
      // вертикальная секция «лестница вверх»
      plat(35, 2.2, 1.5), plat(38, 3.6, 1.5), plat(41, 5, 1.5),
      ...a.solids,
    ],
    obstacles: [bench(6), books(20), desk(46), books(56)],
    enemies: [
      dvoyka(12, 1.8), dvoyka(28, 1.8),
      formula(21, 2.6, { x: -2.5, y: 0 }, { x: 2.5, y: 0 }),
      formula(36.5, 3, { x: 0, y: -1.2 }, { x: 0, y: 1.2 }), // вертикальная «синусоида»
      formula(56, 2.8, { x: -2, y: 0 }, { x: 2, y: 0 }),
      nk(47, 2, 3.5), nk(54, 1.5, 3.5),
    ],
    fives: [
      ...fiveRow(4, 1.6, 3),
      { x: 9, y: 2.6 }, { x: 16, y: 2.8 }, { x: 25, y: 3 }, { x: 32, y: 2.8 },
      ...fiveRow(40.3, 6, 3),   // награда на вершине лестницы
      ...fiveRow(48, 1.6, 3),
      ...fiveRow(58, 1.6, 3),
    ],
    checkpoints: [22, 48, 58.5],
    arena: a.cfg,
    camMaxX: a.right - 4.5,
    length: a.right,
  };
}

// ---------- Уровень 4: Основы программирования (Макаренко М. Д.) ----------

function level4(): LevelData {
  const a = arena(66, 4);
  return {
    course: 'Основы программирования',
    theme: 4,
    platforms: [
      span(-2, 6), span(8, 13), span(15, 19.5), span(21.5, 26),
      span(28, 33), span(35, 40), span(42, 47.5),
      span(50.5, 57.5), span(60.5, 66),
      plat(7, 1.6, 1.4), plat(14, 1.8, 1.4), plat(20.5, 1.8, 1.4),
      plat(27, 2, 1.4), plat(34, 1.8, 1.4), plat(41, 1.8, 1.4),
      // широкие пропасти с узкими платформами — «рулетка»
      plat(49, 1.8, 1.2), plat(59, 2, 1.2),
      // скрытый путь наверх к бонусным пятёркам
      plat(45, 2.2, 1.2), plat(43, 3.8, 1.2),
      ...a.solids,
    ],
    obstacles: [bench(11), desk(36.5), books(52), books(63)],
    enemies: [
      dvoyka(10, 1.5, 2.5), dvoyka(30, 2, 2.5), dvoyka(54, 2, 2.5),
      formula(17, 2.8, { x: -2, y: 0 }, { x: 2, y: 0 }),
      formula(36.5, 2.6, { x: -2, y: 0 }, { x: 2, y: 0 }), // над партой!
      formula(62.8, 2.6, { x: -1.5, y: 0 }, { x: 1.5, y: 0 }),
      nk(23, 1.8, 3.5), nk(44, 2, 3.5), nk(61.5, 1, 3.5),
    ],
    fives: [
      ...fiveRow(3, 1.6, 3),
      { x: 7, y: 2.6 }, { x: 14, y: 2.8 }, { x: 27, y: 3 }, { x: 41, y: 2.8 },
      { x: 49, y: 2.8 }, { x: 59, y: 3 },
      ...fiveRow(42.4, 5, 4),   // скрытая цепочка высоко
      ...fiveRow(31, 1.6, 3),
      ...fiveRow(55, 1.6, 3),
    ],
    checkpoints: [17, 43, 55, 64.5],
    arena: a.cfg,
    camMaxX: a.right - 4.5,
    length: a.right,
  };
}

// ---------- Уровень 5: Вручение диплома ----------
// Церемониальный коридор: без врагов, босса и ям. Парты и скамейки — декор
// (препятствия больше не ранят). В конце лежит диплом.

function level5(): LevelData {
  return {
    course: 'Вручение диплома',
    theme: 5,
    platforms: [span(-2, 42)],
    obstacles: [
      bench(6), desk(12), bench(18), books(24), desk(30), bench(35),
    ],
    enemies: [],
    fives: [],
    checkpoints: [],
    diploma: { x: 39, y: 1.75 }, // стоит на праздничном пьедестале
    camMaxX: 37.5,
    length: 42,
  };
}

/** Уровни 1–5 (индекс 0 → Level 1). Функция — чтобы каждый запуск получал свежие данные. */
export function getLevel(n: number): LevelData {
  const builders = [level1, level2, level3, level4, level5];
  return builders[Math.min(Math.max(n, 1), builders.length) - 1]();
}
