# CODE REVIEW — RPG Taskboard 視窗修復

**日期**: 2026-06-11  
**審查範圍**: Window sizing, positioning, drag, mode-switching, CSS layout  
**狀態**: **PASS** ✅

---

## 驗證結果詳細

### 1. `src-tauri/tauri.conf.json`
| 項目 | 預期 | 實際 | 結果 |
|------|------|------|------|
| `resizable` | `false` | `false` | ✅ |
| `center` | `false` | `false` | ✅ |
| `width` / `height` | 360 × 600 | 360 × 600 | ✅ |
| `transparent` | 保留 | `true` (保留) | ✅ |
| `decorations` | — | `false` (無 native  title bar) | ✅ |
| `alwaysOnTop` / `skipTaskbar` | — | 保留原有設定 | ✅ |

### 2. `src/utils/tauri.ts` — 4 helpers
| Helper | 存在 | 行為 |
|--------|------|------|
| `startWindowDrag()` | ✅ | 調用 `win.startDragging()`，non-Tauri 優雅降級 |
| `setWindowSize(width, height)` | ✅ | 使用 `PhysicalSize` 設定，非 Tauri 忽略 |
| `setWindowPosition(x, y)` | ✅ | 使用 `PhysicalPosition`，非 Tauri 忽略 |
| `getWindowPosition()` | ✅ | 回傳 `{x, y}` 或 `null` |

### 3. `src/components/Overlay.tsx`
- **Class**: `h-full w-full flex flex-col` ✅
- **Drag**: 使用 `startWindowDrag()` 透過 `data-drag-region` ✅
- **模式切換 resize**: `useEffect` 監聽 `mode` 變更，調用 `setWindowSize()` ✅
- **位置保存/載入**: 
  - 啟動時從 localStorage `rpg-taskboard-position` 還原位置 ✅
  - 每 2 秒 polling 保存位置 ✅
  - `window.blur` 時也保存位置 ✅
- **Keyboard shortcuts**: Escape/1/2/3/N 全部保留 ✅

### 4. `src/components/TitleBar.tsx`
- `cursor-grab` class 存在於最外層 div ✅
- `data-drag-region` 屬性存在於最外層 div ✅
- Button `stopPropagation()`:
  - 關閉按鈕: `e.stopPropagation()` ✅
  - ModeButton: `e.stopPropagation()` ✅
- 所有按鈕都正確阻止事件冒泡，避免觸發 drag ✅

### 5. `src/index.css`
- `#root { display: flex; flex-direction: column }` ✅
- `html, body, #root { width: 100%; height: 100% }` ✅
- `overflow: hidden` ✅
- `background: transparent !important` ✅（保留透明背景）

### 6. 型別檢查
```
$ npx tsc --noEmit
```
→ 零錯誤 ✅

### 7. 邊框/陰影/灰色邊框檢查
- Overlay：無 `border`、`outline`、`box-shadow` ✅
- TitleBar：只有 `border-b border-pixel-border`（底部邊框，預期行為）✅
- ErrorBoundary fallback：fixed overlay 有 `border`，但只在 crash 時顯示 ✅
- 透明背景：`background: transparent !important` 確保無灰色底 ✅

---

## 總結

所有 5 項檢查點全部通過。TypeScript 編譯無誤，CSS 佈局正確填滿透明視窗，drag/position/resize 邏輯完整，無殘留灰色邊框。

**Overall: PASS** ✅
