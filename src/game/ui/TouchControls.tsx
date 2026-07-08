// Экранные кнопки управления: ← → и прыжок.
// PointerDown/Up/Leave — аналог обработчиков из Unity UIController.

import type { ReactNode } from 'react';
import type { TouchBtn } from '../game/input';

interface Props {
  onButton(btn: TouchBtn, down: boolean): void;
}

function ControlButton({
  btn, className, children, onButton,
}: Props & { btn: TouchBtn; className: string; children: ReactNode }) {
  return (
    <button
      className={`touch-btn ${className}`}
      onPointerDown={(e) => { e.preventDefault(); onButton(btn, true); }}
      onPointerUp={() => onButton(btn, false)}
      onPointerLeave={() => onButton(btn, false)}
      onPointerCancel={() => onButton(btn, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export function TouchControls({ onButton }: Props) {
  return (
    <div className="touch-controls">
      <div className="touch-left">
        <ControlButton btn="left" className="" onButton={onButton}>◀</ControlButton>
        <ControlButton btn="right" className="" onButton={onButton}>▶</ControlButton>
      </div>
      <div className="touch-right">
        <ControlButton btn="jump" className="jump" onButton={onButton}>▲</ControlButton>
      </div>
    </div>
  );
}
