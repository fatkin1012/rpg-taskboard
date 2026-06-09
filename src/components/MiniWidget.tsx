import type { XPNotification } from '../types';
import XPBar from './XPBar';
import LevelBadge from './LevelBadge';

interface MiniWidgetProps {
  level: number;
  expInLevel: number;
  expForNext: number;
  progress: number;
  activeTaskCount: number;
  showLevelUp: boolean;
  notifications: XPNotification[];
}

export default function MiniWidget({
  level,
  expInLevel,
  expForNext,
  progress,
  activeTaskCount,
  showLevelUp,
  notifications,
}: MiniWidgetProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex-shrink-0">
        <LevelBadge level={level} showLevelUp={showLevelUp} />
      </div>

      <div className="flex-1 min-w-0">
        <XPBar
          progress={progress}
          expInLevel={expInLevel}
          expForNext={expForNext}
          level={level}
        />
      </div>

      <div className="flex-shrink-0 text-center">
        <span className="text-[7px] text-pixel-dim font-pixel block leading-tight">
          {activeTaskCount}
        </span>
        <span className="text-[5px] text-pixel-dim font-pixel block">
          QUESTS
        </span>
      </div>

      {/* XP Float notifications */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className="animate-xp-float text-[9px] text-pixel-xp font-pixel whitespace-nowrap"
          >
            +{n.amount} EXP
          </div>
        ))}
      </div>
    </div>
  );
}
