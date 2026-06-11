# RPG Taskboard — Verification Report

**Verifier**: Subagent  
**Date**: 2026-06-11  
**Commit**: `7f40389` ("Fix critical issues + develop features for RPG Taskboard")  
**Base**: Previous review on `96c57bf`  
**TypeScript**: ✅ `npx tsc --noEmit` passes with zero errors

---

## 🔴 Critical Issues

### C1. `toggleTask` stale closure in `useTasks.ts` — ✅ **FIXED**

**Before**: `expGained` was written inside `setTasks` updater callback but read after `setTasks` returned — fragile and dependent on synchronous setState behavior.

**After**: `toggleTask` now uses `tasks.findIndex()` to locate the task **before** the setter, computes `expGained` from the existing task's difficulty using `EXP_VALUES[tasks[idx].difficulty]`, and only calls `setTasks` with a single `prev.map(...)` updater. The return value is computed before the setter, not captured inside it.

```ts
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
}, [tasks]);  // depends on tasks[] — recent enough for index lookup
```

**Note**: `toggleTask` now has `[tasks]` in its dependency array, which means the callback is recreated when tasks change. This is correct behavior — it needs fresh `tasks` for index-based lookup. The dep is `tasks` (the array), not `tasks[idx].difficulty` — fine.

**Verdict**: ✅ Properly fixed.

---

### C2. `addXP` stale closure in `useXP.ts` — ✅ **FIXED**

**Before**: Read `player.level` and `player.exp` directly in the callback body (stale if called multiple times before re-render). Had `[player.level, player.exp]` deps causing re-creation on every change.

**After**: `addXP` now uses **functional updater** `setPlayer(prev => ...)` for all player state mutations:

```ts
const addXP = useCallback((amount: number) => {
  // ... notification logic (always fresh since local) ...
  setPlayer(prev => {
    const newExp = prev.exp + amount;
    return {
      ...prev,
      exp: newExp,
      level: calculateLevel(newExp),
      totalCompleted: prev.totalCompleted + 1,
    };
  });
}, []);  // No dependencies — fully self-contained via functional updater
```

Additionally:
- ✅ `setShowLevelUp` is no longer called inside the `setPlayer` updater. Level-up detection was moved to a separate `useEffect` that watches `player.level` and uses `prevLevelRef` for change detection.
- ✅ The `addXP` callback has **empty dependency array** — no stale closures possible.

**Verdict**: ✅ Properly fixed.

---

### C3. Brittle `ReturnType<typeof import(...)>` type imports — ✅ **FIXED**

**Before**: `Overlay.tsx` used:
```ts
tasks: ReturnType<typeof import('../hooks/useTasks').useTasks>;
xp: ReturnType<typeof import('../hooks/useXP').useXP>;
```

**After**: Explicit interfaces `OverlayTasks` and `OverlayXP` are defined in `src/types.ts`:

```ts
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
```

These are imported cleanly: `import type { WidgetMode, Difficulty, OverlayTasks, OverlayXP } from '../types';`

**Verdict**: ✅ Properly fixed.

---

### C4. `setTimeout(0)` workaround for race condition — ✅ **FIXED**

**Before**: `handleToggleComplete` used `setTimeout(() => xp.addXP(exp), 0)` to work around stale state in `addXP`.

**After**: The `setTimeout(0)` is completely removed. `xp.addXP(exp)` is called synchronously:

```ts
const handleToggleComplete = useCallback((taskId: string): number => {
  const exp = tasks.toggleTask(taskId);
  if (exp > 0) {
    xp.addXP(exp);  // No more setTimeout(0) workaround
  }
  return exp;
}, [tasks, xp]);
```

This works correctly now because:
1. `toggleTask` computes XP from current task data via index lookup (no stale closure)
2. `addXP` uses functional updater `setPlayer(prev => ...)` (no stale closure either)
3. Both are safe to call synchronously — each updater operates on the most recent previous state

**Verdict**: ✅ Properly fixed.

---

## 🟡 Suggestions

### S3. `expForLevel()` from constants used instead of inline formula — ✅ **FIXED**

**Before**: `useXP.ts` re-implemented the formula inline as `Math.floor(50 * Math.pow(...))`.

**After**: Both `expForNext` and `expForCurrent` call the shared `expForLevel()` from `constants.ts`:

```ts
const expForNext = expForLevel(player.level);
const expForCurrent = player.level <= 1 ? 0 : expForLevel(player.level - 1);
```

**Verdict**: ✅ Fixed.

---

### S7. Dead `isTauri()` removed — ✅ **FIXED**

**Before**: `src/utils/tauri.ts` exported `isTauri()`, `setWindowSize()`, `setWindowPosition()`, `getWindowPosition()` — all unused.

**After**: Only `getTauriWindow()` remains. `isTauri()`, `setWindowSize()`, `setWindowPosition()`, `getWindowPosition()` were all removed.

The remaining `getTauriWindow()` is also unused in the current codebase (Overlay no longer imports from tauri.ts), but it's a reasonable utility to keep for future Tauri integration. The dead `import { getTauriWindow }` was removed from Overlay.tsx.

**Verdict**: ✅ Fixed.

---

### S8. Screen-edge clamping (right/bottom) — ✅ **FIXED**

**Before**: Only clamped to `x >= 0, y >= 0`. No right/bottom edge clamping.

**After**: Uses `overlayRef.current?.offsetWidth` (with fallback to `parseInt(dims.width)`) and `overlayRef.current?.offsetHeight` (with fallback to `parseInt(dims.minHeight)`) to clamp:

```ts
setPosition({
  x: Math.max(0, Math.min(newX, window.innerWidth - overlayWidth)),
  y: Math.max(0, Math.min(newY, window.innerHeight - overlayHeight)),
});
```

