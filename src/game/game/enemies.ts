// Враги: «двойка», «формула», «НК». Патрулируют между двумя точками,
// умирают от прыжка сверху (сплющиваются). Портировано из Enemy.cs.

import type { EnemyKind, EnemySpawn, Rect, Vec2 } from './types';

const SIZES: Record<EnemyKind, { w: number; h: number }> = {
  dvoyka:  { w: 0.8, h: 0.8 },
  formula: { w: 1.5, h: 0.55 },
  nk:      { w: 0.9, h: 0.9 },
};

export class Enemy implements Rect {
  readonly kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;

  dead = false;
  deadTimer = 0;      // сплющенный труп исчезает через 0.4 сек
  facing = 1;         // направление взгляда (для отрисовки)

  private readonly a: Vec2;   // точки маршрута (абсолютные)
  private readonly b: Vec2;
  private readonly speed: number;
  private goingToB = true;

  constructor(s: EnemySpawn) {
    this.kind = s.kind;
    this.x = s.x;
    this.y = s.y;
    this.w = SIZES[s.kind].w;
    this.h = SIZES[s.kind].h;
    this.a = { x: s.x + s.ax, y: s.y + s.ay };
    this.b = { x: s.x + s.bx, y: s.y + s.by };
    this.speed = s.speed;
  }

  /** true — врага пора удалить из мира. */
  update(dt: number): boolean {
    if (this.dead) {
      this.deadTimer -= dt;
      return this.deadTimer <= 0;
    }

    // Движение к текущей цели маршрута, на месте — разворот
    const t = this.goingToB ? this.b : this.a;
    const dx = t.x - this.x;
    const dy = t.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.05) {
      this.goingToB = !this.goingToB;
    } else {
      const step = Math.min(this.speed * dt, dist);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      if (Math.abs(dx) > 0.01) this.facing = dx > 0 ? 1 : -1;
    }
    return false;
  }

  /** Смерть от прыжка сверху: сплющиваемся (замена анимации). */
  squash(): void {
    this.dead = true;
    this.deadTimer = 0.4;
    this.y -= this.h * 0.3;
    this.h *= 0.35;
  }
}
