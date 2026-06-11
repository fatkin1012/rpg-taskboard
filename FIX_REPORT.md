# FIX_REPORT — RPG Taskboard Window Overhaul

## Summary
修復 Tauri overlay widget 嘅視窗問題（雙層視窗、視窗鎖喺中間、視窗太細、灰色邊框）。

---

## 改動清單

### 1. `src-tauri/tauri.conf.json`

| 欄位 | 舊值 | 新值 | 原因 |
|------|------|------|------|
| `resizable` | `true` | `false` | 消除 resize 邊框（灰色邊框根源） |
| `center` | `true` | `false` | 開喺上次位置，唔鎖死中間 |
| `width` | `320` | `360` | 增大預設尺寸，顯示更多內容 |
| `height` | `500` | `600` | 同上 |
| `minWidth` | `280` | `200` | 配合 mini mode (200px) |
| `minHeight` | `360` | `60` | 配合 mini mode (60px) |

- `transparent: true` 保留：overlay widget 需要透明背景顯示桌布
- `decorations: false` 保留：自訂標題欄

### 2. `src/utils/tauri.ts` — 新增 Tauri Window API helpers

新增 4 個 function，全部有 `try/catch` 安全 fallback（非 Tauri 環境不 crash）：

- **`startWindowDrag()`** — 呼叫 `win.startDragging()`，由 OS 原生處理 window drag
- **`setWindowSize(width, height)`** — 呼叫 `win.setSize(new PhysicalSize(...))`
- **`setWindowPosition(x, y)`** — 呼叫 `win.setPosition(new PhysicalPosition(...))`
- **`getWindowPosition()`** — 呼叫 `win.outerPosition()`，回傳 `{x, y}` 或 `null`

### 3. `src/components/Overlay.tsx` — 核心重寫

#### 移除嘅嘢（造成雙層視窗嘅根源）：
- `fixed` 定位 + 手動 `left/top` → 以前係喺 transparent 視窗入面用 CSS 拖一個細 div，造成「視窗入面有另一個浮動面板」嘅雙層效果
- `position` state (`{x: 0, y: 0}`) + localStorage save/load → 改由 OS 管理 window 位置
- Drag 嘅 `mousemove`/`mouseup` 事件監聽 → 改用 Tauri 原生 `startDragging()`
- Content wrapper 嘅 `border`, `rounded-b-lg`, `shadow-lg` → 消除所有外框/陰影

#### 新增嘅嘢：
- `.overlay-window` div 改為 `h-full w-full flex flex-col` → **填滿 100% Tauri viewport**
- **Native OS dragging**：`handleMouseDown` 檢查 `data-drag-region` 後，直接 call `startWindowDrag()`
- **模式切換自動 resize**：`useEffect` 監聽 `mode` 變化 → call `setWindowSize()`
- **位置保存**：
  - Mount 時：從 localStorage 讀取上次位置 → `setWindowPosition()`
  - 每 2 秒 polling：保存當前 window 位置
  - Window blur 時：即時保存位置
- **Keyboard shortcuts** 保留 (1/2/3/n/Escape)

### 4. `src/components/TitleBar.tsx` — 微調

- `cursor-grab` 改為 Tailwind class（`className` 內），唔用 inline `style`
- Title text span 加 `pointer-events-none`，避免文字干擾 drag
- 保留 `data-drag-region`、所有 button 嘅 `e.stopPropagation()`、close handler

### 5. `src/index.css` — 強化填充

- `#root` 加 `display: flex; flex-direction: column` 確保 mount point 填滿
- 保留 `html, body, #root { width: 100%; height: 100% }`
- 保留 `background: transparent !important`（overlay 需要透明 bg）

### 6. `src/App.css`

- 保留所有 scrollbar / animation / font 樣式
- 冇需要更動（原本已冇多餘 border）

---

## 雙層視窗問題嘅技術說明

**以前：**
1. Tauri 開一個 320×500 嘅 `transparent` 視窗（有 resize border 因為 `resizable: true`）
2. Overlay div 用 `fixed` + `position.x/y` 喺視窗入面定位 — 但因為填入 100% 時冇得郁，實際係細 widget 浮喺透明視窗中間
3. 用戶見到：透明外層 + 裡面細 widget + 灰色 resize border = **雙層視窗**

**修復後：**
1. Overlay div `h-full w-full` 填滿整個 Tauri viewport
2. Drag 直接 call `startDragging()` → **OS 原生移動成個 Tauri 視窗**
3. `resizable: false` 消除所有 resize border
4. 透明背景只顯示必要嘅 widget UI，冇多餘透明空間

---

## 驗證

```
$ npx tsc --noEmit
✓ 0 errors
```
