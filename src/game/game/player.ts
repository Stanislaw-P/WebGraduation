// Игрок: движение, прыжок, столкновения с твёрдой геометрией,
// урон / отброс / неуязвимость. Портировано из PlayerController.cs.

import {
  GRAVITY, INVINCIBLE_TIME, JUMP_SPEED, KNOCKBACK_TIME,
  KNOCKBACK_X, KNOCKBACK_Y, MAX_FALL, MAX_LIVES, MOVE_SPEED, STOMP_BOUNCE,
} from './constants';
import { Input } from './input';
import { overlaps } from './types';
import type { Rect, Vec2 } from './types';

/** Твёрдый объект: платформа (безопасная) или препятствие (ранит сбоку/снизу). */
export interface Solid extends Rect { damaging?: boolean }

export class Player implements Rect {
  x: number;
  y: number;
  readonly w = 0.5;   // 60 px при 120 px/юнит — по ТЗ
  readonly h = 0.67;  // 80 px

  vx = 0;
  vy = 0;
  grounded = false;
  facing = 1;

  lives = MAX_LIVES;
  invincible = 0;     // сек оставшейся неуязвимости (мигание)
  knockback = 0;      // сек без управления после урона
  respawn: Vec2;      // точка возрождения (последний чекпоинт)

  private prevJump = false;

  constructor(spawn: Vec2) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.respawn = { ...spawn };
  }

  update(dt: number, input: Input, solids: Solid[]): void {
    // --- Управление (заблокировано во время отброса) ---
    if (this.knockback > 0) {
      this.knockback -= dt;
    } else {
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      this.vx = dir * MOVE_SPEED;
      if (dir !== 0) this.facing = dir;

      // Прыжок по фронту нажатия, только с земли
      if (input.jump && !this.prevJump && this.grounded) {
        this.vy = JUMP_SPEED;
      }
    }
    this.prevJump = input.jump;

    // --- Гравитация ---
    this.vy = Math.max(this.vy - GRAVITY * dt, -MAX_FALL);
    if (this.invincible > 0) this.invincible -= dt;

    // Позиция до движения — по ней определяем, с какой стороны пришли
    const prevY = this.y;
    const SKIN = 0.05; // допуск: касание тоньше этого не считается столкновением

    // --- Движение по X с выталкиванием из твёрдых объектов ---
    this.x += this.vx * dt;
    for (const s of solids) {
      if (!overlaps(this, s)) continue;
      // Едва задеваем по вертикали (стоим на самом краю) — это не боковой удар
      const penY = (s.h + this.h) / 2 - Math.abs(this.y - s.y);
      if (penY < SKIN) continue;
      const push = (s.w + this.w) / 2;
      this.x = this.x < s.x ? s.x - push : s.x + push;
      if (s.damaging) this.hurt(s.x); // боковое касание парты/книг — урон
      this.vx = 0;
    }

    // --- Движение по Y ---
    this.y += this.vy * dt;
    this.grounded = false;
    for (const s of solids) {
      if (!overlaps(this, s)) continue;
      const top = s.y + s.h / 2;
      const bottom = s.y - s.h / 2;

      if (this.vy <= 0 && prevY - this.h / 2 >= top - SKIN) {
        // Падали и в прошлом кадре были НАД платформой → приземление.
        // (Раньше сторона определялась по центрам, и при быстром падении на
        // тонкую платформу игрока «выбрасывало» вбок — это и был баг.)
        this.y = top + this.h / 2;
        this.vy = 0;
        this.grounded = true;
      } else if (this.vy > 0 && prevY + this.h / 2 <= bottom + SKIN) {
        // Прыгали и были ПОД платформой → удар головой
        this.y = bottom - this.h / 2;
        this.vy = 0;
        if (s.damaging) this.hurt(s.x);
      } else {
        // Глубокое боковое пересечение — мягко выталкиваем по X
        const push = (s.w + this.w) / 2;
        this.x = this.x < s.x ? s.x - push : s.x + push;
        this.vx = 0;
      }
    }
  }

  /**
   * Получить урон от объекта в точке fromX.
   * Возвращает true, если урон засчитан (не в неуязвимости).
   */
  hurt(fromX: number): boolean {
    if (this.invincible > 0 || this.lives <= 0) return false;
    this.lives--;
    this.invincible = INVINCIBLE_TIME;
    this.knockback = KNOCKBACK_TIME;
    this.vx = (this.x < fromX ? -1 : 1) * KNOCKBACK_X; // отброс от источника
    this.vy = KNOCKBACK_Y;
    return true;
  }

  /** Отскок после прыжка на врага/босса. */
  bounce(): void {
    this.vy = STOMP_BOUNCE;
  }

  /** Возрождение на чекпоинте (падение в пропасть). */
  respawnAtCheckpoint(): void {
    this.x = this.respawn.x;
    this.y = this.respawn.y;
    this.vx = 0;
    this.vy = 0;
    this.knockback = 0;
    this.invincible = 1.5;
  }

  addLife(): void {
    this.lives = Math.min(this.lives + 1, MAX_LIVES);
  }

  /**
   * «Прыжок сверху»: игрок падает ИЛИ его низ выше центра цели.
   * Правило щедрое сознательно: контакт сверху никогда не ранит игрока
   * (старая строгая проверка скорости иногда «не засчитывала» прыжок
   * на летающих врагов, и урон проходил игроку).
   */
  isStomping(target: Rect): boolean {
    return this.vy < -0.1 || this.y - this.h / 2 > target.y;
  }
}
