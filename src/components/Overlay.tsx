import { useState, useCallback, useEffect, useRef } from 'react';
import type { WidgetMode, Difficulty, OverlayTasks, OverlayXP } from '../types';
import { MODE_DIMENSIONS } from '../constants';
import { startWindowDrag, getTauriWindow, setWindowSize, setWindowPosition, getWindowPosition } from '../utils/tauri';
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
  const [showSettings, setShowSettings] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dims = MODE_DIMENSIONS[mode];

  // Restore saved window position on mount
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = localStorage.getItem('rpg-taskboard-position');
        if (saved) {
          const { x, y } = JSON.parse(saved);
          await setWindowSize(parseInt(dims.width), parseInt(dims.minHeight));
          await setWindowPosition(x, y);
        } else {
          // First launch — use default size
          await setWindowSize(parseInt(dims.width), parseInt(dims.minHeight));
        }
      } catch {
        // Non-Tauri environment or error — ignore
      }
    };
    restore();
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize the Tauri window when mode changes
  useEffect(() => {
    const resize = async () => {
      try {
        const width = parseInt(dims.width);
        const height = parseInt(dims.minHeight);
        await setWindowSize(width, height);
      } catch {
        // Non-Tauri environment — ignore
      }
    };
    resize();
  }, [mode, dims]);

  // Poll window position periodically to save (covers native drag end)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const win = await getTauriWindow();
        if (win) {
          const pos = await win.outerPosition();
          localStorage.setItem('rpg-taskboard-position', JSON.stringify({ x: pos.x, y: pos.y }));
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Also save position on window blur (user clicked away)
  useEffect(() => {
    const handleBlur = async () => {
      try {
        const pos = await getWindowPosition();
        if (pos) {
          localStorage.setItem('rpg-taskboard-position', JSON.stringify(pos));
        }
      } catch {}
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Mouse-based dragging — triggers Tauri native window drag from title bar
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Only drag from elements inside the title bar's drag region
    const dragRegion = target.closest('[data-drag-region]');
    if (!dragRegion) return;

    // Never drag when clicking any interactive element
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

    // Use Tauri's native window dragging (handles all mousemove/mouseup at OS level)
    await startWindowDrag();

    // After native drag ends, Tauri will release the mouse — clear dragging state
    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mouseup', onMouseUp);
  }, []);

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
      className="overlay-window h-full w-full flex flex-col select-none"
      style={{
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      {/* Title bar — visible drag handle with close button */}
      <TitleBar
        mode={mode}
        onModeChange={onModeChange}
        showSettings={showSettings}
        onSettingsToggle={() => setShowSettings(!showSettings)}
      />

      {/* Widget content based on mode — fills remaining space below title bar */}
      <div className="flex-1 bg-pixel-panel/90 overflow-hidden relative">
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
