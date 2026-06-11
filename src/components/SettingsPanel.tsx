import { useState, useEffect } from 'react';

interface SettingsPanelProps {
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  onClose: () => void;
}

/**
 * Settings panel — manages sound effects toggle and data reset.
 * Renders as an overlay within the widget.
 */
export default function SettingsPanel({
  soundEnabled,
  onSoundToggle,
  onClose,
}: SettingsPanelProps) {
  const handleResetData = () => {
    const confirmed = window.confirm(
      'Reset all RPG Taskboard data? This cannot be undone!',
    );
    if (!confirmed) return;

    localStorage.removeItem('rpg-taskboard-tasks');
    localStorage.removeItem('rpg-taskboard-player');
    localStorage.removeItem('rpg-taskboard-mode');
    localStorage.removeItem('rpg-taskboard-position');
    localStorage.removeItem('rpg-taskboard-settings');
    window.location.reload();
  };

  return (
    <div className="absolute inset-0 bg-pixel-bg/95 border border-pixel-border rounded-lg z-50 flex flex-col p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-pixel-text font-pixel tracking-wider">
          ⚙️ SETTINGS
        </span>
        <button
          onClick={onClose}
          className="text-pixel-dim hover:text-pixel-text text-[10px] transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Sound toggle */}
      <label className="flex items-center justify-between py-1.5 border-b border-pixel-border/30">
        <span className="text-[8px] text-pixel-text font-pixel">Sound Effects</span>
        <button
          onClick={() => onSoundToggle(!soundEnabled)}
          className={`w-6 h-3 rounded-full transition-colors relative ${
            soundEnabled ? 'bg-pixel-xp' : 'bg-pixel-dim/50'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-transform ${
              soundEnabled ? 'left-[3px]' : 'left-[13px]'
            }`}
          />
        </button>
      </label>

      {/* Reset data */}
      <button
        onClick={handleResetData}
        className="mt-auto py-1.5 text-[8px] font-pixel text-pixel-accent border border-pixel-accent/30 rounded hover:bg-pixel-accent/10 transition-colors"
      >
        🗑 Reset All Data
      </button>
    </div>
  );
}
