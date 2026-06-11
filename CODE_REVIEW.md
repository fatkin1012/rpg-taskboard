# RPG Taskboard — Code Review

**Reviewer**: Subagent  
**Date**: 2026-06-11  
**Scope**: All files in `/tmp/rpg-taskboard-review/src/`  
**Codebase**: React 18 + TypeScript + Tauri v2 overlay widget with mini/compact/full modes, XP/level system, task CRUD.

---

## 🔴 Critical Issues

### C1. `toggleTask` mutates state after the setter returns (stale closure bug)

**File**: `src/hooks/useTasks.ts` — `toggleTask`  
**Severity**: HIGH — Data integrity, XP might apply to wrong task or silently fail.

`toggleTask` declares `let expGained = 0` outside `setTasks`, then writes to it *inside* the updater callback, then reads it *after* `setTasks` returns. This works only because the updater runs synchronously in the same microtask *during* the setState call. This is an undocumented React implementation detail — future concurrent rendering or batched updates would break it.

**Fix**: Return the exp value from the updater, or compute it before the setter:

```ts
const toggleTask = useCallback((id: string): number => {
  let expGained = 0;
  setTasks(prev => {
    let extra = 0;
    const updated = prev.map(task => {
      if (task.id === id && !task.completed) {
        extra = EXP_VALUES[task.difficulty];
        return { ...task, completed: true, completedAt: Date.now() };
      }
      return task;
    });
    expGained = extra;  // this is fragile
    return updated;
  });
  // expGained may be stale in concurrent mode
  ...
}, []);
```

Recommended: extract the index, compute exp outside, then update:

```ts
const toggleTask = useCallback((id: string): number => {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1 || tasks[idx].completed) return 0;
  const expGained = EXP_VALUES[tasks[idx].difficulty];
  setTasks(prev => prev.map(t =>
    t.id === id ? { ...t, completed: true, completedAt: Date.now() } : t
  ));
  return expGained;
}, [tasks]);
```

### C2. `addXP` in `useXP` has stale closure over `player.level` and `player.exp`

**File**: `src/hooks/useXP.ts` — `addXP`  
**Severity**: HIGH — Can cause incorrect level calculations / lost XP if multiple tasks are completed in rapid succession.

```ts
const addXP = useCallback((amount: number) => {
  const oldLevel = player.level;     // Stale!
  const newExp = player.exp + amount; // Stale!
  ...
}, [player.level, player.exp]);       // Re-creates callback on every change
```

If `addXP` is called twice before React re-renders (e.g., two quick task toggles), the second call reads stale `player.exp`. This is made worse by the current architecture where `Overlay.handleToggleComplete` calls `tasks.toggleTask` synchronously then queues `xp.addXP` via `setTimeout(..., 0)` — the second toggle's `addXP` will likely see the same old `player.exp`.

**Fix**: Use functional updater form:

```ts
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
    const oldLevel = prev.level;
    const newExp = prev.exp + amount;
    const newLevel = calculateLevel(newExp);
    // side-effect here is smelly — ideally level-up detection is a useEffect
    if (newLevel > oldLevel) {
      // Use ref or separate state for levelUp
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2500);
    }
    return {
      ...prev,
      exp: newExp,
      level: newLevel,
      totalCompleted: prev.totalCompleted + 1,
    };
  });
}, []);
```

Also: calling `setShowLevelUp` inside a `setPlayer` updater is itself a red flag (setState inside setState updater). Better to move level-up detection into a `useEffect` that watches `player.level`.

### C3. `Overlay.tsx` type imports via `ReturnType<typeof import(...)>.useTasks` — very brittle

**File**: `src/components/Overlay.tsx`  
**Severity**: HIGH — Maintainability, tree-shaking, bundler compatibility.

```ts
tasks: ReturnType<typeof import('../hooks/useTasks').useTasks>;
xp: ReturnType<typeof import('../hooks/useXP').useXP>;
```

This uses dynamic `import()` in a **type position**. While TypeScript may resolve this, it's fragile, anti-pattern, and defeats clear type contracts. Modules may be evaluated for side effects at type-resolution time depending on bundler. Also, it makes the interface impossible to document or export as a standalone contract.

**Fix**: Define explicit interfaces:

```ts
interface OverlayTasks {
  tasks: Task[];
  activeTasks: Task[];
  ...
}
interface OverlayXP {
  player: PlayerState;
  notifications: XPNotification[];
  ...
}
```

Or simply recreate the interfaces from the hook return types using `ReturnType<typeof useTasks>` — but import the hooks normally, not via async `import()`.

### C4. `handleToggleComplete` uses `setTimeout(…, 0)` to sidestep setState-during-render

**File**: `src/components/Overlay.tsx`  
**Severity**: MEDIUM-HIGH — Race condition between task update and XP award.

