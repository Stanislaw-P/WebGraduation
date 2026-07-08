// Экраны-меню: главное меню, Game Over, победа над боссом, диплом.
// Аналог сцен MainMenu / GameOver / Victory / FinalDiploma из Unity-версии.

import { COURSES, PROF_NAMES } from '../game/constants';
import { formatTime, gradeFor } from '../game/progress';

export function MainMenu({ lastTime, onPlay }: {
  lastTime: number;
  onPlay(): void;
}) {
  return (
    <div className="screen menu-screen">
      <div className="title-emoji">🎓</div>
      <h1 className="game-title">ЭКЗАМЕНЫ</h1>
      <p className="subtitle">Приключения студента-математика</p>
      <button className="menu-btn big" onClick={onPlay}>Играть</button>
      {lastTime > 0 && (
        <p className="last-time">⏱ Последнее прохождение: {formatTime(lastTime)}</p>
      )}
      <p className="credits">Создатель: Герман Тибилов</p>
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
      <p className="subtitle">Жизни закончились…</p>
      <button className="menu-btn big" onClick={onRetry}>Повторить уровень</button>
      <button className="menu-btn secondary" onClick={onMenu}>В главное меню</button>
    </div>
  );
}

export function VictoryScreen({ level, onNext }: {
  level: number;
  onNext(): void;
}) {
  // После 4-го курса боссов больше нет — впереди церемония вручения
  const ceremony = level >= 4;
  return (
    <div className="screen victory-screen">
      <div className="title-emoji">📚</div>
      <h1>{COURSES[level - 1]} сдан!</h1>
      <p className="subtitle">
        {ceremony
          ? `Профессор ${PROF_NAMES[level]} повержен. Все экзамены сданы — осталось забрать диплом!`
          : `Профессор ${PROF_NAMES[level]} повержен. Впереди новый курс!`}
      </p>
      <button className="menu-btn big" onClick={onNext}>
        {ceremony ? 'На вручение диплома' : 'Далее'}
      </button>
    </div>
  );
}

export function DiplomaScreen({ fives, time, onAgain }: {
  fives: number;
  time: number;
  onAgain(): void;
}) {
  return (
    <div className="screen diploma-screen">
      <div className="diploma">🎓</div>
      <h1>Вы закончили универ на «{gradeFor(fives)}»!</h1>
      <p className="subtitle">Собрано пятёрок за всё обучение: {fives}</p>
      <p className="subtitle">⏱ Диплом получен за {formatTime(time)}</p>
      <button className="menu-btn big" onClick={onAgain}>Играть снова</button>
    </div>
  );
}
