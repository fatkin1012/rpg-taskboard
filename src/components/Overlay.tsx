import { useState, useCallback, useEffect, useRef } from 'react';
import type { WidgetMode, Difficulty, OverlayTasks, OverlayXP } from '../types';
import { MODE_DIMENSIONS } from '../constants';
import TitleBar from './TitleBar';
import MiniWidget from './MiniWidget';
import CompactWidget from './CompactWidget';
import FullWidget from './FullWidget';
import SettingsPanel from './SettingsPanel';

interface OverlayProps {
  mode: WidgetMode;
  onModeChange: (mode: WidgetMode) => void;
  tasks: OverlayTasks;
  xp: OverlayXP;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
}

export default function Overlay({ mode, onModeChange, tasks, xp, soundEnabled, onSoundToggle }: OverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dims = MODE_DIMENSIONS[mode];

  // Load saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rpg-taskboard-position');
      if (saved) {
        setPosition(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save position (debounced)
  const latestPosition = useRef(position);
  latestPosition.current = position;
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('rpg-taskboard-position', JSON.stringify(latestPosition.current));
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [position]);

  // Mouse-based dragging — only triggers on title bar (data-drag-region)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Only drag from elements inside the title bar's drag region
    const dragRegion = target.closest('[data-drag-region]');
    if (!dragRegion) return;

    // Strict check: never drag when clicking any interactive element
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[role="button"]') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA'
    ) return;

    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const overlayWidth = overlayRef.current?.offsetWidth ?? parseInt(dims.width);
      const overlayHeight = overlayRef.current?.offsetHeight ?? parseInt(dims.minHeight);
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setPosition({
        x: Math.max(0, Math.min(newX, window.innerWidth - overlayWidth)),
        y: Math.max(0, Math.min(newY, window.innerHeight - overlayHeight)),
      });
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
  }, [isDragging, dragOffset, dims.width, dims.minHeight]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setShowSettings(false);
      }
      if (e.key === '1') onModeChange('mini');
      if (e.key === '2') onModeChange('compact');
      if (e.key === '3') onModeChange('full');
      if ((e.key === 'n' || e.key === 'N') && mode !== 'full') {
        onModeChange('full');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onModeChange]);

  const handleToggleComplete = useCallback((taskId: string): number => {
    const exp = tasks.toggleTask(taskId);
    if (exp > 0) {
      xp.addXP(exp);
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
      onMouseDown={handleMouseDown}
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
      {/* Title bar — visible drag handle with close button */}
      <TitleBar
        mode={mode}
        onModeChange={onModeChange}
        showSettings={showSettings}
        onSettingsToggle={() => setShowSettings(!showSettings)}
      />

      {/* Widget content based on mode */}
      <div className="bg-pixel-panel/90 border border-t-0 border-pixel-border rounded-b-lg shadow-lg shadow-black/50 backdrop-blur-sm overflow-hidden relative">
        {showSettings ? (
          <SettingsPanel
            soundEnabled={soundEnabled}
            onSoundToggle={onSoundToggle}
            onClose={() => setShowSettings(false)}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
