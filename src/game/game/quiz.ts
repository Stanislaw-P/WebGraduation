// Контроллер экзамена-квиза: очередь вопросов, выбор ответа прыжком
// на платформу, темп боя. Владелец — Game (см. updateQuiz в game.ts).
//
// Выбор ответа: игрок СТОИТ на платформе-ответе, пока не заполнится
// кольцо подтверждения (QUIZ_CONFIRM_TIME) — случайный прыжок через
// платформу ответ не засчитает. После ответа нужно сойти с платформ
// (mustDismount), иначе нельзя было бы отвечать, просто стоя на месте.

import { QUIZ_CONFIRM_TIME, QUIZ_INTRO_TIME, QUIZ_RESOLVE_DELAY } from './constants';
import type { QuizQuestion } from './questions';
import type { ArenaConfig, Rect } from './types';

export type QuizPhase = 'inactive' | 'intro' | 'asking' | 'resolving';
export type QuizResult = 'correct' | 'wrong';

/** Снимок состояния квиза для React-оверлея. */
export interface QuizUiState {
  phase: QuizPhase;
  question: string;
  options: [string, string, string];
  lastResult: QuizResult | null; // показывается в фазе 'resolving'
  correctIndex: number;          // подсветка верного варианта в 'resolving'
  chosenIndex: number;           // что выбрал игрок (для подсветки ошибки)
  version: number;               // растёт при каждом изменении — дешёвый дифф в emitHud
}

interface QuizPlayer extends Rect { grounded: boolean }

export class QuizController {
  /** Платформа, на которой стоит игрок (для кольца на канвасе). */
  armedIndex: number | null = null;
  /** Прогресс подтверждения 0..QUIZ_CONFIRM_TIME. */
  confirmT = 0;

  private phase: QuizPhase = 'inactive';
  private phaseT = 0;
  private current: QuizQuestion | null = null;
  private lastResult: QuizResult | null = null;
  private chosenIndex = -1;
  private mustDismount = false;
  private version = 0;

  private queue: QuizQuestion[] = [];
  private readonly arena: ArenaConfig;
  private readonly questions: QuizQuestion[];

  constructor(
    arena: ArenaConfig,
    questions: QuizQuestion[],
  ) {
    this.arena = arena;
    this.questions = questions;
  }

  /** Игрок вошёл на арену — интро, затем первый вопрос. */
  start(): void {
    if (this.phase !== 'inactive') return;
    this.phase = 'intro';
    this.phaseT = QUIZ_INTRO_TIME;
    this.version++;
  }

  /** Профессор побеждён — прячем оверлей. */
  stop(): void {
    this.phase = 'inactive';
    this.armedIndex = null;
    this.confirmT = 0;
    this.version++;
  }

  /**
   * Кадровое обновление. Возвращает результат ответа в кадр его фиксации,
   * иначе null.
   */
  update(dt: number, player: QuizPlayer): QuizResult | null {
    switch (this.phase) {
      case 'inactive':
        return null;

      case 'intro':
        this.phaseT -= dt;
        if (this.phaseT <= 0) this.nextQuestion();
        return null;

      case 'resolving':
        this.phaseT -= dt;
        if (this.phaseT <= 0) this.nextQuestion();
        return null;

      case 'asking': {
        const idx = this.platformUnderPlayer(player);

        // После прошлого ответа требуем сначала спрыгнуть с платформ
        if (this.mustDismount) {
          if (idx === null) this.mustDismount = false;
          return null;
        }

        if (idx === null) {
          this.armedIndex = null;
          this.confirmT = 0;
          return null;
        }
        if (idx !== this.armedIndex) {
          this.armedIndex = idx;
          this.confirmT = 0;
        }
        this.confirmT += dt;
        if (this.confirmT < QUIZ_CONFIRM_TIME || !this.current) return null;

        // Ответ зафиксирован
        const result: QuizResult =
          idx === this.current.correctIndex ? 'correct' : 'wrong';
        this.chosenIndex = idx;
        this.lastResult = result;
        this.phase = 'resolving';
        this.phaseT = QUIZ_RESOLVE_DELAY;
        this.armedIndex = null;
        this.confirmT = 0;
        this.mustDismount = true;
        this.version++;
        return result;
      }
    }
  }

  uiState(): QuizUiState {
    return {
      phase: this.phase,
      question: this.current?.text ?? '',
      options: this.current?.options ?? ['', '', ''],
      lastResult: this.phase === 'resolving' ? this.lastResult : null,
      correctIndex: this.current?.correctIndex ?? -1,
      chosenIndex: this.chosenIndex,
      version: this.version,
    };
  }

  /** Индекс платформы-ответа, на которой СТОИТ игрок, иначе null. */
  private platformUnderPlayer(p: QuizPlayer): number | null {
    if (!p.grounded) return null;
    const feet = p.y - p.h / 2;
    for (let i = 0; i < this.arena.answerPlatforms.length; i++) {
      const plat = this.arena.answerPlatforms[i];
      const top = plat.y + plat.h / 2;
      if (
        Math.abs(feet - top) < 0.15 &&
        Math.abs(p.x - plat.x) < (plat.w + p.w) / 2
      ) return i;
    }
    return null;
  }

  /** Следующий вопрос из перемешанной очереди (без повторов подряд). */
  private nextQuestion(): void {
    if (this.queue.length === 0) {
      this.queue = shuffle(this.questions);
      // Не задаём тот же вопрос два раза подряд после перетасовки
      if (this.queue.length > 1 && this.queue[this.queue.length - 1] === this.current) {
        this.queue.unshift(this.queue.pop()!);
      }
    }
    this.current = this.queue.pop() ?? null;
    this.chosenIndex = -1;
    this.phase = 'asking';
    this.armedIndex = null;
    this.confirmT = 0;
    this.version++;
  }
}

function shuffle<T>(src: readonly T[]): T[] {
  const a = [...src];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
