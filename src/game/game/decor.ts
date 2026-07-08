// Фон уровня: градиент стены, узор, параллакс-слои (окна/колонны, доски
// с формулами, парящие символы), праздничный декор финала.
// Всё детерминировано от мировой X-координаты — тайлится при движении камеры.

import { CANVAS_H, CANVAS_W, UNIT } from './constants';
import type { LevelTheme } from './themes';

/** Детерминированный псевдослучайный [0,1) от целого k — для вариации тайлов. */
function hash(k: number): number {
  let h = Math.imul(k ^ 0x9e3779b9, 2654435761);
  h ^= h >>> 13;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const DOODLE_FONT = `'Comic Sans MS', 'Segoe Print', cursive, sans-serif`;
const CONFETTI = ['#EF5350', '#FFCA28', '#66BB6A', '#42A5F5', '#AB47BC'];

/**
 * Перебирает тайлы слоя с параллаксом q и периодом period (юниты),
 * вызывая draw(k, screenX) для каждого потенциально видимого тайла.
 */
function tiles(
  camX: number, q: number, period: number,
  draw: (k: number, sx: number) => void,
): void {
  const camQ = camX * q;
  const halfW = CANVAS_W / 2 / UNIT + period;
  const k0 = Math.floor((camQ - halfW) / period);
  const k1 = Math.ceil((camQ + halfW) / period);
  for (let k = k0; k <= k1; k++) {
    draw(k, (k * period - camQ) * UNIT + CANVAS_W / 2);
  }
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  t: LevelTheme,
  camX: number,
  camY: number,
  time: number,
): void {
  // Вертикаль фона движется слабее камеры — лёгкий вертикальный параллакс
  const camYb = 5 + (camY - 5) * 0.3;
  const sy = (wy: number): number => CANVAS_H / 2 - (wy - camYb) * UNIT;

  // --- Стена: вертикальный градиент ---
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0, t.wallTop);
  g.addColorStop(1, t.wallBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawPattern(ctx, t, camX, time);
  if (t.far === 'windows') drawWindows(ctx, t, camX, sy);
  else drawColumns(ctx, camX, sy);
  drawBoards(ctx, t, camX, sy);
  drawFloaters(ctx, t, camX, sy, time);
  if (t.festive) {
    drawBanners(ctx, camX, sy);
    drawCrowd(ctx, camX, sy, time);
    drawFestive(ctx, camX, time);
  }
}

// ---------- Узор стены ----------

function drawPattern(
  ctx: CanvasRenderingContext2D, t: LevelTheme, camX: number, time: number,
): void {
  ctx.save();
  ctx.strokeStyle = t.patternColor;
  ctx.fillStyle = t.patternColor;

  if (t.wallPattern === 'grid') {
    // Миллиметровка: сетка с лёгким горизонтальным параллаксом
    ctx.globalAlpha = 0.10;
    ctx.lineWidth = 2;
    const step = UNIT * 0.75;
    const off = (camX * 0.15 * UNIT) % step;
    ctx.beginPath();
    for (let x = -off; x <= CANVAS_W; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
    }
    for (let y = 0; y <= CANVAS_H; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
    }
    ctx.stroke();
  } else if (t.wallPattern === 'waves') {
    // Синусоиды по стене — «решения уравнений»
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 4;
    const off = camX * 0.2 * UNIT;
    for (let row = 0; row < 5; row++) {
      const baseY = CANVAS_H * (0.12 + row * 0.18);
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_W; x += 12) {
        const y = baseY + Math.sin((x + off) * 0.012 + row * 1.7) * 26;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (t.wallPattern === 'dots') {
    // «Звёзды случайности»: мерцающие точки
    const step = UNIT * 1.4;
    const off = (camX * 0.1 * UNIT);
    const cols = Math.ceil(CANVAS_W / step) + 2;
    const rows = Math.ceil(CANVAS_H / step) + 1;
    const k0 = Math.floor(off / step);
    for (let i = k0; i < k0 + cols; i++) {
      for (let j = 0; j < rows; j++) {
        const r = hash(i * 131 + j);
        const x = i * step - off + (r - 0.5) * step * 0.8;
        const y = j * step + (hash(i + j * 977) - 0.5) * step * 0.8;
        const tw = 0.5 + 0.5 * Math.sin(time * 1.5 + r * 20);
        ctx.globalAlpha = 0.1 + 0.2 * tw;
        ctx.beginPath();
        ctx.arc(x, y, 3 + r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// ---------- Дальний слой: окна / колонны ----------

function drawWindows(
  ctx: CanvasRenderingContext2D, t: LevelTheme, camX: number,
  sy: (wy: number) => number,
): void {
  ctx.save();
  tiles(camX, 0.25, 6, (k, sx) => {
    const w = 2.1 * UNIT;
    const top = sy(4.6);
    const bottom = sy(2.0);
    const h = bottom - top;
    const x = sx - w / 2;

    // Рама
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    roundRectPath(ctx, x - 8, top - 8, w + 16, h + 16, 14);
    ctx.fill();
    // Стекло со светом
    ctx.fillStyle = t.windowGlow;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    roundRectPath(ctx, x, top, w, h, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Переплёт
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(sx, top);
    ctx.lineTo(sx, bottom);
    ctx.moveTo(x, top + h / 2);
    ctx.lineTo(x + w, top + h / 2);
    ctx.stroke();
    // В некоторых окнах — солнце/облако
    const r = hash(k);
    if (r > 0.6) {
      ctx.fillStyle = 'rgba(255,214,0,0.5)';
      ctx.beginPath();
      ctx.arc(sx + w * 0.22, top + h * 0.28, 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (r < 0.25) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(sx - w * 0.15, top + h * 0.3, 26, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(sx + w * 0.05, top + h * 0.26, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Подоконник
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x - 14, bottom + 8, w + 28, 10);
  });
  ctx.restore();
}

function drawColumns(
  ctx: CanvasRenderingContext2D, camX: number,
  sy: (wy: number) => number,
): void {
  ctx.save();
  tiles(camX, 0.25, 5, (_k, sx) => {
    const w = 1.1 * UNIT;
    const base = sy(0.6);
    // Тело колонны — во всю высоту экрана
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(sx - w / 2, -10, w, base + 10);
    // Каннелюры
    ctx.strokeStyle = 'rgba(198,132,66,0.25)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(sx + i * w * 0.28, 20);
      ctx.lineTo(sx + i * w * 0.28, base - 30);
    }
    ctx.stroke();
    // База
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(sx - w * 0.7, base - 26, w * 1.4, 26);
  });
  ctx.restore();
}

// ---------- Средний слой: доски с формулами и постеры ----------

function drawBoards(
  ctx: CanvasRenderingContext2D, t: LevelTheme, camX: number,
  sy: (wy: number) => number,
): void {
  ctx.save();
  tiles(camX, 0.5, 7.5, (k, sx) => {
    const r = hash(k * 7 + 3);
    if (r < 0.55) {
      // Школьная доска с формулой мелом
      const w = 3 * UNIT;
      const h = 1.6 * UNIT;
      const cy = sy(3.1);
      ctx.fillStyle = t.boardFrame;
      ctx.beginPath();
      roundRectPath(ctx, sx - w / 2 - 10, cy - h / 2 - 10, w + 20, h + 20, 12);
      ctx.fill();
      ctx.fillStyle = t.board;
      ctx.beginPath();
      roundRectPath(ctx, sx - w / 2, cy - h / 2, w, h, 6);
      ctx.fill();
      // Формулы (1–2 строки)
      ctx.fillStyle = t.chalk;
      ctx.font = `bold ${Math.round(UNIT * 0.34)}px ${DOODLE_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const d1 = t.doodles[((k % t.doodles.length) + t.doodles.length) % t.doodles.length];
      const d2 = t.doodles[((k + 1) % t.doodles.length + t.doodles.length) % t.doodles.length];
      ctx.globalAlpha = 0.9;
      ctx.fillText(d1, sx, cy - h * 0.18);
      ctx.globalAlpha = 0.55;
      ctx.fillText(d2, sx + w * 0.06, cy + h * 0.22);
      ctx.globalAlpha = 1;
      // Полочка с мелом
      ctx.fillStyle = t.boardFrame;
      ctx.fillRect(sx - w * 0.3, cy + h / 2 + 10, w * 0.6, 8);
    } else if (r < 0.8) {
      // Постер с символом предмета
      const w = 1.1 * UNIT;
      const h = 1.5 * UNIT;
      const cy = sy(3.3);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      roundRectPath(ctx, sx - w / 2, cy - h / 2, w, h, 8);
      ctx.fill();
      ctx.fillStyle = t.board;
      ctx.globalAlpha = 0.8;
      ctx.font = `bold ${Math.round(UNIT * 0.55)}px ${DOODLE_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const sym = t.floaters[((k % t.floaters.length) + t.floaters.length) % t.floaters.length];
      ctx.fillText(sym, sx, cy);
      ctx.globalAlpha = 1;
      // Кнопки-канцелярки
      ctx.fillStyle = '#E57373';
      ctx.beginPath();
      ctx.arc(sx - w / 2 + 10, cy - h / 2 + 10, 4, 0, Math.PI * 2);
      ctx.arc(sx + w / 2 - 10, cy - h / 2 + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Книжный шкаф у стены
      const w = 1.8 * UNIT;
      const h = 2.4 * UNIT;
      const bottom = sy(0.55);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = t.boardFrame;
      ctx.beginPath();
      roundRectPath(ctx, sx - w / 2, bottom - h, w, h, 8);
      ctx.fill();
      // Тёмные ниши полок с цветными корешками
      for (let row = 0; row < 3; row++) {
        const ry = bottom - h + h * (0.08 + row * 0.31);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(sx - w * 0.42, ry, w * 0.84, h * 0.24);
        for (let b = 0; b < 5; b++) {
          const r2 = hash(k * 31 + row * 7 + b);
          const bw = 10 + r2 * 8;
          const bh = h * (0.16 + r2 * 0.07);
          ctx.fillStyle = CONFETTI[(k + row * 2 + b) % CONFETTI.length];
          ctx.fillRect(sx - w * 0.4 + b * w * 0.165, ry + h * 0.24 - bh, bw, bh);
        }
      }
      ctx.globalAlpha = 1;
    }
  });
  ctx.restore();
}

// ---------- Парящие символы предмета ----------

function drawFloaters(
  ctx: CanvasRenderingContext2D, t: LevelTheme, camX: number,
  sy: (wy: number) => number, time: number,
): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  tiles(camX, 0.7, 3.5, (k, sx) => {
    const r = hash(k * 13 + 5);
    const sym = t.floaters[((k % t.floaters.length) + t.floaters.length) % t.floaters.length];
    const wy = 4.2 + r * 3.5;
    const bobY = Math.sin(time * 0.8 + r * 12) * 14;
    const size = UNIT * (0.4 + r * 0.4);
    ctx.globalAlpha = 0.14 + r * 0.1;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(size)}px ${DOODLE_FONT}`;
    ctx.fillText(sym, sx, sy(wy) + bobY);
  });
  ctx.restore();
}

// ---------- Праздник: растяжки с поздравлениями ----------

const BANNER_TEXTS = ['ПОЗДРАВЛЯЕМ!', 'С ДИПЛОМОМ!', 'УРА ВЫПУСКНИКАМ!'];

function drawBanners(
  ctx: CanvasRenderingContext2D, camX: number,
  sy: (wy: number) => number,
): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  tiles(camX, 0.3, 7, (k, sx) => {
    const r = hash(k * 41 + 17);
    const text = BANNER_TEXTS[((k % BANNER_TEXTS.length) + BANNER_TEXTS.length) % BANNER_TEXTS.length];
    const w = 3.3 * UNIT;
    const h = 0.55 * UNIT;
    const cy = sy(6.4 + r * 0.8);
    // Верёвки к верху экрана
    ctx.strokeStyle = 'rgba(109,76,65,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx - w * 0.42, cy - h / 2);
    ctx.lineTo(sx - w * 0.52, cy - h * 2.6);
    ctx.moveTo(sx + w * 0.42, cy - h / 2);
    ctx.lineTo(sx + w * 0.52, cy - h * 2.6);
    ctx.stroke();
    // Плашка
    ctx.fillStyle = 'rgba(255,248,225,0.95)';
    ctx.beginPath();
    roundRectPath(ctx, sx - w / 2, cy - h / 2, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = CONFETTI[(k + 1) % CONFETTI.length];
    ctx.lineWidth = 5;
    ctx.beginPath();
    roundRectPath(ctx, sx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, 8);
    ctx.stroke();
    // Текст поздравления
    ctx.fillStyle = '#BF360C';
    ctx.font = `900 ${Math.round(h * 0.44)}px ${DOODLE_FONT}`;
    ctx.fillText(text, sx, cy + 1);
  });
  ctx.restore();
}

// ---------- Праздник: толпа аплодирующих у пола ----------

const CROWD_SUITS = ['#5C6BC0', '#8D6E63', '#455A64', '#7E57C2', '#00897B', '#C0563F'];
const CROWD_SKINS = ['#FFCC9C', '#E7B487', '#F3C79A', '#D29B6E'];

function drawCrowd(
  ctx: CanvasRenderingContext2D, camX: number,
  sy: (wy: number) => number, time: number,
): void {
  ctx.save();
  tiles(camX, 0.35, 1.5, (k, sx) => {
    const r = hash(k * 53 + 7);
    const ph = (0.95 + r * 0.45) * UNIT;       // рост фигуры
    const bw = UNIT * (0.4 + r * 0.14);        // ширина тела
    const jump = r > 0.75 ? Math.abs(Math.sin(time * 5 + r * 20)) * 10 : 0;
    const base = sy(0.5) + 4 - jump;           // ноги на полу
    const headR = ph * 0.17;
    const bodyTop = base - ph + headR * 2.2;
    const headY = bodyTop - headR * 0.6;
    const suit = CROWD_SUITS[((k % CROWD_SUITS.length) + CROWD_SUITS.length) % CROWD_SUITS.length];
    const skin = CROWD_SKINS[((k * 3 % CROWD_SKINS.length) + CROWD_SKINS.length) % CROWD_SKINS.length];

    ctx.globalAlpha = 0.9;
    // Тело
    ctx.fillStyle = suit;
    ctx.beginPath();
    roundRectPath(ctx, sx - bw / 2, bodyTop, bw, base - bodyTop, bw * 0.3);
    ctx.fill();
    // Голова
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(sx, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Руки хлопают над головой: ладони сходятся и расходятся
    const clap = Math.abs(Math.sin(time * 6 + r * 25)); // 0..1
    const shoulderY = bodyTop + headR * 0.5;
    const handY = headY - headR * (1.3 + clap * 0.3);
    const spread = headR * (1.6 - clap * 1.2);          // 1 — ладони вместе
    ctx.strokeStyle = suit;
    ctx.lineWidth = Math.max(4, bw * 0.16);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx - bw * 0.42, shoulderY);
    ctx.lineTo(sx - spread, handY);
    ctx.moveTo(sx + bw * 0.42, shoulderY);
    ctx.lineTo(sx + spread, handY);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(sx - spread, handY, headR * 0.32, 0, Math.PI * 2);
    ctx.arc(sx + spread, handY, headR * 0.32, 0, Math.PI * 2);
    ctx.fill();
    // «Хлоп»-искры в момент удара ладоней
    if (clap > 0.86) {
      ctx.strokeStyle = 'rgba(255,214,0,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + r * 5;
        ctx.moveTo(sx + Math.cos(a) * headR * 0.5, handY - headR * 0.5 + Math.sin(a) * headR * 0.5);
        ctx.lineTo(sx + Math.cos(a) * headR * 0.95, handY - headR * 0.5 + Math.sin(a) * headR * 0.95);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
  ctx.restore();
}

// ---------- Праздник: гирлянды флажков и конфетти ----------

function drawFestive(
  ctx: CanvasRenderingContext2D, camX: number, time: number,
): void {
  ctx.save();

  // Две провисающие гирлянды с флажками
  for (let row = 0; row < 2; row++) {
    const yBase = CANVAS_H * (0.1 + row * 0.09);
    const period = 4;
    tiles(camX, 0.35, period, (k, sx) => {
      const nextX = sx + period * UNIT;
      const sag = 46;
      ctx.strokeStyle = 'rgba(109,76,65,0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, yBase);
      ctx.quadraticCurveTo((sx + nextX) / 2, yBase + sag * 2, nextX, yBase);
      ctx.stroke();
      // Флажки вдоль нити
      for (let i = 0; i < 5; i++) {
        const q = (i + 0.5) / 5;
        const px = sx + (nextX - sx) * q;
        const py = yBase + sag * 2 * 2 * q * (1 - q); // точка на кривой Безье
        ctx.fillStyle = CONFETTI[(k * 5 + i + row) % CONFETTI.length];
        ctx.beginPath();
        ctx.moveTo(px - 14, py);
        ctx.lineTo(px + 14, py);
        ctx.lineTo(px, py + 30);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  // Падающее конфетти
  for (let i = 0; i < 40; i++) {
    const r = hash(i * 97 + 11);
    const x = ((r * CANVAS_W + Math.sin(time * (0.6 + r) + i) * 40) % CANVAS_W + CANVAS_W) % CANVAS_W;
    const y = ((r * CANVAS_H + time * (60 + r * 90)) % (CANVAS_H + 40)) - 20;
    ctx.fillStyle = CONFETTI[i % CONFETTI.length];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * (1 + r * 2) + i);
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-6, -3, 12, 6);
    ctx.restore();
  }

  ctx.restore();
}

// ---------- Утилита ----------

/** Путь скруглённого прямоугольника (совместимо со старыми браузерами). */
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