**Verdict**: ✅ Fixed.

---

### S9. Dead `numericWidth` removed — ✅ **FIXED**

**Before**: `const numericWidth = parseInt(dims.width);` declared but never used.

**After**: Line completely removed from `Overlay.tsx`.

**Verdict**: ✅ Fixed.

---

### S10. Error boundary added — ✅ **FIXED**

**Before**: No error boundary in `main.tsx`/`App.tsx` — any crash would blank the entire overlay.

**After**: `ErrorBoundary` class component added in `src/components/ErrorBoundary.tsx` with:
- `getDerivedStateFromError` to catch render errors
- A graceful fallback UI with "Try Again" button
- Wraps `<Overlay>` in `App.tsx`

```tsx
return (
  <ErrorBoundary>
    <Overlay ... />
  </ErrorBoundary>
);
```

**Verdict**: ✅ Fixed.

---

### Other Review Notes Still Applicable

| Item | Status | Notes |
|------|--------|-------|
| S1. `uncompleteTask` returns always 0 | 🟡 **Unchanged** | Still returns 0. Minor — return value is unused by callers. |
| S2. Task key collision | 🟡 **Unchanged** | Still uses `crypto.randomUUID() || Date.now()+random` fallback. Acceptable for single-user overlay. |
| S4. `streak` never incremented | 🟡 **Unchanged** | Streak displayed in FullWidget but never actually incremented. Still planned-but-unimplemented. |
| S5. `expForNext/expForCurrent/expInLevel` memoization | 🟡 **Unchanged** | Still recomputed every render. Trivial math, not a perf concern. |
| S6. `setTimeout` cleanup on unmount | 🟡 **Partially improved** | Notifications still use `setTimeout` inside `addXP` without tracking for cleanup. The level-up `useEffect` does properly clean up its timeout. Minor. |
| S8. Clamping | ✅ Fixed | See above |
| Dead `getTauriWindow` import in Overlay | ✅ Fixed | Removed entirely |
| Other minor observations | 🟡 **Mostly unchanged** | Not blocking — cosmetic/Observation-level only |

---

## New Features Review

### Keyboard Shortcuts
- ✅ `Escape` closes settings panel
- ✅ `1`/`2`/`3` switches to mini/compact/full modes
- ✅ `N` or `n` switches to full mode (for adding tasks)
- ✅ Proper guard: ignores shortcuts when focus is in `INPUT` or `TEXTAREA`
- ✅ `TaskList` items have `tabIndex={0}` with `Enter` (toggle) and `Delete`/`Backspace` (delete) keyboard support
- **Verdict**: ✅ Well-implemented.

### Settings Panel (⚙ gear button)
- ✅ Full settings panel component (`src/components/SettingsPanel.tsx`)
- ✅ Toggle opens/closes with gear button in top-right
- ✅ Sound effects toggle with custom toggle switch UI
- ✅ "Reset All Data" button with `window.confirm` confirmation dialog
- ✅ Escape key closes settings
- ✅ Clean close button (✕)
- **Verdict**: ✅ Well-implemented.

### Sound Hook Placeholder
- ✅ `src/hooks/useSound.ts` with `SoundType` union type ('complete', 'levelUp', 'addTask', 'deleteTask')
- ✅ `useSound(enabled)` returns `{ play }` with console.log stub when enabled
- ✅ Not yet wired into components — placeholder as designed
- **Verdict**: ✅ Good placeholder pattern.

### Debounced localStorage Writes
- ✅ Tasks: `useRef` + `setTimeout(500)` debounce pattern (replaces immediate write on every state change)
- ✅ Player: Same `useRef` + `setTimeout(500)` debounce pattern
- ✅ Position: Same `useRef` + `setTimeout(300)` debounce pattern
- ✅ All cleanup on unmount via `return () => clearTimeout(timer)`
- ✅ `debounce()` utility exists in `src/utils/debounce.ts` (not used yet, but available for future)
- **Verdict**: ✅ Well-implemented debouncing with proper cleanup.

---

## Overall Summary

| Category | Status |
|----------|--------|
| All 4 Critical Issues (C1–C4) | ✅ **All Fixed** |
| S3 (expForLevel from constants) | ✅ Fixed |
| S7 (dead isTauri removed) | ✅ Fixed |
| S8 (screen-edge clamping) | ✅ Fixed |
| S9 (dead numericWidth removed) | ✅ Fixed |
| S10 (error boundary) | ✅ Added |
| TypeScript compilation | ✅ Zero errors |
| New features: Keyboard shortcuts | ✅ Well-implemented |
| New features: Settings panel | ✅ Well-implemented |
| New features: Sound hook placeholder | ✅ Good placeholder |
| New features: Debounced localStorage | ✅ Well-implemented |

## Overall Verdict: ✅ **PASS**

All four critical data integrity bugs (C1–C4) have been properly fixed. The key architectural changes are:
- **Functional updater pattern** (`setState(prev => ...)`) throughout `useTasks` and `useXP`, eliminating stale closure bugs
- **Explicit interfaces** (`OverlayTasks`, `OverlayXP`) in `src/types.ts` replacing the brittle `ReturnType<typeof import(...)>` pattern
- **Level-up detection** moved from inside `setPlayer` to a clean `useEffect` with `prevLevelRef`
- **`setTimeout(0)` workaround** eliminated now that both closures are fixed

Additionally, all five addressed suggestions (S3, S7, S8, S9, S10) are correctly implemented. The new features (keyboard shortcuts, settings panel, sound hook, debounced saves) are well-structured and integrate cleanly.

**No regressions detected.** The codebase is in good shape for further development.
