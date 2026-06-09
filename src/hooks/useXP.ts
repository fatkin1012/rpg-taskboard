import { useState, useEffect, useCallback } from 'react';
import type { PlayerState, XPNotification } from '../types';
import { calculateLevel, expProgress, STORAGE_KEYS } from '../constants';

function loadPlayer(): PlayerState {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYER);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.exp === 'number') {
        const level = calculateLevel(parsed.exp);
        return {
          exp: parsed.exp,
          level,
          streak: parsed.streak ?? 0,
          totalCompleted: parsed.totalCompleted ?? 0,
        };
      }
    }
  } catch {
    // Corrupted data — reset
  }
  return { exp: 0, level: 1, streak: 0, totalCompleted: 0 };
}

function savePlayer(player: PlayerState) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
  } catch {
    console.warn('Failed to save player state');
  }
}

export function useXP() {
  const [player, setPlayer] = useState<PlayerState>(loadPlayer);
  const [notifications, setNotifications] = useState<XPNotification[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    savePlayer(player);
  }, [player]);

  const addXP = useCallback((amount: number) => {
    const oldLevel = player.level;
    const newExp = player.exp + amount;
    const newLevel = calculateLevel(newExp);

    const notification: XPNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 1200);

    setPlayer(prev => ({
      ...prev,
      exp: newExp,
      level: newLevel,
      totalCompleted: prev.totalCompleted + 1,
    }));

    if (newLevel > oldLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2500);
    }
  }, [player.level, player.exp]);

  const progress = expProgress(player.exp);
  const expForNext = (() => {
    const level = player.level;
    return Math.floor(50 * Math.pow(level, 1.5));
  })();
  const expForCurrent = (() => {
    if (player.level <= 1) return 0;
    return Math.floor(50 * Math.pow(player.level - 1, 1.5));
  })();
  const expInLevel = player.exp - expForCurrent;

  return {
    player,
    addXP,
    progress,
    expInLevel,
    expForNext,
    expForCurrent,
    notifications,
    showLevelUp,
    setShowLevelUp,
  };
}
