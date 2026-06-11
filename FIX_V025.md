# FIX_V025 — 修復 rpg-taskboard 三大問題

> 日期: 2026-06-11
> 狀態: ✅ 完成

---

## 1️⃣ Unknown Publisher (Windows NSIS)

**根因**: Cargo.toml 的 `homepage`/`repository` URL 指向舊 repo，`copyright` 格式未對齊 NSIS 簽章 metadata。

**修改**:
- `src-tauri/Cargo.toml`
  - 已存在 `authors`, `description` — 無需改動
  - `homepage`: `https://github.com/rpg-taskboard/rpg-taskboard` → `https://github.com/fatkin1012/rpg-taskboard`
  - `repository`: `https://github.com/rpg-taskboard/rpg-taskboard` → `https://github.com/fatkin1012/rpg-taskboard`
  - `copyright`: `Copyright (c) 2024 RPG Task Board Team. All rights reserved.` → `Copyright (c) 2024 RPG Task Board`
- `src-tauri/tauri.conf.json`
  - 已存在 `bundle.publisher: "RPG Task Board"` — 無需改動

## 2️⃣ 視窗拖不動

**根因**: Tauri v2 的 `startDragging()` **必須**喺 mousedown event handler 嘅同步調用中觸發，唔可以 await。原本嘅 `startWindowDrag()` 係 `async`（用 `import()`），`handleMouseDown` 亦係 `async`，Tauri 捕捉唔到拖曳狀態。

**修改**:
- `src/utils/tauri.ts`
  - 改為 **static top-level import**（`import { getCurrentWindow } from '@tauri-apps/api/window'`）
  - `startWindowDrag()` 改為 **同步 function**（冇 `async`、冇 `await`）
  - `getTauriWindow()` 改為同步版本，用 cached instance 避免重複 import
- `src/components/Overlay.tsx`
  - `handleMouseDown` 由 `async` 改為 **同步**（`useCallback(async ...)` → `useCallback((... )`）
  - 用 `startWindowDrag()`（非 await）代替 `await startWindowDrag()`

## 3️⃣ 關閉後仲有透明視窗

**根因**: 兩個層面嘅問題：
1. 缺少 `src-tauri/capabilities/default.json` → Tauri v2 預設 block 咗 `window.close()`、`window.startDragging()` 等 API
2. 缺少 `exitRequestedBehavior: "exit"` → 關閉視窗後 app process 仍然喺背景 run

**修改**:
- **新增** `src-tauri/capabilities/default.json`：
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
- `src-tauri/tauri.conf.json`：
  - 加入 `"exitRequestedBehavior": "exit"`，確保關閉視窗前 app 會完全 terminate
- `src/components/TitleBar.tsx`：
  - `handleClose` 改為同步調用 `win.close()`（fire-and-forget），不再 import 唔存在嘅 `app` API

## 4️⃣ 驗證結果

```bash
$ npx tsc --noEmit
# 0 errors ✅
```

所有修改已完成，TypeScript 類型檢查通過。

---

## 修改檔案清單

| 檔案 | 變更類型 | 說明 |
|------|---------|------|
| `src-tauri/Cargo.toml` | 修改 | 更新 homepage/repository/copyright |
| `src-tauri/tauri.conf.json` | 修改 | 加入 `exitRequestedBehavior: "exit"` |
| `src-tauri/capabilities/default.json` | 新增 | Tauri v2 權限設定 |
| `src/utils/tauri.ts` | 重寫 | 同步化 startWindowDrag |
| `src/components/Overlay.tsx` | 修改 | handleMouseDown 改同步 |
| `src/components/TitleBar.tsx` | 修改 | close handler 簡化 + app.exit fallback 修正 |
