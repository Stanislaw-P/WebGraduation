// Игровой экран: канвас + HUD + тач-кнопки + меню паузы.
// Создаёт и уничтожает экземпляр Game; перезапуск уровня — через смену key
// у этого компонента в ExamsGame.

import { useEffect, useRef, useState } from 'react';
import { Game } from '../game/game';
import type { HudState } from '../game/game';
import { MAX_LIVES } from '../game/constants';
import { HUD } from './HUD';
import { QuizOverlay } from './QuizOverlay';
import { TouchControls } from './TouchControls';

interface Props {
  level: number;
  onGameOver(): void;
  onVictory(): void;
  onDiploma(): void;
  onRestart(): void;
  onExit(): void;
}

export function GameScreen({ level, onGameOver, onVictory, onDiploma, onRestart, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<HudState>({
    lives: MAX_LIVES, fives: 0, bossHp: null, timeSec: 0, quiz: null,
  });
  const [paused, setPaused] = useState(false);

  // Колбэки в ref, чтобы не пересоздавать игру при их изменении
  const cbRef = useRef({ onGameOver, onVictory, onDiploma });
  cbRef.current = { onGameOver, onVictory, onDiploma };

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new Game(canvasRef.current, level, {
      onHud: setHud,
      onGameOver: () => cbRef.current.onGameOver(),
      onVictory: () => cbRef.current.onVictory(),
      onDiploma: () => cbRef.current.onDiploma(),
    });
    gameRef.current = game;
    game.start();
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [level]);

  const togglePause = (p: boolean) => {
    setPaused(p);
    gameRef.current?.setPaused(p);
  };

  return (
    <div className="game-screen">
      <canvas ref={canvasRef} className="game-canvas" />
      <HUD hud={hud} onPause={() => togglePause(true)} />
      <QuizOverlay quiz={hud.quiz} level={level} />

      {/* Кнопки управления скрываются на паузе (по ТЗ) */}
      {!paused && (
        <TouchControls onButton={(btn, down) => gameRef.current?.input.setTouch(btn, down)} />
      )}

      {paused && (
        <div className="overlay">
          <div className="menu-box">
            <h2>Пауза</h2>
            <button className="menu-btn" onClick={() => togglePause(false)}>Продолжить</button>
            <button className="menu-btn" onClick={onRestart}>Заново</button>
            <button className="menu-btn secondary" onClick={onExit}>В меню</button>
          </div>
        </div>
      )}
    </div>
  );
}
