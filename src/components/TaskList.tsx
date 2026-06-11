import type { Task } from '../types';
import { DIFFICULTY_COLORS } from '../constants';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => number;
  onDelete: (id: string) => void;
  maxItems?: number;
}

export default function TaskList({ tasks, onToggle, onDelete, maxItems }: TaskListProps) {
  const displayTasks = maxItems ? tasks.slice(0, maxItems) : tasks;
  const hasMore = maxItems ? tasks.length > maxItems : false;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-[8px] text-pixel-dim font-pixel">✨ No quests today</p>
        <p className="text-[7px] text-pixel-dim/60 font-pixel mt-1">Add a new quest to begin!</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {displayTasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
      {hasMore && (
        <p className="text-[7px] text-pixel-dim font-pixel text-center pt-1">
          +{tasks.length - maxItems!} more...
        </p>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }: {
  task: Task;
  onToggle: (id: string) => number;
  onDelete: (id: string) => void;
}) {
  const diffColor = DIFFICULTY_COLORS[task.difficulty];

  return (
    <div
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onDelete(task.id);
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          onToggle(task.id);
        }
      }}
      className={`flex items-center gap-1 px-2 py-1 rounded border transition-all duration-300 group ${
        task.completed
          ? 'border-pixel-hp/30 bg-pixel-hp/5 opacity-60'
          : 'border-pixel-border/50 bg-pixel-panel/30 hover:bg-pixel-panel/50'
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-3.5 h-3.5 border rounded flex items-center justify-center transition-all ${
          task.completed
            ? 'bg-pixel-hp border-pixel-hp'
            : 'border-pixel-border hover:border-pixel-xp'
        }`}
      >
        {task.completed && (
          <span className="text-[8px] text-black leading-none">✓</span>
        )}
      </button>

      <span
        className={`flex-1 text-[8px] font-mono truncate ${
          task.completed ? 'line-through text-pixel-dim' : 'text-pixel-text'
        }`}
      >
        {task.name}
      </span>

      <span
        className="text-[6px] font-pixel flex-shrink-0 px-1 rounded"
        style={{ color: diffColor, backgroundColor: `${diffColor}15` }}
      >
        {task.difficulty === 'Simple' ? 'S' : task.difficulty === 'Medium' ? 'M' : task.difficulty === 'Hard' ? 'H' : 'E'}
      </span>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-[8px] text-pixel-dim hover:text-pixel-accent transition-all"
      >
        ✕
      </button>
    </div>
  );
}
