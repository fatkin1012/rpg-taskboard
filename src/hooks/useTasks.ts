import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Difficulty } from '../types';
import { EXP_VALUES, STORAGE_KEYS } from '../constants';

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Corrupted data — reset
  }
  return [];
}

function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch {
    console.warn('Failed to save tasks to localStorage');
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [lastCompletedTask, setLastCompletedTask] = useState<{ id: string; exp: number } | null>(null);

  // Debounced localStorage save (avoids thrashing on rapid updates)
  const latestTasks = useRef(tasks);
  latestTasks.current = tasks;
  useEffect(() => {
    const timer = setTimeout(() => saveTasks(latestTasks.current), 500);
    return () => clearTimeout(timer);
  }, [tasks]);

  const addTask = useCallback((name: string, difficulty: Difficulty) => {
    if (!name.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      difficulty,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const toggleTask = useCallback((id: string): number => {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1 || tasks[idx].completed) return 0;
    const expGained = EXP_VALUES[tasks[idx].difficulty];
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: true, completedAt: Date.now() } : t,
      ),
    );
    if (expGained > 0) {
      setLastCompletedTask({ id, exp: expGained });
      setTimeout(() => setLastCompletedTask(null), 1000);
    }
    return expGained;
  }, [tasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const uncompleteTask = useCallback((id: string) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, completed: false, completedAt: undefined } : task
    ));
  }, []);

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const activeTasks = incompleteTasks;

  return {
    tasks,
    activeTasks,
    incompleteTasks,
    completedTasks,
    lastCompletedTask,
    addTask,
    toggleTask,
    deleteTask,
    uncompleteTask,
  };
}
