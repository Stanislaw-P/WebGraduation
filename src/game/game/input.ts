// Единое состояние ввода: клавиатура (для теста на ПК) + экранные кнопки.

export type TouchBtn = 'left' | 'right' | 'jump';

const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'];

export class Input {
  private kb = new Set<string>();
  private touch: Record<TouchBtn, boolean> = { left: false, right: false, jump: false };

  get left(): boolean {
    return this.touch.left || this.kb.has('ArrowLeft') || this.kb.has('KeyA');
  }
  get right(): boolean {
    return this.touch.right || this.kb.has('ArrowRight') || this.kb.has('KeyD');
  }
  get jump(): boolean {
    return this.touch.jump || this.kb.has('Space') || this.kb.has('ArrowUp') || this.kb.has('KeyW');
  }

  /** Экранные кнопки пишут сюда через PointerDown/Up. */
  setTouch(btn: TouchBtn, down: boolean): void {
    this.touch[btn] = down;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (GAME_KEYS.includes(e.code)) e.preventDefault(); // чтобы страница не скроллилась
    this.kb.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.kb.delete(e.code);
  };

  // Окно потеряло фокус — keyup уже не придёт, сбрасываем всё,
  // иначе клавиша «залипает» и игрок бежит сам по себе
  private onBlur = () => {
    this.kb.clear();
    this.touch = { left: false, right: false, jump: false };
  };

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
