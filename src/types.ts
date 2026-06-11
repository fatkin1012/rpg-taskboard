export type Difficulty = 'Simple' | 'Medium' | 'Hard' | 'Epic';
export type WidgetMode = 'mini' | 'compact' | 'full';

export interface Task {
  id: string;
  name: string;
  difficulty: Difficulty;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface PlayerState {
  exp: number;
  level: number;
  streak: number;
  totalCompleted: number;
}

export interface XPNotification {
  id: string;
  amount: number;
  timestamp: number;
}

/**
 * Explicit interface for the return value of useTasks.
 * Replaces brittle `ReturnType<typeof import(...)>` pattern.
 */
export interface OverlayTasks {
  tasks: Task[];
  activeTasks: Task[];
  incompleteTasks: Task[];
  completedTasks: Task[];
  lastCompletedTask: { id: string; exp: number } | null;
  addTask: (name: string, difficulty: Difficulty) => void;
  toggleTask: (id: string) => number;
  deleteTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
}

/**
 * Explicit interface for the return value of useXP.
 * Replaces brittle `ReturnType<typeof import(...)>` pattern.
 */
export interface OverlayXP {
  player: PlayerState;
  addXP: (amount: number) => void;
  progress: number;
  expInLevel: number;
  expForNext: number;
  expForCurrent: number;
  notifications: XPNotification[];
  showLevelUp: boolean;
  setShowLevelUp: (show: boolean) => void;
}
