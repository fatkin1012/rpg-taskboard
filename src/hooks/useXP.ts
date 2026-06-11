import { useState, useEffect, useCallback, useRef } from 'react';
import type { PlayerState, XPNotification } from '../types';
import { calculateLevel, expForLevel, expProgress, STORAGE_KEYS } from '../constants';

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

  // Debounced localStorage save
  const latestPlayer = useRef(player);
  latestPlayer.current = player;
  useEffect(() => {
    const timer = setTimeout(() => savePlayer(latestPlayer.current), 500);
    return () => clearTimeout(timer);
  }, [player]);

  // Track previous level so we can detect level-ups via useEffect
  const prevLevelRef = useRef(player.level);
  useEffect(() => {
    if (player.level > prevLevelRef.current) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 2500);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = player.level;
  }, [player.level]);

  const addXP = useCallback((amount: number) => {
    const notification: XPNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 1200);

    setPlayer(prev => {
      const newExp = prev.exp + amount;
      return {
        ...prev,
        exp: newExp,
        level: calculateLevel(newExp),
        totalCompleted: prev.totalCompleted + 1,
      };
    });
  }, []);

  const progress = expProgress(player.exp);
  const expForNext = expForLevel(player.level);
  const expForCurrent = player.level <= 1 ? 0 : expForLevel(player.level - 1);
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
