// Ядро игры: игровой цикл (requestAnimationFrame), правила, рендер на Canvas 2D.
// Объединяет логику GameManager.cs + Collectable.cs + Checkpoint.cs + рендер.
//
// React-обёртка (GameScreen) создаёт Game, подписывается на HUD и события,
// пробрасывает экранные кнопки в game.input.

import {
  CANVAS_H, CANVAS_W, COLORS, DEATH_Y, FIVES_DEATH_PENALTY, FIVES_PER_LIFE,
  MAX_ARENA_DVOYKAS, PLAYER_VISUAL_SCALE, QUIZ_CONFIRM_TIME, UNIT, VIEW_H, VIEW_W,
} from './constants';
import { drawBackground } from './decor';
import { Enemy } from './enemies';
import { getProfessor, preloadProfessor } from './images';
import { Input } from './input';
import { getLevel } from './levels';
import { Player } from './player';
import type { Solid } from './player';
import { Professor } from './professor';
import { getFives, getRunTime, setFives, setRunTime } from './progress';
import { QUESTIONS } from './questions';
import { QuizController } from './quiz';
import type { QuizUiState } from './quiz';
import * as spr from './sprites';
import { getTheme } from './themes';
import type { LevelTheme } from './themes';
import { clamp, overlaps } from './types';
import type { LevelData, Rect, Vec2 } from './types';

/** Снимок состояния для HUD (React перерисовывает только при изменении). */
export interface HudState {
  lives: number;
  fives: number;
  bossHp: number | null;      // null — экзамен ещё не начался
  timeSec: number;            // время забега, целые секунды
  quiz: QuizUiState | null;   // состояние квиза для оверлея (null — нет боя)
}

export interface GameCallbacks {
  onHud(h: HudState): void;
  onGameOver(): void;
  onVictory(): void;
  onDiploma(): void; // подобран диплом на финальном уровне
}

interface FiveEntity extends Vec2 { taken: boolean }
interface CheckpointEntity { x: number; active: boolean }
interface FlashEffect extends Vec2 { t: number; color: string }
interface Particle extends Vec2 { vx: number; vy: number; t: number; color: string }

export class Game {
  readonly input = new Input();

  private readonly ctx: CanvasRenderingContext2D;
  private readonly level: LevelData;
  private readonly solids: Solid[];
  private readonly cb: GameCallbacks;

  private readonly player: Player;
  private enemies: Enemy[];
  private readonly professor: Professor | null; // null — уровень без экзамена (финал)
  private readonly quiz: QuizController | null;
  private readonly fivesList: FiveEntity[];
  private readonly checkpoints: CheckpointEntity[];
  private effects: FlashEffect[] = [];
  private particles: Particle[] = [];
  private gate: Rect | null = null; // ворота слева: запирают игрока на арене
  private readonly theme: LevelTheme;

  private fives: number;         // сквозной счёт пятёрок за весь забег
  private fivesTowardLife = 0;   // прогресс до бонусной жизни
  private diplomaTaken = false;

  private runTime: number;       // сквозное время забега, сек
  private runTimeFlushT = 0;     // аккумулятор периодического сохранения

  private camX = 2.5;
  private camY = 5;

  private time = 0;
  private paused = false;
  private ended = false;
  private rafId = 0;
  private lastTs = 0;
  private lastHud: HudState = {
    lives: -1, fives: -1, bossHp: null, timeSec: -1, quiz: null,
  };
  private lastQuizVersion = -1;

  constructor(
    canvas: HTMLCanvasElement,
    levelNumber: number,
    cb: GameCallbacks,
  ) {
    this.cb = cb;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D недоступен');
    this.ctx = ctx;

    this.level = getLevel(levelNumber);
    this.theme = getTheme(this.level.theme);

    // Препятствия — просто твёрдый декор (урона не наносят)
    this.solids = [...this.level.platforms, ...this.level.obstacles];

    this.player = new Player({ x: 0, y: 1 });
    this.enemies = this.level.enemies.map((s) => new Enemy(s));
    const arena = this.level.arena;
    this.professor = arena ? new Professor(arena) : null;
    this.quiz = arena ? new QuizController(arena, QUESTIONS[arena.level] ?? []) : null;
    if (arena) preloadProfessor(arena.level); // PNG-моделька, если она есть
    this.fivesList = this.level.fives.map((f) => ({ ...f, taken: false }));
    this.checkpoints = this.level.checkpoints.map((x) => ({ x, active: false }));
    this.fives = getFives();     // счёт продолжается с прошлых уровней
    this.runTime = getRunTime(); // и время забега тоже
  }

