# CODE REVIEW V028 — RPG Taskboard UI Fixes

> 驗證時間：2026-06-11 13:27 UTC
> 目錄：`/tmp/rpg-taskboard-review/`

---

## ✅ 驗證清單

### 1. `src/components/TaskInput.tsx`

| 項目 | 狀態 | 說明 |
|------|------|------|
| 輸入框字體加大 | ✅ | `text-[15px]` (之前應為更細字型) |
| placeholder 改英文 | ✅ | `"Enter your quest…"` |
| button text 改英文 | ✅ | `"+ NEW QUEST"` (折疊態)、`"✓ Add Task"` (展開態提交按鈕) |

### 2. `src/constants.ts` — `expProgress()` off-by-one fix

- **Level 1 base EXP** 由 50 改為 **0** ✅
- 邏輯確認：
  - `calculateLevel(0)` → while 不會執行 → `Math.max(1, 0)` = **1**
  - `expProgress(0)`：`currentLevel=1` → `startOfLevel=0` (因 `level <= 1`) → `endOfLevel=50` → `progress=0/50=0` ✅
  - Level 1 範圍：EXP 0–50，progress 0–100%
  - Level 2 起始點為 EXP 51（跨過 50 threshold 後仍然 level 1，到 141 才升 level 2）
  - **邊界條件：** `exp=50` → `level=1`, `progress=1.0`（滿條但未升等）；`exp=141` → `level=2` ✅

### 3. `src/hooks/useXP.ts` — `expInLevel` 同 `progress` 一致

| 變數 | 公式 | 對應 `expProgress()` |
|------|------|---------------------|
| `expForCurrent` | `level <= 1 ? 0 : expForLevel(level - 1)` | 匹配 `startOfLevel` ✅ |
| `expInLevel` | `player.exp - expForCurrent` | 匹配 `exp - startOfLevel` ✅ |
| `expForNext` | `expForLevel(player.level)` | 匹配 `endOfLevel` ✅ |
| `progress` | `expProgress(player.exp)` | 直接使用同一函數 ✅ |

### 4. `src/components/XPBar.tsx` — progress bar width

- `percent = Math.min(100, Math.max(0, Math.round(progress * 100)))` ✅
- `style={{ width: \`${percent}%\` }}` — 正確使用百分比 ✅
- Clamp 下限 0%、上限 100% ✅

---

## ✅ 自動化驗證

| 指令 | 結果 |
|------|------|
| `npx tsc --noEmit` | ✅ **0 errors** (exit code 0) |
| `npx vitest run` | ✅ **32/32 passed**（3 test files, 567ms test runtime） |

---

## 📝 備註

- ErrorBoundary 測試因 `Bomb` 組件故意拋錯而產生 stderr 輸出，屬預期行為，不影響測試結果。
- `expProgress()` 極小機率出現 `exp > expForNext` 時 progress > 1.0，已有 `Math.min(1, ...)` 做 clamp。
- 所有四個檢查點 **通過**，無 blocking issues。

---

**結論：✅ UI 修復驗證通過**
