import { useCallback } from 'react';
import { getTauriWindow } from '../utils/tauri';

interface TitleBarProps {
  mode: string;
  onModeChange: (mode: 'mini' | 'compact' | 'full') => void;
  showSettings: boolean;
  onSettingsToggle: () => void;
}

/**
 * TitleBar — visible drag handle at the top of the overlay.
 * Provides: drag region, centered app name, mode buttons, close button.
 */
export default function TitleBar({ mode, onModeChange, showSettings, onSettingsToggle }: TitleBarProps) {
  const handleClose = useCallback(async () => {
    try {
      const win = await getTauriWindow();
      if (win) {
        await win.close();
      } else {
        // Browser fallback: close the tab/window
        window.close();
      }
    } catch {
      window.close();
    }
  }, []);

  return (
    <div
      data-drag-region
      className="flex items-center justify-between h-[24px] min-h-[24px] bg-pixel-panel/90 border-b border-pixel-border select-none"
      style={{ cursor: 'grab' }}
    >
      {/* App title — centered with flex-1 */}
      <div className="flex-1 text-center">
        <span className="text-[9px] text-pixel-text font-pixel tracking-wider">
          RPG Task Board
        </span>
      </div>

      {/* Action buttons — right side */}
      <div className="flex items-center gap-0.5 pr-1">
        <ModeButton
          active={showSettings}
          label="⚙"
          onClick={onSettingsToggle}
          title="Settings"
        />
        <ModeButton
          active={mode === 'mini'}
          label="─"
          onClick={() => onModeChange('mini')}
          title="Mini mode [1]"
        />
        <ModeButton
          active={mode === 'compact'}
          label="▣"
          onClick={() => onModeChange('compact')}
          title="Compact mode [2]"
        />
        <ModeButton
          active={mode === 'full'}
          label="☰"
          onClick={() => onModeChange('full')}
          title="Full mode [3]"
        />
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          title="Close"
          className="ml-1 text-[10px] w-4 h-4 flex items-center justify-center rounded border border-pixel-border text-pixel-dim hover:bg-red-700/50 hover:text-red-200 hover:border-red-500 transition-all"
        >
          ×
        </button>
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
