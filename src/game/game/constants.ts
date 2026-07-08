// Все игровые константы в одном месте — удобно балансировать.

// ---------- Экран ----------
export const UNIT = 120;       // пикселей в одном юните (1080 / 9)
export const CANVAS_W = 1080;  // внутреннее разрешение канваса (портрет)
export const CANVAS_H = 1920;
export const VIEW_W = CANVAS_W / UNIT; // 9 юнитов в ширину
export const VIEW_H = CANVAS_H / UNIT; // 16 юнитов в высоту

// Визуальное увеличение спрайта игрока (хитбокс физики не меняется —
// иначе сбились бы дистанции прыжков между платформами на уровнях).
export const PLAYER_VISUAL_SCALE = 2;

// ---------- Физика игрока (значения из Unity-версии) ----------
export const GRAVITY = 30;         // юнитов/сек²
export const MOVE_SPEED = 6;       // скорость бега
export const JUMP_SPEED = 13;      // высота прыжка ≈ 2.8 юнита
export const MAX_FALL = 20;        // предел скорости падения
export const STOMP_BOUNCE = 8;     // отскок после прыжка на врага
export const KNOCKBACK_X = 6;      // отброс при уроне
export const KNOCKBACK_Y = 6;
export const KNOCKBACK_TIME = 0.35;// сек без управления после урона
export const INVINCIBLE_TIME = 2;  // сек неуязвимости (мигание)
export const DEATH_Y = -3;         // ниже этой высоты — падение в пропасть

// ---------- Правила игры ----------
export const MAX_LIVES = 3;
export const FIVES_PER_LIFE = 10;  // каждые 10 пятёрок → +1 жизнь
export const BOSS_HP = 3;          // верных ответов для победы над профессором

// ---------- Экзамен-квиз ----------
export const QUIZ_CONFIRM_TIME = 0.8; // сек стояния на платформе для фиксации ответа
export const QUIZ_INTRO_TIME = 4;     // сек интро (успеть прочитать, кто принимает экзамен)
export const QUIZ_RESOLVE_DELAY = 1.4;// сек показа «Верно!/Неверно!» перед следующим вопросом
export const MAX_ARENA_DVOYKAS = 3;   // максимум живых двоек-штрафов на арене

export const FIVES_DEATH_PENALTY = 3; // штраф пятёрками за потерю жизни

// Пороги оценки диплома (всего на уровнях ~68 пятёрок)
export const GRADE_EXCELLENT = 45;
export const GRADE_GOOD = 25;

export const COURSES = [
  'Линейная алгебра',
  'Математический анализ',
  'Математическое моделирование',
  'Основы программирования',
  'Вручение диплома',
];

// ФИО преподавателей-боссов по уровням (показываются на старте экзамена).
export const PROF_NAMES: Record<number, string> = {
  1: 'Койбаев В. А.',
  2: 'Кулаев Р. Ч.',
  3: 'Тотиева Ж. Д.',
  4: 'Макаренко М. Д.',
};

export const TOTAL_LEVELS = 5; // 4 курса + финальный коридор с дипломом
export const FIVES_KEY = 'exams.fives'; // ключи localStorage
export const RUN_TIME_KEY = 'exams.runTime';           // время текущего забега, сек
export const LAST_RUN_TIME_KEY = 'exams.lastRunTime';  // время последнего полного прохождения

// ---------- Цвета (примитивы вместо спрайтов) ----------
export const COLORS = {
  player: '#2979FF',
  ground: '#795548',
  platform: '#8D8D8D',
  desk: '#8B5A2B',
  bench: '#43A047',
  dvoyka: '#E53935',
  formula: '#9E9E9E',
  nk: '#FB8C00',
  five: '#FFD600',
  answer: '#4CAF50',      // верный ответ (зелёная вспышка)
  answerWrong: '#E53935', // неверный ответ (красная вспышка) — лечит профессора
  boss: '#C62828',
  lectern: '#6D4C41',     // кафедра профессора
  optionCard: '#3F51B5',  // карточки вариантов А/Б/В
  checkpoint: '#FFEB3B',
  checkpointDone: '#8BC34A',
  gate: '#4E342E',        // ворота-запор арены босса
} as const;

export const BOOK_COLORS = ['#E57373', '#64B5F6', '#81C784']; // стопка книг
