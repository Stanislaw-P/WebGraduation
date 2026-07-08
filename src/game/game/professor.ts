// Профессор-экзаменатор: мини-босс за кафедрой. Сам не атакует —
// весь бой ведёт квиз (quiz.ts): верный ответ ранит профессора,
// неверный лечит его и выпускает на арену «двойку».

import type { ArenaConfig, Rect } from './types';

export type ProfState = 'idle' | 'ask' | 'happy' | 'angry' | 'dead';

const EMOTE_TIME = 0.8; // сек эмоции (злость/радость) перед возвратом к вопросам

export class Professor implements Rect {
  x: number;
  y: number;
  w: number;
  h: number;

  hp: number;
  readonly maxHp: number;
  state: ProfState = 'idle'; // idle — пока игрок не вошёл на арену
  flash = 0;                 // белая вспышка после верного ответа
  deadTimer = 1.2;           // пауза перед экраном победы

  private emoteT = 0;

  constructor(cfg: ArenaConfig) {
    this.w = cfg.prof.w;
    this.h = cfg.prof.h;
    this.x = cfg.lectern.x;
    this.y = cfg.lectern.y + cfg.prof.h / 2; // стоит на балконе-кафедре
    this.hp = cfg.prof.hp;
    this.maxHp = cfg.prof.hp;
  }

  /** Игрок вошёл на арену — экзамен начинается. */
  activate(): void {
    if (this.state === 'idle') this.state = 'ask';
  }

  get active(): boolean {
    return this.state !== 'idle';
  }

  /** Верный ответ игрока: −1 HP, профессор злится. */
  damage(): void {
    if (this.state === 'dead' || this.state === 'idle') return;
    this.hp--;
    this.flash = 0.3;
    if (this.hp <= 0) {
      this.state = 'dead';
    } else {
      this.state = 'angry';
      this.emoteT = EMOTE_TIME;
    }
  }

  /** Неверный ответ: +1 HP (не выше максимума), профессор доволен. */
  heal(): void {
    if (this.state === 'dead' || this.state === 'idle') return;
    this.hp = Math.min(this.hp + 1, this.maxHp);
    this.state = 'happy';
    this.emoteT = EMOTE_TIME;
  }

  /** true — профессор побеждён и пауза после смерти истекла. */
  update(dt: number): boolean {
    this.flash = Math.max(0, this.flash - dt);

    if (this.state === 'angry' || this.state === 'happy') {
      this.emoteT -= dt;
      if (this.emoteT <= 0) this.state = 'ask';
    } else if (this.state === 'dead') {
      this.deadTimer -= dt;
      return this.deadTimer <= 0;
    }
    return false;
  }
}
