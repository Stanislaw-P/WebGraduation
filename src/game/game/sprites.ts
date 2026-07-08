// Процедурные «спрайты»: игрок, враги, препятствия, собираемое, декор.
// Все функции работают в ЭКРАННЫХ пикселях (ось Y вниз); центр объекта —
// (px, py), размеры в пикселях. Перевод из мировых координат делает game.ts.

import { BOOK_COLORS, COLORS, UNIT } from './constants';
import { roundRectPath } from './decor';
import type { ProfState } from './professor';
import type { LevelTheme } from './themes';

const OUTLINE = '#2B3442';           // фирменный тёмный контур flat-стиля
const LW = Math.max(3, UNIT * 0.03); // толщина контура

const FONT = `'Comic Sans MS', 'Segoe Print', cursive, sans-serif`;

// ---------- Хелперы ----------

function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill: string, stroke = true,
): void {
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = LW;
    ctx.stroke();
  }
}

/** Мультяшный глаз: белок + зрачок, смещённый в сторону взгляда. */
function eye(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, lookX: number, lookY = 0,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(2, LW * 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + lookX * r * 0.4, cy + lookY * r * 0.4, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
}

/** Глаза «Х Х» у побеждённого врага. */
function deadEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(2.5, LW * 0.7);
  ctx.beginPath();
  for (const dx of [-s * 1.6, s * 1.6]) {
    ctx.moveTo(cx + dx - s, cy - s);
    ctx.lineTo(cx + dx + s, cy + s);
    ctx.moveTo(cx + dx + s, cy - s);
    ctx.lineTo(cx + dx - s, cy + s);
  }
  ctx.stroke();
}

