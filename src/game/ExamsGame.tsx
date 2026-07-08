import { type ReactNode, useState } from 'react';
import { TOTAL_LEVELS } from './game/constants';
import {
  getFives,
  getLastRunTime,
  getRunTime,
  resetFives,
  resetRunTime,
  setLastRunTime,
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

type ScoreStatus = 'idle' | 'saving' | 'saved' | 'error';

const playerNameKey = 'exams.playerName';

async function submitGameScore(playerName: string, timeSec: number, fives: number): Promise<void> {
  const response = await fetch('/api/game-scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerName,
      timeSec,
      fives,
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || 'Не удалось сохранить результат');
  }
}

export default function ExamsGame() {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const [runId, setRunId] = useState(0);
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem(playerNameKey) ?? '';
    } catch {
      return '';
    }
  });
  const [nameError, setNameError] = useState('');
  const [scoreStatus, setScoreStatus] = useState<ScoreStatus>('idle');
  const [scoreError, setScoreError] = useState('');

  const startLevel = (n: number) => {
    setRunId((r) => r + 1);
    setScreen({ kind: 'level', n });
  };

  const handlePlay = () => {
    const normalizedName = playerName.trim().replace(/\s+/g, ' ');

    if (normalizedName.length < 2) {
      setNameError('Введите имя от 2 символов');
      return;
    }

    setPlayerName(normalizedName);
    setNameError('');
    setScoreStatus('idle');
    setScoreError('');

    try {
      localStorage.setItem(playerNameKey, normalizedName);
    } catch {
      // The game can still run when localStorage is unavailable.
    }

    resetFives();
    resetRunTime();
    startLevel(1);
  };

  const handleDiploma = () => {
    const time = getRunTime();
    const fives = getFives();

    setLastRunTime(time);
    setScreen({ kind: 'diploma' });
    setScoreStatus('saving');
    setScoreError('');

    void submitGameScore(playerName, time, fives)
      .then(() => setScoreStatus('saved'))
      .catch((error) => {
        setScoreStatus('error');
        setScoreError(error instanceof Error ? error.message : 'Не удалось сохранить результат');
      });
  };

  let content: ReactNode;

  switch (screen.kind) {
    case 'menu':
      content = (
        <MainMenu
          lastTime={getLastRunTime()}
          nameError={nameError}
          playerName={playerName}
          onNameChange={(value) => {
            setPlayerName(value);
            if (nameError) setNameError('');
          }}
          onPlay={handlePlay}
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
          onDiploma={handleDiploma}
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
          onNext={() => (screen.n >= TOTAL_LEVELS ? handleDiploma() : startLevel(screen.n + 1))}
        />
      );
      break;

    case 'diploma':
      content = (
        <DiplomaScreen
          fives={getFives()}
          scoreError={scoreError}
          scoreStatus={scoreStatus}
          time={getRunTime()}
          onAgain={() => setScreen({ kind: 'menu' })}
        />
      );
      break;
  }

  return (
    <div className="exams-root">
      <div className="exams-frame">{content}</div>
    </div>
  );
}
