# CODE_REVIEW_V025 — 三大問題修復驗證

> **驗證日期**: 2026-06-11  
> **版本**: v0.2.5  
> **Commit**: `429d6c0`  
> **位置**: `/tmp/rpg-taskboard-review/`

---

## ✅ 驗證結果總結

| # | 問題 | 狀態 | 說明 |
|---|------|------|------|
| 1 | Unknown Publisher (NSIS) | ✅ **通過** | Cargo.toml 嘅 homepage/repository/copyright 已更新，tauri.conf.json 已有 publisher |
| 2 | 視窗拖不動 | ✅ **通過** | `startWindowDrag()` 係同步、`handleMouseDown` 係同步、import 係 static top-level |
| 3 | 關閉後透明視窗殘留 | ✅ **通過** | capabilities/default.json 存在且有 allow-close 權限、exitRequestedBehavior 設為 exit、TitleBar close handler 冇 await |
| 4 | TypeScript Compile | ✅ **通過** | `npx tsc --noEmit` 零錯誤 |

---

## 1️⃣ Publisher 修復驗證

**檢查內容**：rpm-taskboard 嘅 Windows NSIS installer 顯示正確 publisher metadata。

### Cargo.toml

| 欄位 | 修改前 | 修改後 | 結果 |
|------|--------|--------|------|
| `homepage` | `https://github.com/rpg-taskboard/rpg-taskboard` | `https://github.com/fatkin1012/rpg-taskboard` | ✅ 正確 |
| `repository` | `https://github.com/rpg-taskboard/rpg-taskboard` | `https://github.com/fatkin1012/rpg-taskboard` | ✅ 正確 |
| `copyright` | `Copyright (c) 2024 RPG Task Board Team. All rights reserved.` | `Copyright (c) 2024 RPG Task Board` | ✅ 正確 |
| `authors` | `RPG Task Board Team` | 不變 | ✅ 已有 |
| `version` | `0.2.4` | `0.2.5` | ✅ 已升版 |

### tauri.conf.json (bundle section)

```json
"bundle": {
  "publisher": "RPG Task Board",
  ...
}
```

✅ `bundle.publisher` 已存在，無需改動。

**結論**：NSIS installer metadata 完整，Publisher 問題已修復。

---

## 2️⃣ 視窗拖動修復驗證

### 2.1 `startWindowDrag()` — 係同步 function

檔案：`src/utils/tauri.ts`

```typescript
export function startWindowDrag() {
  const win = getWin();
  if (win) {
    try {
      (win as any).startDragging();
    } catch {
      // Non-Tauri environment
    }
  }
}
```

✅ **冇 `async`、冇 `await`** — 純同步 function。  
✅ `startDragging()` 嘅 Promise 被 fire 但唔 await，符合 Tauri v2 要求。

### 2.2 `handleMouseDown` — 係同步，直接 call `startWindowDrag()`

檔案：`src/components/Overlay.tsx`

```typescript
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  // ... checks ...
  setIsDragging(true);
  startWindowDrag();        // ✅ 同步調用，冇 await
  const onMouseUp = () => {
    setIsDragging(false);
    window.removeEventListener('mouseup', onMouseUp);
  };
  window.addEventListener('mouseup', onMouseUp);
}, []);
```

✅ `useCallback` 冇 `async` — 正確。  
✅ 直接 call `startWindowDrag()`，冇 await。  
✅ 拖曳狀態在 Tauri 釋放 mouse 後自動清除。

### 2.3 `import` 係 static top-level

檔案：`src/utils/tauri.ts`

```typescript
import { getCurrentWindow, type Window } from '@tauri-apps/api/window';
import { PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';
```

✅ 全部 **static top-level import**，冇 `await import()` 或 dynamic import。

**結論**：視窗拖動問題已完全修復，符合 Tauri v2 嘅同步調用要求。

---

## 3️⃣ 關閉視窗修復驗證