  start(): void {
    // Отладочный доступ из консоли браузера (например, телепорт к боссу)
    (window as unknown as Record<string, unknown>).__examsGame = this;
    this.input.attach();
    this.lastTs = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min((ts - this.lastTs) / 1000, 0.05); // защита от скачков dt
      this.lastTs = ts;
      if (!this.paused && !this.ended) this.update(dt);
      this.render();
      this.emitHud();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.input.detach();
    this.flushRunTime(); // не терять секунды при смене уровня/выходе в меню
  }

  /** Сохранить накопленное время забега в localStorage. */
  private flushRunTime(): void {
    setRunTime(this.runTime);
    this.runTimeFlushT = 0;
  }

  setPaused(p: boolean): void {
    this.paused = p;
    this.lastTs = performance.now(); // чтобы после паузы не было гигантского dt
  }

  // ================== ЛОГИКА ==================

  private update(dt: number): void {
    this.time += dt;
    const p = this.player;

    // Таймер забега: тикает только здесь, а update() не вызывается на паузе
    // и после конца уровня — пауза и меню время не копят.
    this.runTime += dt;
    this.runTimeFlushT += dt;
    if (this.runTimeFlushT >= 2) this.flushRunTime();

    p.update(dt, this.input, this.solids);

    this.updateEnemies(dt);
    this.updateCollectables();
    this.updateCheckpoints();
    this.updateQuiz(dt);
    this.updateEffects(dt);

    // Диплом в конце финального коридора
    const d = this.level.diploma;
    if (d && !this.diplomaTaken && overlaps(p, { x: d.x, y: d.y, w: 0.9, h: 0.7 })) {
      this.diplomaTaken = true;
      this.effects.push({ x: d.x, y: d.y, t: 0.3, color: COLORS.five });
      this.burst(d.x, d.y, COLORS.five);
      this.ended = true;
      this.flushRunTime(); // финальное время забега — на экран диплома
      this.cb.onDiploma();
      return;
    }

    // Падение в пропасть — потеря жизни и возврат на чекпоинт
    if (p.y < DEATH_Y) {
      p.lives--;
      this.punishDeath();
      if (p.lives > 0) p.respawnAtCheckpoint();
    }

    if (p.lives <= 0 && !this.ended) {
      this.ended = true;
      this.flushRunTime();
      this.cb.onGameOver();
    }

    // Камера плавно следует за игроком в пределах уровня
    const targetX = clamp(p.x, 2.5, this.level.camMaxX);
    const targetY = clamp(p.y + 1, 5, 9);
    const k = Math.min(dt * 6, 1);
    this.camX += (targetX - this.camX) * k;
    this.camY += (targetY - this.camY) * k;
  }

  /** Любая потеря жизни отнимает часть собранных пятёрок. */
  private punishDeath(): void {
    this.fives = Math.max(0, this.fives - FIVES_DEATH_PENALTY);
    setFives(this.fives);
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    this.enemies = this.enemies.filter((e) => !e.update(dt));
    for (const e of this.enemies) {
      if (e.dead || !overlaps(p, e)) continue;
      if (p.isStomping(e)) {
        e.squash();       // прыжок сверху — враг сплющен
        p.bounce();
      } else if (p.hurt(e.x)) {
        this.punishDeath();
        if (p.lives <= 0) return; // смерть обработается ниже в update()
      }
    }
  }

  private updateCollectables(): void {
    const p = this.player;

    for (const f of this.fivesList) {
      if (f.taken || !overlaps(p, { ...f, w: 0.5, h: 0.5 })) continue;
      f.taken = true;
      this.fives++;
      setFives(this.fives); // счёт сквозной — сохраняем сразу
      this.effects.push({ x: f.x, y: f.y, t: 0.3, color: COLORS.five });
      this.burst(f.x, f.y, COLORS.five);
      if (++this.fivesTowardLife >= FIVES_PER_LIFE) {
        this.fivesTowardLife = 0;
        p.addLife();
      }
    }
  }

