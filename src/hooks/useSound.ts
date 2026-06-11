import { useCallback } from 'react';

export type SoundType = 'complete' | 'levelUp' | 'addTask' | 'deleteTask';

const SOUND_LABELS: Record<SoundType, string> = {
  complete: 'Task complete',
  levelUp: 'Level up!',
  addTask: 'New task added',
  deleteTask: 'Task deleted',
};

/**
 * Sound effects placeholder hook.
 * When `enabled` is true, stub calls log to console.
 * Real audio assets will be added by Boss in a future update.
 */
export function useSound(enabled: boolean) {
  const play = useCallback(
    (type: SoundType) => {
      if (!enabled) return;
      console.log(`[Sound] ${SOUND_LABELS[type]}`);
    },
    [enabled],
  );

  return { play };
}
