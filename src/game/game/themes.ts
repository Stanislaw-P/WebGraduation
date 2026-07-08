// Визуальные темы уровней: каждая тема стилизует кабинет под свой предмет.
// Используется рендером фона (decor.ts) и отрисовкой геометрии (game.ts).

/** Узор на стене кабинета. */
export type WallPattern = 'none' | 'grid' | 'waves' | 'dots';

/** Дальний слой параллакса: окна аудитории или колонны актового зала. */
export type FarLayer = 'windows' | 'columns';

export interface LevelTheme {
  wallTop: string;      // градиент стены: верх
  wallBottom: string;   // градиент стены: низ
  wallPattern: WallPattern;
  patternColor: string; // цвет узора (полупрозрачность задаёт рендер)

  floor: string;        // тело земли
  floorTop: string;     // верхняя полоса покрытия пола
  floorSeam: string;    // швы между «плитами» пола

  platform: string;     // висячие платформы-полки
  platformTop: string;

  board: string;        // школьная доска (средний слой)
  boardFrame: string;
  chalk: string;        // цвет мела

  doodles: string[];    // формулы предмета — пишутся мелом на досках
  floaters: string[];   // парящие полупрозрачные символы предмета

  far: FarLayer;
  windowGlow: string;   // свет в окнах / между колоннами
  festive: boolean;     // гирлянды и конфетти (финальный уровень)
}

const THEMES: LevelTheme[] = [
  // 1. Линейная алгебра — светлая утренняя аудитория
  {
    wallTop: '#C9EDFB', wallBottom: '#8FD3EF',
    wallPattern: 'none', patternColor: '#FFFFFF',
    floor: '#8D6E63', floorTop: '#BCAAA4', floorSeam: '#6D4C41',
    platform: '#A1887F', platformTop: '#D7CCC8',
    board: '#33691E', boardFrame: '#8D6E63', chalk: '#F1F8E9',
    doodles: ['A·x = b', 'det A = 0', '[a b; c d]', 'rang A'],
    floaters: ['λ', 'ℝ²', '⊥', 'Σ', '×'],
    far: 'windows', windowGlow: '#FFF9C4', festive: false,
  },
  // 2. Математический анализ — сиреневый кабинет с миллиметровкой
  {
    wallTop: '#E4D7F5', wallBottom: '#B39DDB',
    wallPattern: 'grid', patternColor: '#7E57C2',
    floor: '#7E6A5A', floorTop: '#B0A08E', floorSeam: '#5D4E40',
    platform: '#9575CD', platformTop: '#C5B3E6',
    board: '#4527A0', boardFrame: '#7E57C2', chalk: '#EDE7F6',
    doodles: ['lim x→0', 'y = x²', "f'(x) = ?", '∫ f(x)dx'],
    floaters: ['∞', '∑', '√', 'π', 'Δ'],
    far: 'windows', windowGlow: '#FFF3E0', festive: false,
  },
  // 3. Математическое моделирование — бирюзовая лаборатория с волнами
  {
    wallTop: '#A7E5DD', wallBottom: '#26A69A',
    wallPattern: 'waves', patternColor: '#00695C',
    floor: '#5D4037', floorTop: '#8D6E63', floorSeam: '#4E342E',
    platform: '#26867B', platformTop: '#63BDB2',
    board: '#004D40', boardFrame: '#6D4C41', chalk: '#E0F2F1',
    doodles: ['dx/dt = f(x)', 'y = a·x + b', 'model ≈ data', 'argmin E'],
    floaters: ['∑', '≈', '∂', '→', 'λ'],
    far: 'windows', windowGlow: '#FFECB3', festive: false,
  },
  // 4. Основы программирования — вечерний зал в стиле «код на экране»
  {
    wallTop: '#5C6BC0', wallBottom: '#303F9F',
    wallPattern: 'dots', patternColor: '#C5CAE9',
    floor: '#455A64', floorTop: '#78909C', floorSeam: '#37474F',
    platform: '#5C6BC0', platformTop: '#9FA8DA',
    board: '#1A237E', boardFrame: '#5C6BC0', chalk: '#E8EAF6',
    doodles: ['for i in n:', 'if x > 0:', 'x = x + 1', 'print("OK")'],
    floaters: ['{ }', '< >', ';', '#', '( )'],
    far: 'windows', windowGlow: '#B39DDB', festive: false,
  },
  // 5. Вручение диплома — тёплый актовый зал с колоннами и гирляндами
  {
    wallTop: '#FFE9C7', wallBottom: '#FFB74D',
    wallPattern: 'none', patternColor: '#FFFFFF',
    floor: '#8D5524', floorTop: '#C68642', floorSeam: '#6B3E1B',
    platform: '#C68642', platformTop: '#E0AC69',
    board: '#BF360C', boardFrame: '#8D5524', chalk: '#FFF3E0',
    doodles: ['ПОЗДРАВЛЯЕМ!', 'ВЫПУСК'],
    floaters: ['🎓', '★', '✦'],
    far: 'columns', windowGlow: '#FFF8E1', festive: true,
  },
];

/** Тема уровня n (1..5); выход за границы прижимается к краям. */
export function getTheme(n: number): LevelTheme {
  return THEMES[Math.min(Math.max(n, 1), THEMES.length) - 1];
}
