import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useXP } from '../hooks/useXP';
import { calculateLevel, expForLevel, STORAGE_KEYS } from '../constants';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useXP', () => {
  it('initializes with default player state', () => {
    const { result } = renderHook(() => useXP());

    expect(result.current.player.exp).toBe(0);
    expect(result.current.player.level).toBe(1);
    expect(result.current.player.streak).toBe(0);
    expect(result.current.player.totalCompleted).toBe(0);
    expect(result.current.notifications).toEqual([]);
    expect(result.current.showLevelUp).toBe(false);
  });

  it('addXP increments exp correctly', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(50);
    });

    expect(result.current.player.exp).toBe(50);
    expect(result.current.player.totalCompleted).toBe(1);
  });

  it('addXP creates a notification', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(25);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].amount).toBe(25);
  });

  it('notifications are cleaned up after timeout', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(10);
    });

    expect(result.current.notifications).toHaveLength(1);

    // Advance past the 1200ms notification cleanup timeout
    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('level up triggers when reaching the next threshold', () => {
    const { result } = renderHook(() => useXP());

    // calculateLevel switches to level 2 when total EXP >= expForLevel(2) = 141
    // So we need at least 141 total XP
    const threshold = expForLevel(2); // = 141

    act(() => {
      result.current.addXP(threshold);
    });

    expect(result.current.player.exp).toBe(threshold);
    expect(result.current.player.level).toBe(2);
    expect(result.current.showLevelUp).toBe(true);
  });

  it('showLevelUp auto-clears after timeout', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(expForLevel(2)); // enough for level 2
    });

    expect(result.current.showLevelUp).toBe(true);

    // Advance past the 2500ms level-up timeout
    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(result.current.showLevelUp).toBe(false);
  });

  it('level up at higher levels works correctly', () => {
    const { result } = renderHook(() => useXP());

    // Level 2 requires 141 total, level 3 requires expForLevel(3) = 259 total
    // Add enough XP to reach level 3
    const xpForLevel3 = expForLevel(3); // = 259

    act(() => {
      result.current.addXP(xpForLevel3);
    });

    expect(result.current.player.level).toBeGreaterThanOrEqual(3);
    expect(result.current.showLevelUp).toBe(true);
  });

  it('multiple rapid addXP calls are safe', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(10);
      result.current.addXP(20);
      result.current.addXP(30);
    });

    expect(result.current.player.exp).toBe(60);
    expect(result.current.player.totalCompleted).toBe(3);
    expect(result.current.notifications).toHaveLength(3);
  });

  it('calculates progress and in-level EXP correctly', () => {
    const { result } = renderHook(() => useXP());

    // At level 1, exp 0: expForLevel(1) = 50
    expect(result.current.progress).toBe(0);
    expect(result.current.expInLevel).toBe(0);
    expect(result.current.expForNext).toBe(expForLevel(1));

    // Add 100 XP — still level 1 but with progress
    act(() => {
      result.current.addXP(100);
    });

    // Level is still 1 since 100 < expForLevel(2) = 141
    expect(result.current.player.level).toBe(1);
    // expForCurrent = 0 for level 1, so expInLevel = player.exp - 0 = 100
    expect(result.current.expInLevel).toBe(100);
    // Progress: expProgress(100): currentLevel=1, currentLevelExp=50, nextLevelExp=141
    // (100 - 50) / (141 - 50) = 50 / 91 ≈ 0.549
    expect(result.current.progress).toBeCloseTo(50 / 91, 2);
  });

  it('shows level up when setShowLevelUp is triggered manually', () => {
    const { result } = renderHook(() => useXP());

    expect(result.current.showLevelUp).toBe(false);

    act(() => {
      result.current.setShowLevelUp(true);
    });

    // Manually setting showLevelUp should work
    expect(result.current.showLevelUp).toBe(true);
  });

  it('persists player state to localStorage after debounce', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(100);
    });

    // Advance past the 500ms debounce
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PLAYER) || '{}'
    );
    expect(stored.exp).toBe(100);
    expect(stored.level).toBe(calculateLevel(100));
  });
});
