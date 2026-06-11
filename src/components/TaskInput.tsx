import { useState } from 'react';
import type { Difficulty } from '../types';
import { DIFFICULTY_COLORS } from '../constants';

interface TaskInputProps {
  onAdd: (name: string, difficulty: Difficulty) => void;
}

const DIFFICULTIES: Difficulty[] = ['Simple', 'Medium', 'Hard', 'Epic'];

export default function TaskInput({ onAdd }: TaskInputProps) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Simple');
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, difficulty);
    setName('');
    setDifficulty('Simple');
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full py-2 px-3 text-[14px] font-pixel text-pixel-dim border border-dashed border-pixel-border rounded hover:text-pixel-text hover:border-pixel-text transition-colors"
      >
        + NEW QUEST
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-pixel-border rounded p-2 bg-pixel-panel/50">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Enter your quest…"
        className="w-full bg-pixel-bg border border-pixel-border rounded px-2 py-1.5 text-[15px] text-pixel-text font-mono outline-none focus:border-pixel-xp placeholder-pixel-dim mb-2"
        autoFocus
        maxLength={50}
      />
      <div className="flex gap-1 mb-1.5">
        {DIFFICULTIES.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            className={`flex-1 py-1.5 rounded text-[12px] font-pixel border transition-all ${
              difficulty === d
                ? 'border-pixel-xp text-pixel-xp bg-pixel-xp/10'
                : 'border-pixel-border text-pixel-dim hover:text-pixel-text'
            }`}
            style={difficulty === d ? { borderColor: DIFFICULTY_COLORS[d], color: DIFFICULTY_COLORS[d] } : undefined}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button
          type="submit"
          className="flex-1 py-1.5 bg-pixel-xp/20 border border-pixel-xp rounded text-[13px] font-pixel text-pixel-xp hover:bg-pixel-xp/30 transition-colors"
        >
          ✓ Add Task
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-2 py-1.5 border border-pixel-border rounded text-[13px] font-pixel text-pixel-dim hover:text-pixel-text transition-colors"
        >
          ✗
        </button>
      </div>
    </form>
  );
}