/** Сплющенный «трупик» врага (общая форма для всех). */
function squashed(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number, color: string,
): void {
  ctx.beginPath();
  ctx.ellipse(px, py, w / 2, Math.max(h / 2, 4), 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW;
  ctx.stroke();
  deadEyes(ctx, px, py - 2, 4);
}

// ---------- Игрок: студент с рюкзаком ----------

export interface PlayerPose {
  facing: number;    // 1 вправо, -1 влево
  running: boolean;  // на земле и движется
  grounded: boolean;
  rising: boolean;   // в прыжке вверх
  time: number;
  alpha: number;     // мигание неуязвимости
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D, px: number, py: number, o: PlayerPose,
): void {
  // Хитбокс 60×80 px: низ py+40, верх py-40.
  const f = o.facing;
  ctx.save();
  ctx.globalAlpha = o.alpha;
  ctx.lineJoin = 'round';

  // --- Ноги (беговой маятник / поза прыжка) ---
  const swing = o.running ? Math.sin(o.time * 14) * 9 : 0;
  const hipY = py + 22;
  ctx.strokeStyle = '#37474F'; // тёмные джинсы
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (!o.grounded) {
    if (o.rising) { // прыжок — ноги поджаты
      ctx.moveTo(px - 7, hipY);
      ctx.lineTo(px - 10 - f * 4, hipY + 9);
      ctx.moveTo(px + 7, hipY);
      ctx.lineTo(px + 10 - f * 4, hipY + 11);
    } else {        // падение — ноги вытянуты
      ctx.moveTo(px - 7, hipY);
      ctx.lineTo(px - 7, py + 37);
      ctx.moveTo(px + 7, hipY);
      ctx.lineTo(px + 7, py + 37);
    }
  } else {
    ctx.moveTo(px - 6, hipY);
    ctx.lineTo(px - 6 + swing, py + 37);
    ctx.moveTo(px + 6, hipY);
    ctx.lineTo(px + 6 - swing, py + 37);
  }
  ctx.stroke();

  // --- Мантия выпускника (расклешённая книзу, поверх ног до колен) ---
  const gown = '#283593';
  ctx.fillStyle = gown;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW;
  ctx.beginPath();
  ctx.moveTo(px - 15, py - 12);            // левое плечо
  ctx.quadraticCurveTo(px - 24, py + 12, px - 21, py + 27); // клёш влево
  ctx.lineTo(px + 21, py + 27);            // подол
  ctx.quadraticCurveTo(px + 24, py + 12, px + 15, py - 12); // клёш вправо
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Передний шов и складки мантии
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py - 8);
  ctx.lineTo(px, py + 25);
  ctx.moveTo(px - 11, py + 2);
  ctx.lineTo(px - 13, py + 25);
  ctx.moveTo(px + 11, py + 2);
  ctx.lineTo(px + 13, py + 25);
  ctx.stroke();
  // Белый воротник V + алая лента-галстук
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(px - 9, py - 12);
  ctx.lineTo(px, py - 1);
  ctx.lineTo(px + 9, py - 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.moveTo(px - 3, py - 4);
  ctx.lineTo(px, py + 7);
  ctx.lineTo(px + 3, py - 4);
  ctx.closePath();
  ctx.fill();

  // --- Голова ---
  const hx = px + f * 2;
  const hy = py - 22;
  ctx.beginPath();
  ctx.arc(hx, hy, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#FFCC9C';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW;
  ctx.stroke();

  // --- Конфедератка выпускника (шапочка-ромб с кисточкой) ---
  const capY = hy - 12;
  // Основа-таблетка под ромбом
  rr(ctx, hx - 11, capY - 1, 22, 7, 3, '#1A237E');
  // Квадратная доска (ромб в проекции)
  ctx.fillStyle = '#283593';
  ctx.beginPath();
  ctx.moveTo(hx - 17, capY - 2);
  ctx.lineTo(hx, capY - 10);
  ctx.lineTo(hx + 17, capY - 2);
  ctx.lineTo(hx, capY + 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Кисточка — свисает на сторону взгляда, качается при беге
  const tas = o.running ? Math.sin(o.time * 14) * 2 : 0;
  ctx.strokeStyle = '#FFD600';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(hx, capY - 9);
  ctx.quadraticCurveTo(hx + f * 12, capY - 6, hx + f * 14 + tas, capY + 4);
  ctx.stroke();
  ctx.fillStyle = '#FFD600';
  ctx.beginPath();
  ctx.arc(hx + f * 14 + tas, capY + 6, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // --- Лицо ---
  eye(ctx, hx + f * 4, hy + 1, 4.2, f);
  eye(ctx, hx + f * 10, hy + 1, 4.2, f);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); // улыбка
  ctx.arc(hx + f * 6, hy + 6, 4.5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();
}

// ---------- Враги ----------

export interface EnemyPose { facing: number; time: number }

/** «Двойка»: жирная красная цифра-лебедь со злыми глазами и лапками. */
export function drawDvoyka(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number,
  dead: boolean, o: EnemyPose,
): void {
  if (dead) {
    squashed(ctx, px, py, w * 1.15, h, '#E53935');
    return;
  }
  ctx.save();
  // Лёгкий squash-stretch при ходьбе
  const s = 1 + Math.sin(o.time * 10) * 0.05;
  ctx.translate(px, py + h / 2);
  ctx.scale(2 - s, s);
  ctx.translate(-px, -(py + h / 2));

  // Лапки семенят
  const step = Math.sin(o.time * 12) * 4;
  ctx.strokeStyle = '#B71C1C';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px - w * 0.18, py + h * 0.28);
  ctx.lineTo(px - w * 0.18 + step, py + h * 0.5);
  ctx.moveTo(px + w * 0.18, py + h * 0.28);
  ctx.lineTo(px + w * 0.18 - step, py + h * 0.5);
  ctx.stroke();

  // Тело — жирная цифра «2» с обводкой
  ctx.font = `900 ${Math.round(h * 1.25)}px 'Arial Black', ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#7F0000';
  ctx.lineWidth = LW * 2;
  ctx.strokeText('2', px, py + h * 0.02);
  ctx.fillStyle = '#E53935';
  ctx.fillText('2', px, py + h * 0.02);

  // Злые глаза на «голове» двойки
  const ex = px - w * 0.02 + o.facing * w * 0.06;
  const ey = py - h * 0.28;
  eye(ctx, ex - 7, ey, 5, o.facing);
  eye(ctx, ex + 7, ey, 5, o.facing);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath(); // нахмуренные брови
  ctx.moveTo(ex - 12, ey - 9);
  ctx.lineTo(ex - 3, ey - 5);
  ctx.moveTo(ex + 12, ey - 9);
  ctx.lineTo(ex + 3, ey - 5);
  ctx.stroke();

  ctx.restore();
}

/** «НК»: колючий оранжевый шарик-спидстер с «НК» на пузе. */
export function drawNk(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number,
  dead: boolean, o: EnemyPose,
): void {
  if (dead) {
    squashed(ctx, px, py, w * 1.15, h, '#FB8C00');
    return;
  }
  const r = (w / 2) * 0.8;
  ctx.save();

  // Линии скорости позади
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const dy of [-r * 0.4, 0, r * 0.4]) {
    const bx = px - o.facing * (r + 10);
    ctx.moveTo(bx, py + dy);
    ctx.lineTo(bx - o.facing * (16 + Math.abs(dy)), py + dy);
  }
  ctx.stroke();

  // Колючее тело — вращается, как катящийся шар
  const spikes = 9;
  const rot = o.time * 4 * o.facing;
  ctx.beginPath();
  for (let i = 0; i <= spikes * 2; i++) {
    const ang = rot + (i / (spikes * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? r * 1.28 : r;
    const x = px + Math.cos(ang) * rad;
    const y = py + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#FB8C00';
  ctx.fill();
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = LW;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Пузо с надписью
  ctx.beginPath();
  ctx.arc(px, py + r * 0.25, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#FFE0B2';
  ctx.fill();
  ctx.fillStyle = '#E65100';
  ctx.font = `900 ${Math.round(r * 0.55)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('НК', px, py + r * 0.27);

  // Злые глаза с бровями
  eye(ctx, px - r * 0.3, py - r * 0.35, r * 0.22, o.facing);
  eye(ctx, px + r * 0.3, py - r * 0.35, r * 0.22, o.facing);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(px - r * 0.55, py - r * 0.72);
  ctx.lineTo(px - r * 0.12, py - r * 0.5);
  ctx.moveTo(px + r * 0.55, py - r * 0.72);
  ctx.lineTo(px + r * 0.12, py - r * 0.5);
  ctx.stroke();

  ctx.restore();
}

/** «Формула»: летающий обрывок тетрадного листа с ∑x² и крылышками. */
export function drawFormula(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number,
  dead: boolean, o: EnemyPose,
): void {
  if (dead) {
    squashed(ctx, px, py, w * 0.8, h, '#ECEFF1');
    return;
  }
  ctx.save();
  const x0 = px - w / 2;
  const y0 = py - h / 2;

  // Крылышки-уголки (машут)
  const flap = Math.sin(o.time * 11) * 0.5;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW * 0.7;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(px + side * w * 0.48, py - h * 0.2);
    ctx.rotate(side * (-0.5 + flap));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 22, -16);
    ctx.lineTo(side * 6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Лист: прямой верх, волнистый «оторванный» низ
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + w, y0);
  ctx.lineTo(x0 + w, y0 + h * 0.75);
  const bumps = 4;
  for (let i = 0; i < bumps; i++) {
    const bx = x0 + w - (w / bumps) * (i + 0.5);
    const ex = x0 + w - (w / bumps) * (i + 1);
    ctx.quadraticCurveTo(bx, y0 + h * (i % 2 === 0 ? 1.05 : 0.75), ex, y0 + h * 0.88);
  }
  ctx.lineTo(x0, y0 + h * 0.75);
  ctx.closePath();
  ctx.fillStyle = '#FDFDF4';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW * 0.8;
  ctx.stroke();

  // Клетка тетради + красное поле
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(100,181,246,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let gx = x0 + 10; gx < x0 + w; gx += 14) {
    ctx.moveTo(gx, y0);
    ctx.lineTo(gx, y0 + h * 1.1);
  }
  for (let gy = y0 + 10; gy < y0 + h * 1.1; gy += 14) {
    ctx.moveTo(x0, gy);
    ctx.lineTo(x0 + w, gy);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(229,57,53,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.12, y0);
  ctx.lineTo(x0 + w * 0.12, y0 + h * 1.1);
  ctx.stroke();
  ctx.restore();

  // Сама формула «чернилами»
  ctx.fillStyle = '#3949AB';
  ctx.font = `bold ${Math.round(h * 0.5)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('∑x²', px + w * 0.06, py + h * 0.06);

  // Глазки на верхнем крае
  eye(ctx, px - w * 0.22, y0 + 2, 5, o.facing, 0.3);
  eye(ctx, px - w * 0.08, y0 + 2, 5, o.facing, 0.3);

  ctx.restore();
}

// ---------- Препятствия ----------

/** Парта: столешница с бликом, ножки с перекладиной, книга и карандаш сверху. */
export function drawDesk(
  ctx: CanvasRenderingContext2D, px: number, py: number, w: number, h: number,
): void {
  const top = py - h / 2;
  ctx.save();
  ctx.lineJoin = 'round';

  // Ножки с перекладиной
  const legW = 14;
  rr(ctx, px - w / 2 + 12, top + 20, legW, h - 24, 4, '#6D4222');
  rr(ctx, px + w / 2 - 12 - legW, top + 20, legW, h - 24, 4, '#6D4222');
  ctx.strokeStyle = '#6D4222';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(px - w / 2 + 22, py + h * 0.22);
  ctx.lineTo(px + w / 2 - 22, py + h * 0.22);
  ctx.stroke();

  // Столешница
  rr(ctx, px - w / 2 - 6, top, w + 12, 24, 8, '#8B5A2B');
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; // блик
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px - w / 2 + 8, top + 7);
  ctx.lineTo(px + w * 0.1, top + 7);
  ctx.stroke();

  // Открытая книга на столе
  const bx = px - w * 0.22;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bx - 20, top - 2);
  ctx.quadraticCurveTo(bx - 10, top - 10, bx, top - 4);
  ctx.quadraticCurveTo(bx + 10, top - 10, bx + 20, top - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx, top - 4);
  ctx.lineTo(bx, top - 1);
  ctx.stroke();

  // Карандаш
  ctx.strokeStyle = '#FBC02D';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(px + w * 0.12, top - 3);
  ctx.lineTo(px + w * 0.3, top - 3);
  ctx.stroke();
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.moveTo(px + w * 0.3, top - 6);
  ctx.lineTo(px + w * 0.36, top - 3);
  ctx.lineTo(px + w * 0.3, top);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/** Скамейка: две рейки сиденья на ножках. */
export function drawBench(
  ctx: CanvasRenderingContext2D, px: number, py: number, w: number, h: number,
): void {
  ctx.save();
  // Ножки
  const legW = 10;
  rr(ctx, px - w / 2 + 10, py - 2, legW, h / 2 + 6, 3, '#2E7031');
  rr(ctx, px + w / 2 - 10 - legW, py - 2, legW, h / 2 + 6, 3, '#2E7031');
  // Две рейки
  const slatH = h * 0.42;
  rr(ctx, px - w / 2, py - h / 2, w, slatH, 5, '#43A047');
  rr(ctx, px - w / 2, py - h / 2 + slatH + 4, w, slatH, 5, '#388E3C');
  // Блик
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px - w / 2 + 8, py - h / 2 + 5);
  ctx.lineTo(px, py - h / 2 + 5);
  ctx.stroke();
  ctx.restore();
}

/** Стопка книг: корешки, белые срезы страниц, разнобой по сдвигу. */
export function drawBooks(
  ctx: CanvasRenderingContext2D, px: number, py: number, w: number, h: number,
): void {
  const bh = h / 3;
  const shifts = [-4, 5, -2];
  const tilts = [0, 0, -0.05];
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const cy = py + h / 2 - bh * (i + 0.5);
    ctx.save();
    ctx.translate(px + shifts[i], cy);
    ctx.rotate(tilts[i]);
    // Обложка
    rr(ctx, -w / 2, -bh / 2 + 2, w, bh - 4, 4, BOOK_COLORS[i]);
    // Срез страниц справа
    ctx.fillStyle = '#FFF8E1';
    ctx.fillRect(w / 2 - 7, -bh / 2 + 5, 5, bh - 10);
    // Корешок-полоска слева
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-w / 2 + 3, -bh / 2 + 4, 6, bh - 8);
    ctx.restore();
  }
  ctx.restore();
}

// ---------- Геометрия уровня ----------

/** Блок земли: тело, полоса покрытия сверху, швы по целым мировым X. */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  left: number, top: number, w: number, h: number,
  worldLeft: number, t: LevelTheme,
): void {
  ctx.fillStyle = t.floor;
  ctx.fillRect(left, top, w, h);
  // Полоса покрытия
  const stripH = Math.min(UNIT * 0.14, h);
  ctx.fillStyle = t.floorTop;
  ctx.fillRect(left, top, w, stripH);
  // Швы плит — каждые 2 юнита
  ctx.strokeStyle = t.floorSeam;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  const first = Math.ceil(worldLeft / 2) * 2;
  for (let wx = first; wx * UNIT < worldLeft * UNIT + w; wx += 2) {
    const x = left + (wx - worldLeft) * UNIT;
    ctx.moveTo(x, top + stripH);
    ctx.lineTo(x, top + h);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Тёмная линия под покрытием
  ctx.fillStyle = t.floorSeam;
  ctx.fillRect(left, top + stripH, w, 3);
}

/** Висячая платформа-полка. */
export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  left: number, top: number, w: number, h: number, t: LevelTheme,
): void {
  ctx.beginPath();
  roundRectPath(ctx, left, top, w, h, 8);
  ctx.fillStyle = t.platform;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW * 0.8;
  ctx.stroke();
  // Светлая кромка сверху
  ctx.beginPath();
  roundRectPath(ctx, left + 3, top + 3, w - 6, Math.min(10, h - 6), 5);
  ctx.fillStyle = t.platformTop;
  ctx.fill();
}

// ---------- Собираемое и прочее ----------

/** Пятёрка: вращающаяся золотая монета с «5». */
export function drawFive(
  ctx: CanvasRenderingContext2D, px: number, py: number, time: number, phase: number,
): void {
  const r = 0.24 * UNIT;
  const spin = Math.cos(time * 3 + phase * 1.3);
  const sx = Math.max(Math.abs(spin), 0.18);
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(sx, 1);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#FFB300';
  ctx.fill();
  ctx.strokeStyle = '#B37B00';
  ctx.lineWidth = LW;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD600';
  ctx.fill();
  if (Math.abs(spin) > 0.45) {
    ctx.fillStyle = '#7B5E00';
    ctx.font = `900 ${Math.round(r * 1.15)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', 0, 2);
  }
  ctx.restore();
}

/**
 * Карточка варианта ответа над платформой: буква А/Б/В.
 * armed + confirmK (0..1) — кольцо подтверждения вокруг карточки.
 * highlight: в фазе показа результата подсвечивает верный (зелёный)
 * и ошибочно выбранный (красный) варианты.
 */
export function drawOptionCard(
  ctx: CanvasRenderingContext2D, px: number, py: number, letter: string,
  armed: boolean, confirmK: number,
  highlight: 'correct' | 'wrong' | null = null,
): void {
  const w = 0.7 * UNIT;
  const h = 0.8 * UNIT;
  const color =
    highlight === 'correct' ? '#4CAF50' :
    highlight === 'wrong' ? '#E53935' :
    COLORS.optionCard;
  ctx.save();
  // Мягкая тень
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  roundRectPath(ctx, px - w / 2 + 4, py - h / 2 + 5, w, h, 10);
  ctx.fill();
  // Карточка
  rr(ctx, px - w / 2, py - h / 2, w, h, 10, color);
  // Белая рамка
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundRectPath(ctx, px - w / 2 + 6, py - h / 2 + 6, w - 12, h - 12, 6);
  ctx.stroke();
  // Буква
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${Math.round(h * 0.5)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, px, py + 2);
  // Кольцо подтверждения: заполняется, пока игрок стоит на платформе
  if (armed && confirmK > 0) {
    const r = Math.max(w, h) * 0.72;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#FFD600';
    ctx.beginPath();
    ctx.arc(px, py, r, -Math.PI / 2, -Math.PI / 2 + confirmK * Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Чекпоинт: флажок на столбике; активный — зелёный, машет, с шапочкой. */
export function drawCheckpoint(
  ctx: CanvasRenderingContext2D,
  px: number, topY: number, groundY: number,
  active: boolean, time: number,
): void {
  ctx.save();
  // Столбик
  ctx.fillStyle = '#9E9E9E';
  ctx.fillRect(px - 4, topY, 8, groundY - topY);
  ctx.beginPath();
  ctx.arc(px, topY, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#BDBDBD';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Флажок (двухсегментная волна при активном)
  const wave = active ? Math.sin(time * 6) * 6 : 0;
  const fw = 0.5 * UNIT;
  const fh = 0.34 * UNIT;
  ctx.beginPath();
  ctx.moveTo(px + 4, topY + 6);
  ctx.quadraticCurveTo(px + 4 + fw * 0.5, topY + 6 + wave, px + 4 + fw, topY + 6 + wave * 0.5);
  ctx.lineTo(px + 4 + fw * 0.8, topY + 6 + fh / 2 + wave * 0.3);
  ctx.quadraticCurveTo(px + 4 + fw * 0.4, topY + 6 + fh + wave * 0.5, px + 4, topY + 6 + fh);
  ctx.closePath();
  ctx.fillStyle = active ? '#8BC34A' : '#FFEB3B';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Академическая шапочка на активном
  if (active) {
    ctx.save();
    ctx.translate(px, topY - 10);
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(0, -8);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Кисточка
    ctx.strokeStyle = '#FFD600';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 10);
    ctx.stroke();
    ctx.fillStyle = '#FFD600';
    ctx.beginPath();
    ctx.arc(14, 12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** Диплом: свиток с красной лентой и золотым сиянием. */
export function drawDiploma(
  ctx: CanvasRenderingContext2D, px: number, py: number, time: number,
): void {
  const w = 0.62 * UNIT;  // красная корочка (портретная книжечка)
  const h = 0.84 * UNIT;
  ctx.save();
  // Сияние
  const glowR = UNIT * (0.95 + Math.sin(time * 2) * 0.08);
  const grad = ctx.createRadialGradient(px, py, 10, px, py, glowR);
  grad.addColorStop(0, 'rgba(255,214,0,0.5)');
  grad.addColorStop(1, 'rgba(255,214,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Красная обложка «красного диплома»
  rr(ctx, px - w / 2, py - h / 2, w, h, 7, '#C62828');
  // Корешок слева (темнее)
  ctx.fillStyle = '#8E1B1B';
  ctx.fillRect(px - w / 2 + 3, py - h / 2 + 3, 8, h - 6);
  // Золотая рамка
  ctx.strokeStyle = '#FFD600';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  roundRectPath(ctx, px - w / 2 + 9, py - h / 2 + 7, w - 16, h - 14, 4);
  ctx.stroke();
  // Золотой герб-звезда
  ctx.fillStyle = '#FFD600';
  ctx.beginPath();
  const starR = w * 0.17;
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? starR : starR * 0.45;
    const sx = px + w * 0.06 + Math.cos(ang) * rad;
    const sy = py - h * 0.16 + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  // Надпись «ДИПЛОМ»
  ctx.fillStyle = '#FFD600';
  ctx.font = `900 ${Math.round(w * 0.2)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ДИПЛОМ', px + w * 0.06, py + h * 0.22);
  ctx.restore();
}

/**
 * Праздничный пьедестал под красный диплом (финальный уровень).
 * px — центр; groundPy — экранный Y верха пола; h — высота тумбы в px.
 */
export function drawPedestal(
  ctx: CanvasRenderingContext2D, px: number, groundPy: number, h: number,
): void {
  const w = 1.1 * UNIT;
  const top = groundPy - h;
  ctx.save();
  // Тумба
  rr(ctx, px - w / 2 + 8, top + 10, w - 16, h - 10, 6, '#8D5524');
  // Красная дорожка-накидка сверху со свисающим передом
  rr(ctx, px - w / 2, top, w, 14, 5, '#C62828');
  ctx.fillStyle = '#B71C1C';
  ctx.beginPath();
  ctx.moveTo(px - w * 0.28, top + 12);
  ctx.lineTo(px + w * 0.28, top + 12);
  ctx.lineTo(px + w * 0.2, top + h * 0.55);
  ctx.lineTo(px - w * 0.2, top + h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Золотая бахрома накидки
  ctx.strokeStyle = '#FFD600';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px - w * 0.2, top + h * 0.55 - 2);
  ctx.lineTo(px + w * 0.2, top + h * 0.55 - 2);
  ctx.stroke();
  ctx.restore();
}

/** Ворота арены: внизу дверь кабинета в человеческий рост, выше — стена. */
export function drawGate(
  ctx: CanvasRenderingContext2D, px: number, py: number, w: number, h: number,
): void {
  const bottom = py + h / 2;
  const doorH = Math.min(h, 2.2 * UNIT);
  const doorTop = bottom - doorH;
  ctx.save();

  // Стена над дверью
  if (h > doorH) {
    rr(ctx, px - w / 2, py - h / 2, w, h - doorH + 8, 4, '#6D4C41');
  }

  // Полотно двери
  rr(ctx, px - w / 2, doorTop, w, doorH, 5, '#4E342E');
  // Филёнки
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundRectPath(ctx, px - w / 2 + 7, doorTop + 14, w - 14, doorH * 0.34, 5);
  ctx.stroke();
  ctx.beginPath();
  roundRectPath(ctx, px - w / 2 + 7, doorTop + doorH * 0.52, w - 14, doorH * 0.34, 5);
  ctx.stroke();
  // Ручка
  ctx.fillStyle = '#FFD600';
  ctx.beginPath();
  ctx.arc(px + w / 2 - 12, doorTop + doorH * 0.48, 6, 0, Math.PI * 2);
  ctx.fill();
  // Табличка «ЭКЗАМЕН» поперёк двери
  ctx.save();
  ctx.translate(px, doorTop + doorH * 0.18);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#FFF8E1';
  ctx.fillRect(-46, -11, 92, 22);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(-46, -11, 92, 22);
  ctx.fillStyle = '#4E342E';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ЭКЗАМЕН', 0, 1);
  ctx.restore();

  ctx.restore();
}

// ---------- Кафедра и профессор ----------

/**
 * Кафедра-балкон профессора. px — центр, baseY — экранный Y верха балкона
 * (профессор стоит на этой высоте). Чистый декор: коллизии нет.
 */
export function drawLectern(
  ctx: CanvasRenderingContext2D, px: number, baseY: number,
): void {
  const slabW = 3.6 * UNIT;
  const slabH = 0.35 * UNIT;
  const podW = 1.7 * UNIT;
  const podH = 0.8 * UNIT; // ниже головы профессора — эмоции лица видны
  ctx.save();

  // Кронштейны-опоры под балконом
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW;
  ctx.fillStyle = '#5D4037';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(px + side * slabW * 0.32, baseY + slabH);
    ctx.lineTo(px + side * slabW * 0.22, baseY + slabH + 0.45 * UNIT);
    ctx.lineTo(px + side * slabW * 0.12, baseY + slabH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Плита балкона
  rr(ctx, px - slabW / 2, baseY, slabW, slabH, 8, COLORS.lectern);

  // Трибуна (стоит на плите, рисуется ПОВЕРХ профессора — он за ней)
  rr(ctx, px - podW / 2, baseY - podH, podW, podH, 8, '#8D6E63');
  // Скошенный пюпитр сверху
  rr(ctx, px - podW / 2 - 6, baseY - podH - 10, podW + 12, 20, 6, '#A1887F');
  // Филёнка с эмблемой
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundRectPath(ctx, px - podW / 2 + 10, baseY - podH + 16, podW - 20, podH - 28, 6);
  ctx.stroke();
  ctx.fillStyle = '#FFD600';
  ctx.font = `900 ${Math.round(podH * 0.34)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('∑', px, baseY - podH * 0.45);

  ctx.restore();
}

// Внешность 4 преподавателей — рисуем процедурно по образцу присланных
// пиксельных моделек. Над трибуной видны голова и верх туловища.
type HairStyle = 'bald' | 'shortGrey' | 'longWavy' | 'brownShort';
type Outfit = 'plaid' | 'blazer' | 'dress' | 'hoodie';

interface ProfLook {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  glasses: 'none' | 'round' | 'square';
  outfit: Outfit;
  outfitMain: string;    // основной цвет одежды
  outfitAccent: string;  // рубашка/подкладка/узор
  defaultSmile: boolean; // приветливое лицо в спокойном состоянии
}

const PROF_LOOKS: Record<number, ProfLook> = {
  // 1. Койбаев В. А. — полностью лысый, круглые очки, клетчатая рубашка, строгий
  1: { skin: '#E7B487', hair: '#9E9E9E', hairStyle: 'bald', glasses: 'round',
       outfit: 'plaid', outfitMain: '#D9CDB0', outfitAccent: '#A99B78', defaultSmile: false },
  // 2. Кулаев Р. Ч. — очки, глубокие залысины, серый пиджак, голубая рубашка, улыбчивый
  2: { skin: '#E7B487', hair: '#8C8C8C', hairStyle: 'shortGrey', glasses: 'square',
       outfit: 'blazer', outfitMain: '#8E8B84', outfitAccent: '#CBE0EF', defaultSmile: true },
  // 3. Тотиева Ж. Д. — длинные тёмные волосы, круглые очки, тёмное платье в цветочек
  3: { skin: '#F0C08A', hair: '#26242B', hairStyle: 'longWavy', glasses: 'round',
       outfit: 'dress', outfitMain: '#33303A', outfitAccent: '#CE8AA0', defaultSmile: true },
  // 4. Макаренко М. Д. — тёмные волосы (чёлка выше глаз), очки, тёмно-голубая толстовка
  4: { skin: '#F3C79A', hair: '#5B3A24', hairStyle: 'brownShort', glasses: 'square',
       outfit: 'hoodie', outfitMain: '#7E9FCB', outfitAccent: '#6888B4', defaultSmile: true },
};

/**
 * Профессор-экзаменатор за кафедрой, нарисованный процедурно по образцу
 * присланных моделек (см. PROF_LOOKS). (px, py) — центр фигуры, размеры
 * в пикселях; state — эмоция, flash — белая вспышка после верного ответа.
 * Состояние 'dead' — это не смерть, а «ошалел от поражения»: спиральные
 * глаза, приоткрытый рот и кружащиеся звёздочки.
 */
export function drawProfessorPlaceholder(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number,
  level: number, time: number, state: ProfState, flash: number,
): void {
  const look = PROF_LOOKS[level] ?? PROF_LOOKS[1];
  const defeated = state === 'dead';
  const bob = Math.sin(time * (defeated ? 8 : 2.2)) * h * (defeated ? 0.03 : 0.02);
  const sway = defeated ? Math.sin(time * 6) * (w * 0.05) : 0;
  const cy = py + bob;
  const headR = h * 0.22;
  const headY = cy - h / 2 + headR;
  const skin = flash > 0 ? '#FFFFFF' : look.skin;

  ctx.save();
  ctx.translate(sway, 0);
  ctx.lineJoin = 'round';

  // Задняя масса длинных волос (за головой и плечами)
  if (look.hairStyle === 'longWavy') {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.ellipse(px, headY + headR * 0.25, headR * 1.35, headR * 1.75, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Туловище и одежда
  const bodyW = w * 0.94;
  const bodyH = h * 0.62;
  const bodyY = headY + headR * 0.72;
  drawOutfit(ctx, look, px, bodyY, bodyW, bodyH, headR, flash);

  // Передние пряди длинных волос поверх плеч
  if (look.hairStyle === 'longWavy') {
    ctx.fillStyle = look.hair;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(px + side * headR * 0.85, headY);
      ctx.quadraticCurveTo(px + side * headR * 1.25, headY + headR * 1.5,
        px + side * headR * 0.75, bodyY + bodyH * 0.3);
      ctx.quadraticCurveTo(px + side * headR * 0.4, headY + headR * 1.1,
        px + side * headR * 0.45, headY);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Голова
  ctx.beginPath();
  ctx.arc(px, headY, headR, 0, Math.PI * 2);
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW;
  ctx.stroke();

  // Причёска (передний слой)
  drawProfHair(ctx, look, px, headY, headR);

  // Лицо
  const eyeY = headY - headR * 0.02;
  const eyeDX = headR * 0.42;
  const mouthY = headY + headR * 0.52;

  if (defeated) {
    dizzyEye(ctx, px - eyeDX, eyeY, headR * 0.26, time);
    dizzyEye(ctx, px + eyeDX, eyeY, headR * 0.26, time);
  } else {
    const dir = state === 'angry' ? 0.85 : 0.3;
    eye(ctx, px - eyeDX, eyeY, headR * 0.24, 0, dir);
    eye(ctx, px + eyeDX, eyeY, headR * 0.24, 0, dir);
    if (state === 'angry') {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(2.5, LW * 0.8);
      ctx.beginPath();
      ctx.moveTo(px - eyeDX - headR * 0.28, eyeY - headR * 0.5);
      ctx.lineTo(px - eyeDX + headR * 0.22, eyeY - headR * 0.24);
      ctx.moveTo(px + eyeDX + headR * 0.28, eyeY - headR * 0.5);
      ctx.lineTo(px + eyeDX - headR * 0.22, eyeY - headR * 0.24);
      ctx.stroke();
    }
  }

  // Очки
  if (look.glasses !== 'none') {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(2, LW * 0.55);
    const gr = headR * 0.33;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      if (look.glasses === 'round') ctx.arc(px + side * eyeDX, eyeY, gr, 0, Math.PI * 2);
      else roundRectPath(ctx, px + side * eyeDX - gr, eyeY - gr * 0.78, gr * 2, gr * 1.56, 3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(px - eyeDX + gr, eyeY);
    ctx.lineTo(px + eyeDX - gr, eyeY);
    ctx.stroke();
  }

  // Рот-эмоция
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(2.5, LW * 0.7);
  if (defeated) {
    ctx.fillStyle = '#7A3B39';
    ctx.beginPath();
    ctx.ellipse(px, mouthY + headR * 0.06, headR * 0.16, headR * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (state === 'happy') {
    ctx.beginPath();
    ctx.arc(px, mouthY - headR * 0.12, headR * 0.3, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
  } else if (state === 'angry') {
    ctx.beginPath();
    ctx.arc(px, mouthY + headR * 0.4, headR * 0.3, 1.12 * Math.PI, 1.88 * Math.PI);
    ctx.stroke();
  } else if (look.defaultSmile) {
    ctx.beginPath();
    ctx.arc(px, mouthY - headR * 0.05, headR * 0.24, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(px - headR * 0.22, mouthY);
    ctx.lineTo(px + headR * 0.22, mouthY);
    ctx.stroke();
  }

  // Кружащиеся звёздочки при поражении
  if (defeated) {
    ctx.fillStyle = '#FFD600';
    ctx.font = `900 ${Math.round(headR * 0.6)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const a = time * 5 + (i / 3) * Math.PI * 2;
      ctx.fillText('✦',
        px + Math.cos(a) * headR * 1.35,
        headY - headR * 1.15 + Math.sin(a) * headR * 0.4);
    }
  }

  ctx.restore();
}

/** Причёска профессора (передний слой). */
function drawProfHair(
  ctx: CanvasRenderingContext2D, look: ProfLook,
  px: number, headY: number, headR: number,
): void {
  ctx.fillStyle = look.hair;
  ctx.strokeStyle = OUTLINE;
  const thin = Math.max(2, LW * 0.6);
  switch (look.hairStyle) {
    case 'bald': // полностью лысый: только блик на макушке
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = thin;
      ctx.beginPath();
      ctx.arc(px - headR * 0.25, headY - headR * 0.35, headR * 0.45, Math.PI * 1.1, Math.PI * 1.6);
      ctx.stroke();
      ctx.strokeStyle = OUTLINE;
      break;
    case 'shortGrey': // короткие волосы только по бокам и сзади (глубокие залысины)
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(px + side * headR * 0.85, headY - headR * 0.05, headR * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = thin;
      ctx.beginPath();
      ctx.arc(px, headY - headR * 0.05, headR * 0.98, Math.PI * 1.12, Math.PI * 1.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, headY - headR * 0.05, headR * 0.98, Math.PI * 1.7, Math.PI * 1.88);
      ctx.stroke();
      break;
    case 'brownShort': { // аккуратная шапка волос, чёлка НАД очками
      ctx.beginPath();
      ctx.arc(px, headY - headR * 0.28, headR * 1.0, Math.PI, Math.PI * 2);
      const n = 4;
      for (let i = 0; i <= n; i++) {
        const x = px + headR * 1.0 - (i / n) * headR * 2.0;
        const y = headY - headR * 0.28 + (i % 2 === 0 ? headR * 0.12 : headR * 0.02);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = thin;
      ctx.stroke();
      break;
    }
    case 'longWavy': // макушка (основная масса — сзади)
      ctx.beginPath();
      ctx.arc(px, headY - headR * 0.08, headR * 1.05, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      break;
  }
}

/** Одежда профессора (верх туловища над трибуной). */
function drawOutfit(
  ctx: CanvasRenderingContext2D, look: ProfLook,
  px: number, y: number, bw: number, bh: number, headR: number, flash: number,
): void {
  const main = flash > 0 ? '#FFFFFF' : look.outfitMain;
  rr(ctx, px - bw / 2, y, bw, bh, bw * 0.22, main, false);

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, px - bw / 2, y, bw, bh, bw * 0.22);
  ctx.clip();

  switch (look.outfit) {
    case 'plaid': { // клетчатая рубашка
      ctx.strokeStyle = look.outfitAccent;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = Math.max(2, LW * 0.5);
      for (let gx = px - bw / 2 + bw * 0.16; gx < px + bw / 2; gx += bw * 0.16) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + bh); ctx.stroke();
      }
      for (let gy = y + bh * 0.14; gy < y + bh; gy += bh * 0.14) {
        ctx.beginPath(); ctx.moveTo(px - bw / 2, gy); ctx.lineTo(px + bw / 2, gy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      profCollar(ctx, px, y, headR, main);
      break;
    }
    case 'blazer': { // пиджак поверх голубой рубашки
      ctx.fillStyle = look.outfitAccent;
      ctx.beginPath();
      ctx.moveTo(px - headR * 0.5, y);
      ctx.lineTo(px, y + bh * 0.5);
      ctx.lineTo(px + headR * 0.5, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = flash > 0 ? '#FFFFFF' : shade(look.outfitMain, -18);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(px, y);
        ctx.lineTo(px + side * headR * 0.55, y);
        ctx.lineTo(px + side * headR * 0.12, y + bh * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      profButtons(ctx, px, y + bh * 0.55, bh * 0.16, 2);
      break;
    }
    case 'dress': { // тёмное платье в мелкий цветочек
      const cols = ['#CE8AA0', '#8AA0CE', '#CEBE8A', '#8ACE9E'];
      let k = 0;
      for (let gy = y + bh * 0.16; gy < y + bh; gy += bh * 0.2) {
        for (let gx = px - bw / 2 + bw * 0.14; gx < px + bw / 2; gx += bw * 0.2) {
          ctx.fillStyle = cols[k % cols.length]; k++;
          ctx.beginPath(); ctx.arc(gx, gy, bw * 0.028, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.strokeStyle = look.outfitAccent;
      ctx.lineWidth = Math.max(2, LW * 0.6);
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + bh * 0.22); ctx.stroke();
      break;
    }
    case 'hoodie': { // толстовка с капюшоном
      ctx.fillStyle = flash > 0 ? '#FFFFFF' : shade(look.outfitMain, -16);
      ctx.beginPath();
      ctx.moveTo(px - headR * 0.9, y);
      ctx.quadraticCurveTo(px, y - headR * 0.55, px + headR * 0.9, y);
      ctx.lineTo(px + headR * 0.55, y + bh * 0.16);
      ctx.quadraticCurveTo(px, y + headR * 0.12, px - headR * 0.55, y + bh * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#EFEFEF';
      ctx.lineWidth = Math.max(2, LW * 0.5);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(px + side * headR * 0.15, y + bh * 0.12);
        ctx.lineTo(px + side * headR * 0.15, y + bh * 0.42);
        ctx.stroke();
      }
      ctx.strokeStyle = shade(look.outfitMain, -22);
      ctx.beginPath();
      roundRectPath(ctx, px - bw * 0.28, y + bh * 0.55, bw * 0.56, bh * 0.3, 8);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();

  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = LW;
  ctx.beginPath();
  roundRectPath(ctx, px - bw / 2, y, bw, bh, bw * 0.22);
  ctx.stroke();
}

/** V-образный воротник рубашки. */
function profCollar(
  ctx: CanvasRenderingContext2D, px: number, y: number, headR: number, fill: string,
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(2, LW * 0.55);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + side * headR * 0.5, y - headR * 0.05);
    ctx.lineTo(px + side * headR * 0.18, y + headR * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Вертикальный ряд пуговиц. */
function profButtons(
  ctx: CanvasRenderingContext2D, px: number, y: number, gap: number, n: number,
): void {
  ctx.fillStyle = '#3A3A3A';
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(px, y + i * gap, Math.max(2, gap * 0.18), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Спиральный «ошалевший» глаз (крутится). */
function dizzyEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, time: number,
): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(2, r * 0.28);
  ctx.beginPath();
  const turns = Math.PI * 4;
  const off = time * 6;
  for (let a = 0; a <= turns; a += 0.25) {
    const rad = r * (a / turns);
    const x = cx + Math.cos(a + off) * rad;
    const yv = cy + Math.sin(a + off) * rad;
    if (a === 0) ctx.moveTo(x, yv); else ctx.lineTo(x, yv);
  }
  ctx.stroke();
}

/** Осветлить/затемнить цвет #rrggbb на amt (может быть отрицательным). */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v));
  const r = c(((n >> 16) & 255) + amt);
  const g = c(((n >> 8) & 255) + amt);
  const b = c((n & 255) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
