// HUD: счётчик пятёрок, сердечки-жизни, HP профессора, таймер, кнопка паузы.

import type { HudState } from '../game/game';
import { BOSS_HP, MAX_LIVES } from '../game/constants';
import { formatTime } from '../game/progress';

interface Props {
  hud: HudState;
  onPause(): void;
}

export function HUD({ hud, onPause }: Props) {
  return (
    <div className="hud">
      <div className="hud-left">
        <div className="hud-score">Оценки: {hud.fives}</div>
        <div className="hud-lives">
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <span key={i} className={`heart ${i < hud.lives ? '' : 'lost'}`} />
          ))}
        </div>
      </div>
      <div className="hud-right">
        <button className="pause-btn" onClick={onPause}>❚❚</button>
        <div className="hud-time">{formatTime(hud.timeSec)}</div>
        {hud.bossHp !== null && (
          <div className="hud-boss">
            {Array.from({ length: BOSS_HP }, (_, i) => (
              <span key={i} className={`boss-hp ${i < hud.bossHp! ? '' : 'lost'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
