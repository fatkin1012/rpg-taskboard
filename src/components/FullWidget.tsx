import type { Task, XPNotification } from '../types';
import TaskList from './TaskList';
import TaskInput from './TaskInput';
import XPBar from './XPBar';
import LevelBadge from './LevelBadge';
import type { Difficulty } from '../types';

interface FullWidgetProps {
  level: number;
  expInLevel: number;
  expForNext: number;
  progress: number;
  tasks: Task[];
  activeTasks: Task[];
  completedTasks: Task[];
  totalCompleted: number;
  streak: number;
  showLevelUp: boolean;
  notifications: XPNotification[];
  onToggle: (id: string) => number;
  onDelete: (id: string) => void;
  onAddTask: (name: string, difficulty: Difficulty) => void;
  onUncomplete: (id: string) => number;
}

export default function FullWidget({
  level,
  expInLevel,
  expForNext,
  progress,
  activeTasks,
  completedTasks,
  totalCompleted,
  streak,
  showLevelUp,
  notifications,
  onToggle,
  onDelete,
  onAddTask,
  onUncomplete,
}: FullWidgetProps) {
  const doneToday = completedTasks.length;
  const totalToday = activeTasks.length + doneToday;

  return (
    <div className="flex flex-col h-full gap-1.5">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-pixel-border/50">
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

      {/* Stats row */}
      <div className="flex items-center justify-around px-2 py-0.5 border-b border-pixel-border/30">
        <div className="text-center">
          <span className="text-[11px] text-pixel-xp font-pixel block">{totalCompleted}</span>
          <span className="text-[9px] text-pixel-dim font-pixel">COMPLETED</span>
        </div>
        <div className="text-center">
          <span className="text-[11px] text-pixel-hp font-pixel block">
            {doneToday}/{totalToday}
          </span>
          <span className="text-[9px] text-pixel-dim font-pixel">TODAY</span>
        </div>
        <div className="text-center">
          <span className="text-[11px] text-pixel-rare font-pixel block">
            {streak > 0 ? `🔥${streak}` : '—'}
          </span>
          <span className="text-[9px] text-pixel-dim font-pixel">STREAK</span>
        </div>
      </div>

      {/* Task Input */}
      <div className="px-2">
        <TaskInput onAdd={onAddTask} />
      </div>

      {/* Task Lists */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2">
        {activeTasks.length > 0 && (
          <div className="mb-1">
            <div className="text-[11px] text-pixel-accent font-pixel mb-0.5 tracking-wider">
              ── ACTIVE ──
            </div>
            <TaskList
              tasks={activeTasks}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          </div>
        )}

        {completedTasks.length > 0 && (
          <div>
            <div className="text-[11px] text-pixel-hp font-pixel mb-0.5 tracking-wider">
              ── COMPLETED ──
            </div>
            <TaskList
              tasks={completedTasks.slice(0, 5)}
              onToggle={onUncomplete}
              onDelete={onDelete}
            />
            {completedTasks.length > 5 && (
              <p className="text-[10px] text-pixel-dim font-pixel text-center mt-0.5">
                +{completedTasks.length - 5} more completed
              </p>
            )}
          </div>
        )}
      </div>

      {/* XP Floats */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        {notifications.map(n => (
          <div
            key={n.id}
            className="animate-xp-float text-[14px] text-pixel-xp font-pixel whitespace-nowrap"
          >
            +{n.amount} EXP
          </div>
        ))}
      </div>
    </div>
  );
}
