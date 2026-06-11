# UI Fixes — RPG Taskboard V0.28

## Summary

Fixed 3 UI issues: input font sizing, Chinese→English i18n, and the XP progress bar not updating.

---

## Fix 1 — Input font size too small

**File**: `src/components/TaskInput.tsx`

All interactive and static text elements in the task input form were bumped up in size for better readability:

| Element | Before | After |
|---|---|---|
| Collapsed "+ NEW QUEST" button | `text-[12px]` → `py-1.5 px-2` | `text-[14px]` → `py-2 px-3` |
| Text input field | `text-[13px]` → `py-1` | `text-[15px]` → `py-1.5` |
| Difficulty buttons (Simple/Medium/Hard/Epic) | `text-[11px]` → `py-1` | `text-[12px]` → `py-1.5` |
| Submit button ("Add Task") | `text-[12px]` → `py-1` | `text-[13px]` → `py-1.5` |
| Cancel button (✗) | `text-[12px]` → `py-1` | `text-[13px]` → `py-1.5` |
| Input bottom margin | `mb-1.5` | `mb-2` |

---

## Fix 2 — Chinese → English

**File**: `src/components/TaskInput.tsx`

| Before | After |
|---|---|
| `placeholder="輸入任務..."` | `placeholder="Enter your quest…"` |
| `✓ 接任務` | `✓ Add Task` |

No other Chinese UI text was found in the codebase (TaskList, SettingsPanel, TitleBar, widgets are all already English).

---

## Fix 3 — XP progress bar not updating

**Root cause**: Off-by-one error in `expProgress()` in `src/constants.ts`.

### The bug

The old formula treated `expForLevel(currentLevel)` as the **cumulative EXP at the start** of the current level, when it is actually the **EXP threshold to reach the next level** (i.e., the bar's max for the current level).

**Old code:**
```ts
export function expProgress(exp: number): number {
  const currentLevel = calculateLevel(exp);
  const currentLevelExp = expForLevel(currentLevel);     // ❌ e.g. 50 for level 1
  const nextLevelExp = expForLevel(currentLevel + 1);    // ❌ e.g. 141 for level 1
  const progress = (exp - currentLevelExp) / (nextLevelExp - currentLevelExp);
  return Math.min(1, Math.max(0, progress));
}
```

**Effect**: For level 1 (0–49 total EXP), `expProgress` computed `(exp - 50) / (141 - 50)`, which is always ≤ 0 for exp < 50. The bar stayed at 0% until the player accumulated 50+ EXP, and jumped to ~55% at 100 EXP instead of showing smooth progress.

### The fix

```ts
export function expProgress(exp: number): number {
  const currentLevel = calculateLevel(exp);
  const startOfLevel = currentLevel <= 1 ? 0 : expForLevel(currentLevel - 1);
  const endOfLevel = expForLevel(currentLevel);
  const progress = (exp - startOfLevel) / (endOfLevel - startOfLevel);
  return Math.min(1, Math.max(0, progress));
}
```

Now uses the **actual base EXP of the current level** (`startOfLevel`) instead of the next-level threshold. This is consistent with how `useXP.ts` already computes `expInLevel` and `expForCurrent`.

**Corrected behavior**:
- Level 1, 10 EXP → `(10 - 0) / (50 - 0) = 20%` (was 0%)
- Level 1, 40 EXP → `(40 - 0) / (50 - 0) = 80%` (was 0%)
- Level 2, 100 EXP → `(100 - 50) / (141 - 50) ≈ 55%` (unchanged)
- Level 2, 141 EXP → `(141 - 50) / (141 - 50) = 100%` (was 0%)

### Test update

**File**: `src/__tests__/useXP.test.ts`

Updated the `"calculates progress and in-level EXP correctly"` test to expect the corrected value:
- `result.current.progress` → `toBeCloseTo(1.0, 2)` (was `5/91 ≈ 0.549`)

---

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx vitest run` | ✅ 32/32 tests pass |

### Test output
```
✓ src/__tests__/useXP.test.ts (11 tests)
✓ src/__tests__/useTasks.test.ts (10 tests)
✓ src/__tests__/App.test.tsx (11 tests)
```

## Files changed

| File | Change |
|---|---|
| `src/components/TaskInput.tsx` | Font sizes boosted + Chinese→English text |
| `src/constants.ts` | Fixed `expProgress()` off-by-one calculation |
| `src/__tests__/useXP.test.ts` | Updated progress assertion to match fix |
