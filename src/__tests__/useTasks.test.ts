import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTasks } from '../hooks/useTasks';
import { EXP_VALUES, STORAGE_KEYS } from '../constants';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTasks', () => {
  it('addTask creates a task with correct structure', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Test quest', 'Medium');
    });

    expect(result.current.tasks).toHaveLength(1);
    const task = result.current.tasks[0];
    expect(task.name).toBe('Test quest');
    expect(task.difficulty).toBe('Medium');
    expect(task.completed).toBe(false);
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeGreaterThan(0);
    expect(task.completedAt).toBeUndefined();
  });

  it('addTask trims whitespace from name', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('  Spaced quest  ', 'Simple');
    });

    expect(result.current.tasks[0].name).toBe('Spaced quest');
  });

  it('addTask ignores empty name', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('', 'Simple');
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  it('addTask prepends new tasks to the beginning', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('First', 'Simple');
      result.current.addTask('Second', 'Hard');
    });

    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].name).toBe('Second');
    expect(result.current.tasks[1].name).toBe('First');
  });

  it('toggleTask marks task completed and returns correct XP', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Epic quest', 'Epic');
    });

    const taskId = result.current.tasks[0].id;
    let expGained = 0;
    act(() => {
      expGained = result.current.toggleTask(taskId);
    });

    expect(expGained).toBe(EXP_VALUES.Epic);
    expect(result.current.tasks[0].completed).toBe(true);
    expect(result.current.tasks[0].completedAt).toBeGreaterThan(0);
  });

  it('toggleTask returns correct XP for each difficulty', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Simple', 'Simple');
      result.current.addTask('Medium', 'Medium');
      result.current.addTask('Hard', 'Hard');
    });

    const tasks = result.current.tasks;
    const difficulties = ['Hard', 'Medium', 'Simple'];

    tasks.forEach((task, i) => {
      let exp = 0;
      act(() => {
        exp = result.current.toggleTask(task.id);
      });
      expect(exp).toBe(EXP_VALUES[difficulties[i] as keyof typeof EXP_VALUES]);
    });
  });

  it('toggleTask skips already completed tasks and returns 0', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Already done', 'Hard');
    });

    const taskId = result.current.tasks[0].id;

    // First toggle — completes it
    act(() => {
      result.current.toggleTask(taskId);
    });

    // Second toggle — should return 0
    let expGained = 999;
    act(() => {
      expGained = result.current.toggleTask(taskId);
    });

    expect(expGained).toBe(0);
    expect(result.current.tasks[0].completed).toBe(true);
  });

  it('toggleTask returns 0 for non-existent task', () => {
    const { result } = renderHook(() => useTasks());

    let expGained = 999;
    act(() => {
      expGained = result.current.toggleTask('non-existent-id');
    });

    expect(expGained).toBe(0);
  });

  it('deleteTask removes the task', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('To delete', 'Simple');
    });

    const taskId = result.current.tasks[0].id;
    expect(result.current.tasks).toHaveLength(1);

    act(() => {
      result.current.deleteTask(taskId);
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  it('uncompleteTask resets task completed state', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Reopen me', 'Simple');
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.toggleTask(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(true);

    act(() => {
      result.current.uncompleteTask(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(false);
    expect(result.current.tasks[0].completedAt).toBeUndefined();
  });

  it('lastCompletedTask is set briefly after toggling', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Test', 'Simple');
    });

    expect(result.current.lastCompletedTask).toBeNull();
    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.toggleTask(taskId);
    });

    expect(result.current.lastCompletedTask).toEqual({
      id: taskId,
      exp: EXP_VALUES.Simple,
    });

    // After 1000ms it should clear
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.lastCompletedTask).toBeNull();
  });

  it('persists tasks to localStorage after debounce', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask('Persist me', 'Simple');
    });

    // Advance time past the 500ms debounce
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.TASKS) || '[]'
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Persist me');
  });
});
