import { useState } from 'react';
import type { WidgetMode } from './types';
import { useTasks } from './hooks/useTasks';
import { useXP } from './hooks/useXP';
import Overlay from './components/Overlay';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

export default function App() {
  const [mode, setMode] = useState<WidgetMode>(() => {
    try {
      const saved = localStorage.getItem('rpg-taskboard-mode');
      if (saved && ['mini', 'compact', 'full'].includes(saved)) {
        return saved as WidgetMode;
      }
    } catch {}
    return 'compact';
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('rpg-taskboard-sound') !== 'false';
  });

  const tasks = useTasks();
  const xp = useXP();

  const handleModeChange = (newMode: WidgetMode) => {
    setMode(newMode);
    try {
      localStorage.setItem('rpg-taskboard-mode', newMode);
    } catch {}
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    try {
      localStorage.setItem('rpg-taskboard-sound', String(enabled));
    } catch {}
  };

  return (
    <ErrorBoundary>
      <Overlay
        mode={mode}
        onModeChange={handleModeChange}
        tasks={tasks}
        xp={xp}
        soundEnabled={soundEnabled}
        onSoundToggle={handleSoundToggle}
      />
    </ErrorBoundary>
  );
}