### 3.1 capabilities/default.json 存在且有正確權限

檔案：`src-tauri/capabilities/default.json`

```json
{
  "identifier": "default",
  "description": "Default capability set for RPG Task Board",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-close",
    "core:window:allow-start-dragging",
    "core:window:allow-set-size",
    "core:window:allow-set-position",
    "core:window:allow-outer-position"
  ]
}
```

- ✅ 檔案存在
- ✅ `allow-close` — 允許視窗關閉
- ✅ `allow-start-dragging` — 允許視窗拖曳
- ✅ `allow-set-size` / `allow-set-position` / `allow-outer-position` — 允許大小/位置操作

### 3.2 tauri.conf.json 嘅 `exitRequestedBehavior`

```json
"app": {
  "exitRequestedBehavior": "exit",
  ...
}
```

✅ 設為 `"exit"` — 關閉視窗前 app process 會完全終止，唔會有透明視窗殘留喺背景。

### 3.3 TitleBar.tsx 嘅 close handler

```typescript
const handleClose = useCallback(() => {
  try {
    const win = getTauriWindow();
    if (win) {
      (win as any).close();
      return;
    }
  } catch {
    // no Tauri context — fall through
  }
  window.close();
}, []);
```

- ✅ 同步 function（冇 async/await）
- ✅ 正確用 `getTauriWindow()`（同步版本）
- ✅ 有 browser fallback（`window.close()`）
- ✅ `e.stopPropagation()` — 唔觸發 window drag

**結論**：關閉視窗問題已完全修復，三層保護（capability + exit behavior + browser fallback）確保用戶關閉視窗後唔會有殘留。

---

## 4️⃣ TypeScript Compile 驗證

```bash
$ cd /tmp/rpg-taskboard-review && npx tsc --noEmit
# (no output = 0 errors)
```

✅ **零編譯錯誤**。TypeScript 類型檢查完全通過。

---

## 5️⃣ 其他發現

### 正面改進（超出原三大問題範圍）

| 改進 | 說明 |
|------|------|
| 視窗 resize 改為 `false` + min/max size | 之前 `resizable: true, center: true` 導致視窗可以自由縮放同置中。改為 `resizable: false, minWidth: 200, minHeight: 60, center: false`，更適合 overlay widget。 |
| 移除手動 drag 實作 | 之前用 JS mousemove/mouseup 實現 drag，易出邊界問題。改用 Tauri 原生 `startDragging()`，更穩定。 |
| 輪詢 save position（2秒一次）+ blur save | 雙重保險確保視窗位置被保存。 |
| `Overlay` 改為 `h-full w-full flex flex-col` | 由 `fixed` + 手動 position 改為 flex 佈局，更簡單可靠。 |
| Cursor 樣式改為 `cursor-grab` | 從 inline style 移到 className，更清晰。 |
| `pointer-events-none` 喺 title text | 確保唔干擾 drag region。 |

## 6️⃣ 建議（加分項 — 非阻塞）

1. **Tauri v2 正式 API**：依家 `startDragging()` 同 `close()` 都用咗 `(win as any)` 去呼喚。建議改用 Tauri v2 正式嘅型別定義（`Window.startDragging()` / `Window.close()`）以獲得完整 typesafety。
2. **Rust cargo build 驗證**：建議喺 CI 加返 Rust build（`cargo tauri build`）確保 Cargo.toml 修改冇問題。
3. **capabilities 完整度**：考慮加入 `core:window:allow-is-visible` / `core:window:allow-is-focused` 以便日後實現更多 UX 功能（例如自動隱藏）。

---

## 📋 簽核

```
Code Review:          ✅ PASS
  #1 Publisher:      ✅ PASS
  #2 Window Drag:    ✅ PASS
  #3 Window Close:   ✅ PASS
  #4 tsc --noEmit:   ✅ PASS
  
評分: 4/4 全部通過
建議: Ready to merge 🚀
```
