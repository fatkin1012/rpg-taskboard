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
