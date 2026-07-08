// Корневой компонент игры «Экзамены».
// Его достаточно отрендерить на любой странице вашего сайта: <ExamsGame />
// Управляет переключением экранов (аналог загрузки сцен в Unity GameManager).

import { type ReactNode, useState } from 'react';
import { TOTAL_LEVELS } from './game/constants';
import {
  getFives, getLastRunTime, getRunTime, resetFives, resetRunTime, setLastRunTime,
} from './game/progress';
import { GameScreen } from './ui/GameScreen';
import { DiplomaScreen, GameOverScreen, MainMenu, VictoryScreen } from './ui/screens';
import './styles.css';

type Screen =
  | { kind: 'menu' }
  | { kind: 'level'; n: number }
  | { kind: 'gameover'; n: number }
  | { kind: 'victory'; n: number }
  | { kind: 'diploma' };

export default function ExamsGame() {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const [runId, setRunId] = useState(0); // смена key → полный перезапуск уровня

  const startLevel = (n: number) => {
    setRunId((r) => r + 1);
    setScreen({ kind: 'level', n });
  };

  let content: ReactNode;
  switch (screen.kind) {
    case 'menu':
      content = (
        <MainMenu
          lastTime={getLastRunTime()}
          onPlay={() => {
            resetFives();   // новый забег — счёт пятёрок с нуля
            resetRunTime(); // и таймер прохождения тоже
            startLevel(1);
          }}
        />
      );
      break;

    case 'level':
      content = (
        <GameScreen
          key={`${screen.n}-${runId}`}
          level={screen.n}
          onGameOver={() => setScreen({ kind: 'gameover', n: screen.n })}
          onVictory={() => setScreen({ kind: 'victory', n: screen.n })}
          onDiploma={() => {
            setLastRunTime(getRunTime()); // рекорд последнего прохождения — в меню
            setScreen({ kind: 'diploma' });
          }}
          onRestart={() => startLevel(screen.n)}
          onExit={() => setScreen({ kind: 'menu' })}
        />
      );
      break;

    case 'gameover':
      content = (
        <GameOverScreen
          onRetry={() => startLevel(screen.n)}
          onMenu={() => setScreen({ kind: 'menu' })}
        />
      );
      break;

    case 'victory':
      content = (
        <VictoryScreen
          level={screen.n}
          onNext={() =>
            screen.n >= TOTAL_LEVELS
              ? setScreen({ kind: 'diploma' })
              : startLevel(screen.n + 1)
          }
        />
      );
      break;

    case 'diploma':
      content = (
        <DiplomaScreen
          fives={getFives()}
          time={getRunTime()}
          onAgain={() => setScreen({ kind: 'menu' })}
        />
      );
      break;
  }

  // Рамка с соотношением 9:16 — игра всегда портретная, по центру страницы
  return (
    <div className="exams-root">
      <div className="exams-frame">{content}</div>
    </div>
  );
}
