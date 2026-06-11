import type { Difficulty } from './types';

export const EXP_VALUES: Record<Difficulty, number> = {
  Simple: 10,
  Medium: 25,
  Hard: 50,
  Epic: 100,
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Simple: '#2ed573',
  Medium: '#ffa502',
  Hard: '#ff4757',
  Epic: '#aa66ff',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  Simple: '🌱 Simple',
  Medium: '⚡ Medium',
  Hard: '🎯 Hard',
  Epic: '🗡️ Epic',
};

export const MODE_DIMENSIONS = {
  mini: { width: '320px', minHeight: '100px' },
  compact: { width: '400px', minHeight: '500px' },
  full: { width: '500px', minHeight: '700px' },
};

/**
 * Level-Up EXP requirement formula:
 * EXP needed for level N = 50 × N^1.5
 */
export function expForLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}

/**
 * Calculate level from total EXP.
 */
export function calculateLevel(exp: number): number {
  let level = 1;
  while (exp >= expForLevel(level)) {
    level++;
  }
  return Math.max(1, level - 1);
}

/**
 * EXP progress toward next level (0–1).
 */
export function expProgress(exp: number): number {
  const currentLevel = calculateLevel(exp);
  const currentLevelExp = expForLevel(currentLevel);
  const nextLevelExp = expForLevel(currentLevel + 1);
  const progress = (exp - currentLevelExp) / (nextLevelExp - currentLevelExp);
  return Math.min(1, Math.max(0, progress));
}

export const STORAGE_KEYS = {
  TASKS: 'rpg-taskboard-tasks',
  PLAYER: 'rpg-taskboard-player',
  SETTINGS: 'rpg-taskboard-settings',
};
