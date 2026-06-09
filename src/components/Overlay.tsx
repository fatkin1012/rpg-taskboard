import { useState, useCallback, useEffect, useRef } from 'react';
import type { WidgetMode, Difficulty } from '../types';
import { MODE_DIMENSIONS, EXP_VALUES } from '../constants';
import { getTauriWindow } from '../utils/tauri';
import MiniWidget from './MiniWidget';
import CompactWidget from './CompactWidget';
import FullWidget from './FullWidget';

interface OverlayProps {
  mode: WidgetMode;
  onModeChange: (mode: WidgetMode) => void;
  tasks: ReturnType<typeof import('../hooks/useTasks').useTasks>;
  xp: ReturnType<typeof import('../hooks/useXP').useXP>;
}

export default function Overlay({ mode, onModeChange, tasks, xp }: OverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const dims = MODE_DIMENSIONS[mode];
  const numericWidth = parseInt(dims.width);

  // Load saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rpg-taskboard-position');
      if (saved) {
        setPosition(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save position
  useEffect(() => {
    try {
      localStorage.setItem('rpg-taskboard-position', JSON.stringify(position));
    } catch {}
  }, [position]);

  // Mouse-based dragging (works in both browser and Tauri)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from the title bar area
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-region]')) return;
    // Don't drag when clicking buttons or inputs
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input')) return;

    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setPosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleToggleComplete = useCallback((taskId: string): number => {
    const exp = tasks.toggleTask(taskId);
    if (exp > 0) {
      // Use setTimeout to avoid setState-during-render issues
      setTimeout(() => xp.addXP(exp), 0);
    }
    return exp;
  }, [tasks, xp]);

  const handleUncomplete = useCallback((taskId: string): number => {
    tasks.uncompleteTask(taskId);
    return 0;
  }, [tasks]);

  const handleAddTask = useCallback((name: string, difficulty: Difficulty) => {
    tasks.addTask(name, difficulty);
  }, [tasks]);

  return (
    <div
      ref={overlayRef}
      className="overlay-window fixed select-none"
      style={{
        width: dims.width,
        minHeight: dims.minHeight,
        left: position.x,
        top: position.y,
        opacity: isDragging ? 0.85 : 1,
        zIndex: 9999,
      }}
    >
      {/* Drag region — the entire top area */}
      <div
        data-drag-region
        onMouseDown={handleMouseDown}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Mode toggle buttons */}
        <div className="flex justify-end gap-0.5 p-0.5 absolute top-0 right-0 z-10">
          <ModeButton
            active={mode === 'mini'}
            label="─"
            onClick={() => onModeChange('mini')}
            title="Mini mode"
          />
          <ModeButton
            active={mode === 'compact'}
            label="▣"
            onClick={() => onModeChange('compact')}
            title="Compact mode"
          />
          <ModeButton
            active={mode === 'full'}
            label="☰"
            onClick={() => onModeChange('full')}
            title="Full mode"
          />
        </div>

        {/* Widget content based on mode */}
        <div
          className="bg-pixel-panel/90 border border-pixel-border rounded-lg shadow-lg shadow-black/50 backdrop-blur-sm overflow-hidden"
          style={{ minHeight: dims.minHeight }}
        >
          {mode === 'mini' && (
            <MiniWidget
              level={xp.player.level}
              expInLevel={xp.expInLevel}
              expForNext={xp.expForNext}
              progress={xp.progress}
              activeTaskCount={tasks.activeTasks.length}
              showLevelUp={xp.showLevelUp}
              notifications={xp.notifications}
            />
          )}

          {mode === 'compact' && (
            <CompactWidget
              level={xp.player.level}
              expInLevel={xp.expInLevel}
              expForNext={xp.expForNext}
              progress={xp.progress}
              tasks={tasks.tasks}
              activeTasks={tasks.activeTasks}
              showLevelUp={xp.showLevelUp}
              notifications={xp.notifications}
              onToggle={handleToggleComplete}
              onDelete={tasks.deleteTask}
            />
          )}

          {mode === 'full' && (
            <FullWidget
              level={xp.player.level}
              expInLevel={xp.expInLevel}
              expForNext={xp.expForNext}
              progress={xp.progress}
              tasks={tasks.tasks}
              activeTasks={tasks.activeTasks}
              completedTasks={tasks.completedTasks}
              totalCompleted={xp.player.totalCompleted}
              streak={xp.player.streak}
              showLevelUp={xp.showLevelUp}
              notifications={xp.notifications}
              onToggle={handleToggleComplete}
              onDelete={tasks.deleteTask}
              onAddTask={handleAddTask}
              onUncomplete={handleUncomplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ModeButton({ active, label, onClick, title }: {
  active: boolean;
  label: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={`text-[8px] w-4 h-4 flex items-center justify-center rounded border transition-all ${
        active
          ? 'bg-pixel-xp/20 border-pixel-xp text-pixel-xp'
          : 'bg-pixel-panel border-pixel-border text-pixel-dim hover:text-pixel-text hover:border-pixel-text'
      }`}
    >
      {label}
    </button>
  );
}