  private updateCheckpoints(): void {
    const p = this.player;
    for (const c of this.checkpoints) {
      if (!c.active && Math.abs(p.x - c.x) < 0.6 && p.y < 2.5) {
        c.active = true;
        p.respawn = { x: c.x, y: 1.2 };
      }
    }
  }

  private updateQuiz(dt: number): void {
    const p = this.player;
    const prof = this.professor;
    const quiz = this.quiz;
    const arena = this.level.arena;
    if (!prof || !quiz || !arena) return; // финальный коридор — экзамена нет

    // Игрок пересёк порог арены — экзамен начинается
    if (!prof.active && p.x > arena.xLeft + 0.5) {
      prof.activate();
      quiz.start();

      // Запираем игрока на арене: ворота слева (справа стена уже есть).
      // Выйти можно только победив (смена сцены) или проиграв (рестарт уровня).
      this.gate = { x: arena.xLeft, y: 3, w: 0.5, h: 6 };
      this.solids.push(this.gate);
    }

    // Ответ игрока (прыжком на платформу А/Б/В)
    const result = quiz.update(dt, p);
    if (result === 'correct') {
      // Верно: профессор теряет 1 HP
      prof.damage();
      this.effects.push({ x: prof.x, y: prof.y, t: 0.3, color: COLORS.answer });
      this.burst(prof.x, prof.y, COLORS.answer);
      if (prof.state === 'dead') quiz.stop(); // экзамен окончен — оверлей прячем
    } else if (result === 'wrong') {
      // Неверно: профессор восстанавливает 1 HP, на арену выходит двойка
      prof.heal();
      this.effects.push({ x: prof.x, y: prof.y, t: 0.3, color: COLORS.answerWrong });
      this.burst(prof.x, prof.y, COLORS.answerWrong);
      this.spawnArenaDvoyka(arena.xLeft);
    }

    if (prof.update(dt) && !this.ended) {
      this.ended = true;
      this.flushRunTime();
      this.cb.onVictory();
    }
  }

  /**
   * Двойка-штраф за неверный ответ: выбегает на пол арены и патрулирует
   * под платформами. Живых двоек одновременно не больше MAX_ARENA_DVOYKAS.
   */
  private spawnArenaDvoyka(xLeft: number): void {
    const alive = this.enemies.filter(
      (e) => e.kind === 'dvoyka' && !e.dead && e.x > xLeft,
    ).length;
    if (alive >= MAX_ARENA_DVOYKAS) return;

    const x = xLeft + 4 + Math.random() * 8; // случайная точка на полу арены
    // Маршрут патруля обрезаем краями арены (стены врагов не останавливают)
    const ax = Math.max(xLeft + 1, x - 5) - x;
    const bx = Math.min(xLeft + 15, x + 5) - x;
    this.enemies.push(new Enemy({
      kind: 'dvoyka', x, y: 0.9, ax, ay: 0, bx, by: 0, speed: 2.5,
    }));
    this.effects.push({ x, y: 0.9, t: 0.3, color: COLORS.dvoyka });
    this.burst(x, 0.9, COLORS.dvoyka);
  }

  private updateEffects(dt: number): void {
    this.effects = this.effects.filter((e) => (e.t -= dt) > 0);
    this.particles = this.particles.filter((p) => {
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 8 * dt; // лёгкая гравитация — искры оседают
      return p.t > 0;
    });
  }

