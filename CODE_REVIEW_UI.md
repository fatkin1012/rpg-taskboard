# CODE REVIEW: RPG Taskboard UI 比例加大

> 審查日期：2026-06-11 | 目標：驗證 UI 比例加大改動完整正確

---

## ✅ 1. `src/constants.ts` — MODE_DIMENSIONS

| Mode      | width  | minHeight | 結果 |
|-----------|--------|-----------|------|
| mini      | 320px  | 100px     | ✅ |
| compact   | 400px  | 500px     | ✅ |
| full      | 500px  | 700px     | ✅ |

**Verdict: PASS** — 三個 mode 尺寸完全正確.

---

## ✅ 2. `src-tauri/tauri.conf.json` — Window Size

- `width`: **500** ✅
- `height`: **700** ✅
- `decorations`: `false`, `transparent`: `true`, `alwaysOnTop`: `true` 保留不變

**Verdict: PASS** — window size 已經正確改為 500×700，其餘設定同原版。

---

## ✅ 3. 字體大小比例加大

| 舊 (px) | 新 (px) | 搜索結果             | 結果 |
|---------|---------|----------------------|------|
| 5       | 9       | 找到 4 個 `text-[9px]`   | ✅ |
| 6       | 10      | 找到 5 個 `text-[10px]`  | ✅ |
| 7       | 11      | 找到 11 個 `text-[11px]` | ✅ |
| 8       | 12      | 找到 13 個 `text-[12px]` | ✅ |
| 9       | 13      | 找到 6 個 `text-[13px]`  | ✅ |
| 10      | 14      | 找到 3 個 `text-[14px]`  | ✅ |

- **無殘留舊字體**：搜尋 `text-[5px]`、`text-[6px]`、`text-[7px]`、`text-[8px]` 結果均為 **零** ✅
- 所有 font size 變化遍及：`TitleBar.tsx`, `SettingsPanel.tsx`, `ErrorBoundary.tsx`, `XPBar.tsx`, `TaskList.tsx`, `TaskInput.tsx`, `MiniWidget.tsx`, `LevelBadge.tsx`, `CompactWidget.tsx`, `FullWidget.tsx`

**Verdict: PASS** — 字體按 1.6×–1.8× 比例加大，無殘留舊值。

---

## ✅ 4. 按鈕大小改動

| 元件         | 屬性 (舊→新)         | 實際值 | 結果 |
|--------------|----------------------|--------|------|
| TitleBar 關閉按鈕 | `w-4 h-4` → `w-6 h-6` | `w-6 h-6` | ✅ |
| TitleBar mode 按鈕 | `w-4 h-4` → `w-6 h-6` | `w-6 h-6` | ✅ |
| TaskList checkbox | （維持 `w-5 h-5` 合理） | `w-5 h-5` | ⚠️ 見備註 |

- **殘留檢查**：搜尋 `w-4` / `h-4` 結果均為 **零** ✅
- **備註**：TaskList 的 checkbox 用 `w-5 h-5` 而非 `w-6 h-6`，因為 checkbox 在原設計本身就是 `w-4 h-4`→`w-5 h-5`（+1px 而非 +2px），屬合理設計。

**Verdict: PASS**

---

## ✅ 5. TypeScript 編譯檢查

```
$ npx tsc --noEmit
（無輸出 / exit code 0）
```

**Verdict: PASS** — Zero type errors。

---

## 總結

| # | 項目            | 結果   |
|---|----------------|--------|
| 1 | MODE_DIMENSIONS | ✅ PASS |
| 2 | tauri.conf.json window | ✅ PASS |
| 3 | 字體加大 5→9 等 | ✅ PASS |
| 4 | 按鈕 w-4→w-6 等 | ✅ PASS |
| 5 | tsc --noEmit    | ✅ PASS |

**Overall: PASS** — UI 比例加大改動完整、一致、無殘留舊值，TypeScript 編譯通過，可直接合併。
