import { COURSES } from '../game/constants';
import { formatTime, gradeFor } from '../game/progress';

type ScoreStatus = 'idle' | 'saving' | 'saved' | 'error';

export function MainMenu({
  lastTime,
  nameError,
  playerName,
  onNameChange,
  onPlay,
}: {
  lastTime: number;
  nameError: string;
  playerName: string;
  onNameChange(value: string): void;
  onPlay(): void;
}) {
  return (
    <div className="screen menu-screen">
      <div className="title-emoji">🎓</div>
      <h1 className="game-title">Экзамены</h1>
      <p className="subtitle">Приключения студента-математика</p>
      <label className="player-name-field">
        <span>Имя игрока</span>
        <input
          value={playerName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Введите имя"
          maxLength={30}
        />
        {nameError && <small>{nameError}</small>}
      </label>
      <button className="menu-btn big" onClick={onPlay}>Играть</button>
      {lastTime > 0 && (
        <p className="last-time">Последнее прохождение: {formatTime(lastTime)}</p>
      )}
    </div>
  );
}

export function GameOverScreen({ onRetry, onMenu }: {
  onRetry(): void;
  onMenu(): void;
}) {
  return (
    <div className="screen gameover-screen">
      <div className="title-emoji">📉</div>
      <h1>Отчислен!</h1>
      <p className="subtitle">Жизни закончились...</p>
      <button className="menu-btn big" onClick={onRetry}>Повторить уровень</button>
      <button className="menu-btn secondary" onClick={onMenu}>В главное меню</button>
    </div>
  );
}

export function VictoryScreen({ level, onNext }: {
  level: number;
  onNext(): void;
}) {
  const ceremony = level >= 4;

  return (
    <div className="screen victory-screen">
      <div className="title-emoji">📚</div>
      <h1>{COURSES[level - 1]} сдан!</h1>
      <p className="subtitle">
        {ceremony
          ? `Курс пройден. Все экзамены сданы - осталось забрать диплом!`
          : `Курс пройден. Впереди новый курс!`}
      </p>
      <button className="menu-btn big" onClick={onNext}>
        {ceremony ? 'На вручение диплома' : 'Далее'}
      </button>
    </div>
  );
}

export function DiplomaScreen({
  fives,
  scoreError,
  scoreStatus,
  time,
  onAgain,
}: {
  fives: number;
  scoreError: string;
  scoreStatus: ScoreStatus;
  time: number;
  onAgain(): void;
}) {
  const scoreMessage = {
    idle: '',
    saving: 'Сохраняем результат...',
    saved: 'Результат сохранен в таблице лидеров',
    error: scoreError || 'Не удалось сохранить результат',
  }[scoreStatus];

  return (
    <div className="screen diploma-screen">
      <div className="diploma">🎓</div>
      <h1>Вы закончили универ на «{gradeFor(fives)}»!</h1>
      <p className="subtitle">Собрано пятерок за все обучение: {fives}</p>
      <p className="subtitle">Диплом получен за {formatTime(time)}</p>
      {scoreMessage && <p className={`score-save-message is-${scoreStatus}`}>{scoreMessage}</p>}
      <p className="screenshot-note">Сделайте скриншот этого экрана, чтобы сохранить результат.</p>
      <button className="menu-btn big" onClick={onAgain}>Играть снова</button>
    </div>
  );
}
