import type { Task, XPNotification } from '../types';
import TaskList from './TaskList';
import XPBar from './XPBar';
import LevelBadge from './LevelBadge';

interface CompactWidgetProps {
  level: number;
  expInLevel: number;
  expForNext: number;
  progress: number;
  tasks: Task[];
  activeTasks: Task[];
  showLevelUp: boolean;
  notifications: XPNotification[];
  onToggle: (id: string) => number;
  onDelete: (id: string) => void;
}

export default function CompactWidget({
  level,
  expInLevel,
  expForNext,
  progress,
  activeTasks,
  notifications,
  showLevelUp,
  onToggle,
  onDelete,
}: CompactWidgetProps) {
  return (
    <div className="flex flex-col h-full p-2 gap-1.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-pixel-border/50 pb-1">
        <LevelBadge level={level} showLevelUp={showLevelUp} />
        <div className="flex-1 ml-2">
          <XPBar
            progress={progress}
            expInLevel={expInLevel}
            expForNext={expForNext}
            level={level}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="text-[7px] text-pixel-dim font-pixel mb-1 tracking-wider">
          ── DAILY QUESTS ──
        </div>
        <TaskList
          tasks={activeTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          maxItems={6}
        />
      </div>

      {/* XP Floats */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
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
