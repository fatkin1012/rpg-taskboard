import { useState } from 'react';
import type { WidgetMode } from './types';
import { useTasks } from './hooks/useTasks';
import { useXP } from './hooks/useXP';
import Overlay from './components/Overlay';
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

  const tasks = useTasks();
  const xp = useXP();

  const handleModeChange = (newMode: WidgetMode) => {
    setMode(newMode);
    try {
      localStorage.setItem('rpg-taskboard-mode', newMode);
    } catch {}
  };

  return (
    <Overlay
      mode={mode}
      onModeChange={handleModeChange}
      tasks={tasks}
      xp={xp}
    />
  );
}