  /** Салют из искр в точке подбора. */
  private burst(x: number, y: number, color: string): void {
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
      const sp = 2 + Math.random() * 2.5;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp + 1.5,
        t: 0.45 + Math.random() * 0.2,
        color,
      });
    }
  }

  private emitHud(): void {
    const prof = this.professor;
    const quizV = this.quiz?.uiState().version ?? -1;
    const l = this.lastHud;
    const lives = Math.max(this.player.lives, 0);
    const bossHp = prof && prof.active ? prof.hp : null;
    const timeSec = Math.floor(this.runTime);

    if (
      lives !== l.lives || this.fives !== l.fives || bossHp !== l.bossHp ||
      timeSec !== l.timeSec || quizV !== this.lastQuizVersion
    ) {
      this.lastQuizVersion = quizV;
      this.lastHud = {
        lives, fives: this.fives, bossHp, timeSec,
        quiz: this.quiz ? this.quiz.uiState() : null,
      };
      this.cb.onHud(this.lastHud);
    }
  }

  // ================== РЕНДЕР ==================

  private sx(wx: number): number { return (wx - this.camX) * UNIT + CANVAS_W / 2; }
  private sy(wy: number): number { return CANVAS_H / 2 - (wy - this.camY) * UNIT; }

  private visible(r: Rect): boolean {
    return Math.abs(r.x - this.camX) < VIEW_W / 2 + r.w &&
           Math.abs(r.y - this.camY) < VIEW_H / 2 + r.h;
  }

  private render(): void {
    const ctx = this.ctx;

    // Фон уровня: стена кабинета, окна, доски с формулами (параллакс)
    drawBackground(ctx, this.theme, this.camX, this.camY, this.time);

    // Платформы и земля
    for (const pl of this.level.platforms) {
      if (!this.visible(pl)) continue;
      const left = this.sx(pl.x) - (pl.w * UNIT) / 2;
      const top = this.sy(pl.y) - (pl.h * UNIT) / 2;
      if (pl.h >= 1) {
        spr.drawGround(ctx, left, top, pl.w * UNIT, pl.h * UNIT,
          pl.x - pl.w / 2, this.theme);
      } else {
        spr.drawPlatform(ctx, left, top, pl.w * UNIT, pl.h * UNIT, this.theme);
      }
    }

    // Ворота арены (появляются при входе к боссу — игрок заперт)
    if (this.gate) {
      spr.drawGate(ctx, this.sx(this.gate.x), this.sy(this.gate.y),
        this.gate.w * UNIT, this.gate.h * UNIT);
    }

    this.renderObstacles();
    this.renderCheckpoints();
    this.renderCollectables();
    this.renderEnemies();
    this.renderQuizArena();

    // Вспышки подбора (замена звука по ТЗ)
    for (const e of this.effects) {
      ctx.globalAlpha = e.t / 0.3;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(this.sx(e.x), this.sy(e.y), (1 - e.t / 0.3) * 0.6 * UNIT, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Искры-частицы
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(p.t / 0.25, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(this.sx(p.x), this.sy(p.y), 0.05 * UNIT, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    this.renderPlayer();
  }

  private renderObstacles(): void {
    const ctx = this.ctx;
    for (const o of this.level.obstacles) {
      if (!this.visible(o)) continue;
      const px = this.sx(o.x);
      const py = this.sy(o.y);
      const w = o.w * UNIT;
      const h = o.h * UNIT;
      if (o.kind === 'desk') spr.drawDesk(ctx, px, py, w, h);
      else if (o.kind === 'bench') spr.drawBench(ctx, px, py, w, h);
      else spr.drawBooks(ctx, px, py, w, h);
    }
  }

  private renderCheckpoints(): void {
    for (const c of this.checkpoints) {
      if (!this.visible({ x: c.x, y: 1.2, w: 1, h: 1.6 })) continue;
      spr.drawCheckpoint(this.ctx, this.sx(c.x), this.sy(1.75), this.sy(0.5),
        c.active, this.time);
    }
  }

  private renderCollectables(): void {
    const ctx = this.ctx;
    const bob = Math.sin(this.time * 3) * 0.08; // покачивание вверх-вниз

    for (const f of this.fivesList) {
      if (f.taken || !this.visible({ x: f.x, y: f.y, w: 0.5, h: 0.5 })) continue;
      spr.drawFive(ctx, this.sx(f.x), this.sy(f.y + bob), this.time, f.x);
    }

    const d = this.level.diploma;
    if (d) {
      // Праздничный пьедестал (рисуется и после подбора диплома)
      spr.drawPedestal(ctx, this.sx(d.x), this.sy(0.5), 0.9 * UNIT);
      if (!this.diplomaTaken) {
        spr.drawDiploma(ctx, this.sx(d.x), this.sy(d.y + bob), this.time);
      }
    }
  }

  private renderEnemies(): void {
    const ctx = this.ctx;
    for (const e of this.enemies) {
      if (!this.visible(e)) continue;
      const px = this.sx(e.x);
      const py = this.sy(e.y);
      const w = e.w * UNIT;
      const h = e.h * UNIT;
      const pose = { facing: e.facing, time: this.time };
      if (e.kind === 'dvoyka') spr.drawDvoyka(ctx, px, py, w, h, e.dead, pose);
      else if (e.kind === 'nk') spr.drawNk(ctx, px, py, w, h, e.dead, pose);
      else spr.drawFormula(ctx, px, py, w, h, e.dead, pose);
    }
  }

  /** Арена-экзамен: кафедра с профессором и карточки вариантов А/Б/В. */
  private renderQuizArena(): void {
    const arena = this.level.arena;
    const prof = this.professor;
    const quiz = this.quiz;
    if (!arena || !prof || !quiz) return;

    const ctx = this.ctx;
    const lecternPx = this.sx(arena.lectern.x);
    const lecternPy = this.sy(arena.lectern.y);
    const arenaVisible = this.visible({
      x: arena.lectern.x, y: arena.lectern.y, w: 4, h: 5,
    });

    if (arenaVisible) {
      // Профессор (PNG-моделька или заглушка), затем кафедра поверх —
      // преподаватель стоит ЗА трибуной.
      if (!(prof.state === 'dead' && prof.deadTimer <= 0)) {
        // При поражении НЕ затухает — вместо смерти показываем анимацию
        // «ошалел» (спиральные глаза + звёздочки) в drawProfessorPlaceholder.
        const img = getProfessor(arena.level);
        if (img && prof.state !== 'dead') {
          // Пиксель-арт: без сглаживания, масштаб по высоте с сохранением пропорций
          const ph = prof.h * UNIT;
          const pw = (img.width / img.height) * ph;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            img,
            this.sx(prof.x) - pw / 2,
            this.sy(prof.y) - ph / 2,
            pw, ph,
          );
          ctx.imageSmoothingEnabled = true;
        } else {
          spr.drawProfessorPlaceholder(
            ctx, this.sx(prof.x), this.sy(prof.y),
            prof.w * UNIT, prof.h * UNIT,
            arena.level, this.time, prof.state, prof.flash,
          );
        }
        ctx.globalAlpha = 1;
      }
      spr.drawLectern(ctx, lecternPx, lecternPy);
    }

    // Карточки вариантов над платформами (только пока идёт вопрос/результат)
    const ui = quiz.uiState();
    if (ui.phase !== 'asking' && ui.phase !== 'resolving') return;
    const letters = ['А', 'Б', 'В'];
    for (let i = 0; i < arena.answerPlatforms.length; i++) {
      const plat = arena.answerPlatforms[i];
      const cardY = plat.y + plat.h / 2 + 0.9;
      if (!this.visible({ x: plat.x, y: cardY, w: 1, h: 1 })) continue;
      const highlight =
        ui.phase === 'resolving'
          ? (i === ui.correctIndex ? 'correct'
            : i === ui.chosenIndex ? 'wrong' : null)
          : null;
      spr.drawOptionCard(
        ctx, this.sx(plat.x), this.sy(cardY), letters[i],
        quiz.armedIndex === i,
        Math.min(quiz.confirmT / QUIZ_CONFIRM_TIME, 1),
        highlight,
      );
    }
  }

  private renderPlayer(): void {
    const p = this.player;
    // Мигание в неуязвимости: полупрозрачность каждый второй «тик»
    const blink = p.invincible > 0 && Math.floor(p.invincible * 10) % 2 === 0;
    const px = this.sx(p.x);
    const py = this.sy(p.y);
    // Спрайт крупнее хитбокса физики (иначе сбились бы прыжки между
    // платформами уровней) — масштабируем от точки стопы, чтобы ноги
    // не «утопали» в платформе при увеличении.
    const ctx = this.ctx;
    const feetY = py + 40;
    ctx.save();
    ctx.translate(px, feetY);
    ctx.scale(PLAYER_VISUAL_SCALE, PLAYER_VISUAL_SCALE);
    ctx.translate(-px, -feetY);
    spr.drawPlayer(ctx, px, py, {
      facing: p.facing,
      running: p.grounded && Math.abs(p.vx) > 0.1,
      grounded: p.grounded,
      rising: p.vy > 0.5,
      time: this.time,
      alpha: blink ? 0.35 : 1,
    });
    ctx.restore();
  }
}