```ts
const handleToggleComplete = useCallback((taskId: string): number => {
  const exp = tasks.toggleTask(taskId);
  if (exp > 0) {
    setTimeout(() => xp.addXP(exp), 0); // 🚩
  }
  return exp;
}, [tasks, xp]);
```

The `setTimeout(…, 0)` is a workaround. The root cause is that `toggleTask` updates state and returns exp, then `addXP` is called in the same synchronous pass — but `addXP` reads stale `player` because React hasn't re-rendered yet. The `setTimeout` just rolls the dice on timing. Combined with C2, this is a ticking time bomb for lost XP.

A proper fix would be:
1. Make `toggleTask` return exp from the *existing* task data (not from inside the setter), OR
2. Compute exp in the **Overlay** component before calling either toggle or XP, OR
3. Use a single action/reducer pattern (or `useReducer`) so that toggling + awarding XP happens atomically.

---

## 🟡 Suggestions Worth Addressing

### S1. `uncompleteTask` returns `number` but always returns 0

**File**: `src/components/FullWidget.tsx` / `Overlay.tsx`  
**Severity**: LOW — Dead code.

`handleUncomplete` always returns `0`, and `FullWidget` passes it as `onToggle` for completed tasks — but the `onToggle` prop signature expects `(id: string) => number`. The return value is never used. Either remove the return type or remove the parameter.

### S2. Task list key collisions in concurrent-adjacent renders

**File**: `src/hooks/useTasks.ts` — `addTask`  
**Severity**: LOW — Extremely rare collision, but avoidable.

```ts
id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
```

The fallback uses `Date.now()` (ms precision) + random. For a non-critical overlay this is fine, but if two tasks are added in the same ms (e.g., programmatic bulk add in future), they'd collide. NanoID or `crypto.randomUUID()` polyfill would be more robust.

### S3. `expForLevel` formula duplication

**File**: `src/hooks/useXP.ts` vs `src/constants.ts`

The formula `50 * n^1.5` is computed via `expForLevel()` in `constants.ts`, but `useXP` **re-implements it inline**:

```ts
const expForNext = (() => {
  const level = player.level;
  return Math.floor(50 * Math.pow(level, 1.5));
})();
```

This should call `expForLevel(player.level)` instead. Ditto for `expForCurrent` which calls `expForLevel(player.level - 1)`. This creates a maintenance risk if the formula changes.

### S4. `player.streak` is never incremented

**File**: `src/hooks/useXP.ts` and `src/hooks/useTasks.ts`

`streak` is stored in `PlayerState`, initialized from localStorage, and displayed in `FullWidget` — but **no code increments or manages it**. This is clearly planned but unimplemented. It should either be tracked (e.g., based on consecutive days with completions) or removed from the interface until implemented.

### S5. `expForNext`/`expForCurrent`/`expInLevel` recomputed every render

**File**: `src/hooks/useXP.ts`  
**Severity**: LOW — Trivial computation, but could be memoized.

Three IIFEs run on every render. Since they only depend on `player.level` and `player.exp`, they could be `useMemo`-ized. Minor optimization; not critical given the trivial math.

### S6. XP notifications rely on `setTimeout` for cleanup

**Files**: `useXP.ts` and several widget components  
**Severity**: LOW — Not a memory leak, but could be cleaner.

XP notifications push to an array, then `setTimeout` removes them after 1200ms. In development with StrictMode, the timeout IDs are not tracked. If the component unmounts mid-flight, the timeout fires and calls `setNotifications` on an unmounted component (React 18 warns about this). A `useEffect` cleanup pattern would be more robust:

```ts
useEffect(() => {
  if (notifications.length === 0) return;
  const id = setTimeout(() => {
    setNotifications([]); // or filter expired
  }, 1200);
  return () => clearTimeout(id);
}, [notifications]);
```

### S7. `isTauri()` function in `tauri.ts` is unused

**File**: `src/utils/tauri.ts`

`isTauri()` is exported but never called anywhere in the codebase. `getTauriWindow` is used, `setWindowSize`/`setWindowPosition`/`getWindowPosition` are exported but also **unused** — the overlay uses mouse-based manual positioning instead. Either wire these into resize/drag behaviour or remove dead code.

### S8. No position clamping for screen bounds

**File**: `src/components/Overlay.tsx`  
Dragging clamps to `x >= 0, y >= 0` but does not clamp to the **right/bottom edges** of the viewport. The overlay can be dragged partially off-screen to the right or bottom. If Tauri window management is intended, the position should clamp to `window.innerWidth - overlayWidth` and `window.innerHeight - overlayHeight`.

### S9. `MODE_DIMENSIONS` dimensions are imported but `numericWidth` in Overlay is computed for nothing

**File**: `src/components/Overlay.tsx`  
```ts
const numericWidth = parseInt(dims.width); // computed but never used
```

Dead variable.

