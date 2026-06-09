import { useState, useEffect, useCallback } from 'react';
import type { Task, Difficulty } from '../types';
import { STORAGE_KEYS } from '../constants';

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

  useEffect(() => {
    saveTasks(tasks);
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

  const toggleTask = useCallback((id: string) => {
    let expGained = 0;
    setTasks(prev => {
      const updated = prev.map(task => {
        if (task.id === id && !task.completed) {
          const expValues: Record<Difficulty, number> = { Simple: 10, Medium: 25, Hard: 50, Epic: 100 };
          expGained = expValues[task.difficulty];
          return { ...task, completed: true, completedAt: Date.now() };
        }
        return task;
      });
      return updated;
    });
    if (expGained > 0) {
      setLastCompletedTask({ id, exp: expGained });
      setTimeout(() => setLastCompletedTask(null), 1000);
    }
    return expGained;
  }, []);

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
