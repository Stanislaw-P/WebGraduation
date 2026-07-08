// Оверлей экзамена: вопрос профессора и варианты А/Б/В.
// Панель в верхней трети экрана (действие на арене идёт ниже);
// pointer-events: none — не мешает кнопкам управления.

import { COURSES, PROF_NAMES } from '../game/constants';
import type { QuizUiState } from '../game/quiz';

interface Props {
  quiz: QuizUiState | null;
  level: number;
}

const LETTERS = ['А', 'Б', 'В'];

export function QuizOverlay({ quiz, level }: Props) {
  if (!quiz || quiz.phase === 'inactive') return null;

  if (quiz.phase === 'intro') {
    return (
      <div className="quiz-overlay">
        <div className="quiz-intro">Экзамен: {COURSES[level - 1]}!</div>
        {PROF_NAMES[level] && (
          <div className="quiz-prof">Принимает: {PROF_NAMES[level]}</div>
        )}
        <div className="quiz-hint">
          Прыгай на платформу с верным ответом и постой на ней
        </div>
      </div>
    );
  }

  const resolving = quiz.phase === 'resolving';
  return (
    <div className="quiz-overlay">
      {resolving && (
        <div className={`quiz-result ${quiz.lastResult}`}>
          {quiz.lastResult === 'correct'
            ? 'Верно! Профессор теряет здоровье'
            : 'Неверно! Профессор доволен, а к тебе бежит двойка…'}
        </div>
      )}
      <div className="quiz-question">{quiz.question}</div>
      <div className="quiz-options">
        {quiz.options.map((opt, i) => {
          const cls =
            resolving && i === quiz.correctIndex ? 'correct'
            : resolving && i === quiz.chosenIndex ? 'wrong'
            : '';
          return (
            <div key={i} className={`quiz-option ${cls}`}>
              <span className="quiz-letter">{LETTERS[i]}</span> {opt}
            </div>
          );
        })}
      </div>
    </div>
  );
}