### S10. No error boundary

**File**: `src/main.tsx`  
If any component crashes, the entire overlay goes blank. For an overlay widget (persistent, always-on display), an error boundary with graceful degradation is highly recommended.

---

## 💭 Minor Observations

1. **`lastCompletedTask` in `useTasks` is set but never read by any component.** The hook sets it on toggle, clears it after 1s, but no widget reads `tasks.lastCompletedTask`. Dead state/data flow.

2. **`activeTasks` is an alias for `incompleteTasks`** — both are computed identically. `activeTasks` is redundant.

3. **`useTasks` returns `tasks`, `activeTasks`, `incompleteTasks`, and `completedTasks`** — three derived arrays. Consider `useMemo` for derived data if the task list grows.

4. **No input validation on TaskInput** beyond `name.trim()` check and `maxLength={50}`. No XSS/sanitization (though React escapes JSX by default, so this is low risk).

5. **Difficulty selector in TaskInput sets `borderColor` and `color` via inline style**, overriding Tailwind classes. This works but is inconsistent with the rest of the codebase which uses Tailwind exclusively.

6. **CSS class `font-pixel` depends on "Press Start 2P" font** — loaded from where? It's not imported in `index.html` or any CSS `@import`. Font will fall back to `monospace`. If intended, add a `@font-face` or link tag.

7. **`Overlay.tsx` uses `import('../hooks/useTasks').useTasks` in a type annotation** but the actual *value* import is via props. This won't work at runtime — TypeScript resolves it compile-time, but the pattern is confusing and could break in certain bundler configurations.

8. **`useEffect` in `useTasks` and `useXP` writes to localStorage on every state change.** For a few tasks this is fine, but there's no debounce. If tasks are bulk-added/deleted in a loop, it triggers N writes. A `useEffect` with a small debounce or a `beforeunload` save would be more efficient.

9. **Tailwind colors `pixel-diff-*` defined but unused** — components use `DIFFICULTY_COLORS` from constants instead.

10. **No Tauri v2 capability/allowlist configured** in `src-tauri/` — if this is intended to run as a Tauri app, the `tauri.conf.json` and capabilities need to be reviewed separately. The `@tauri-apps/plugin-shell` dependency in `package.json` is suspicious — the code only uses `@tauri-apps/api/window`.

---

## 📊 Re-Render Analysis

| Component | Re-render Trigger | Notes |
|-----------|------------------|-------|
| `Overlay` | mode, position, isDragging, all tasks, all xp | Passes entire hook outputs down; any task/XP change re-renders all children |
| `MiniWidget` | level, exp values, notifications, showLevelUp | Fine — small surface area |
| `CompactWidget` | level, exp, activeTasks, notifications | OK — only receives derived arrays |
| `FullWidget` | level, exp, both task arrays, both callbacks | Largest surface area; notifications array causes re-renders on every XP |
| `TaskList` | tasks array reference | New array every render — consider `useMemo` in parent |
| `TaskInput` | local state only | Fine |

**Potential issue**: The `notifications` array is recreated every time a notification is added or removed. Since it's spread across all three widgets, every notification animation cycle causes each widget to re-render — even the ones not showing. Minor in practice (animation is 1.2s), but worth noting.

---

## ✅ Strengths

- Clean separation of concerns: hooks for data, components for presentation
- Good use of TypeScript types and interfaces
- `useTasks` correctly handles localStorage corruption with try/catch and reset
- Tauri API wrapper (`tauri.ts`) gracefully falls back when not in Tauri environment
- Dragging is implemented with proper `mousedown`/`mousemove`/`mouseup` pattern and cleanup
- Mode persistence across sessions via localStorage
- Empty states handled in TaskList and FullWidget
- No dependency on external state management libraries — appropriate for a small overlay
- Good naming conventions and file organization

---

## Verdict

### ⚠️ **FAIL** — Address critical issues before developing new features

**Reasoning**:

The codebase is well-structured but has **three HIGH-severity data integrity bugs** (C1, C2, C3) that can cause:
1. **Lost XP** when completing tasks rapidly
2. **Stale/wrong level calculations** on concurrent interactions
3. **A bundle-breaking type pattern** that is extremely fragile

Additionally, the `setTimeout(…, 0)` workaround in `Overlay` (C4) masks a fundamental race condition between task toggling and XP awarding.

The good news: the architecture is clean and the bugs are all fixable with relatively small changes:
- Use functional updater pattern (`setState(prev => …)`) everywhere
- Replace brittle `ReturnType<typeof import(...)>` with explicit interfaces
- Remove `setTimeout` workaround by computing XP from task data directly before calling state setters
- Move level-up detection from inside `addXP` to a `useEffect` on `player.level`

**Estimated fix time**: ~30–60 minutes for the critical issues alone. Once addressed, the codebase is in good shape for feature development.
