# UI 比例修復報告 (UI_FIX_REPORT)

## 背景
- 原始 UI 視窗過細，字體 5-7px 在實際螢幕上無法閱讀
- 所有 widget 模式、字體大小、按鈕尺寸均按 **1.5x 比例加大**

---

## 1. src/constants.ts — MODE_DIMENSIONS 加大

| 模式    | 修改前                  | 修改後                   |
|---------|------------------------|-------------------------|
| mini    | width: 200px / minH: 60px  | width: 320px / minH: 100px |
| compact | width: 250px / minH: 360px | width: 400px / minH: 500px |
| full    | width: 320px / minH: 500px | width: 500px / minH: 700px |

## 2. src-tauri/tauri.conf.json — 初始視窗大小

| 屬性     | 修改前 | 修改後 |
|----------|--------|--------|
| width    | 360    | 500    |
| height   | 600    | 700    |

## 3. 字體大小映射

| 原字體 -> 新字體 | 比例 |
|----------------|------|
| text-[5px]    → text-[9px]   | ×1.8 |
| text-[6px]    → text-[10px]  | ×1.67 |
| text-[7px]    → text-[11px]  | ×1.57 |
| text-[8px]    → text-[12px]  | ×1.5 |
| text-[9px]    → text-[13px]  | ×1.44 |
| text-[10px]   → text-[14px]  | ×1.4 |

### 修改檔案詳細

| 檔案 | 改動項目 |
|------|---------|
| **MiniWidget.tsx** | text-[7px]→11px, text-[5px]→9px, XP float 9px→13px |
| **CompactWidget.tsx** | "DAILY QUESTS" header 7px→11px, XP float 9px→13px |
| **FullWidget.tsx** | stats row 7px→11px / 5px→9px (COMPLETED/TODAY/STREAK), task headers 7px→11px, "+N more" 6px→10px, XP float 10px→14px |
| **TitleBar.tsx** | title 9px→13px, close/ModeButton 10px→14px / 8px→12px; title bar height 24px→36px; button size w-4 h-4→w-6 h-6 |
| **TaskInput.tsx** | "+NEW QUEST" 8px→12px, input 9px→13px, difficulty buttons 7px→11px, submit/cancel 8px→12px |
| **TaskList.tsx** | empty state 8px→12px / 7px→11px, "+ more" 7px→11px, task name 8px→12px, checkbox w-3.5→w-5, checkmark 8px→12px, difficulty badge 6px→10px, delete btn 8px→12px |
| **LevelBadge.tsx** | avatar container w-8 h-8→w-12 h-12, emoji text-sm→text-base, "Lv." 8px→12px, "LEVEL UP!" 6px→10px |
| **XPBar.tsx** | "EXP" label 7px→11px, exp fraction 6px→10px, bar height h-3→h-5, Lv label 6px→10px |
| **SettingsPanel.tsx** | header 9px→13px, close btn 10px→14px, "Sound Effects" 8px→12px, toggle w-6 h-3→w-9 h-5 / knob w-2.5→w-3.5, Reset btn 8px→12px |
| **ErrorBoundary.tsx** | title 9px→13px, message 8px→12px, button 8px→12px |

## 4. 按鈕及尺寸類幅度調整

| 元素 | 原始 | 新值 |
|------|------|------|
| TitleBar mode buttons | w-4 h-4 | w-6 h-6 |
| TitleBar close button | w-4 h-4 | w-6 h-6 |
| TaskList checkbox | w-3.5 h-3.5 | w-5 h-5 |
| SettingsPanel toggle | w-6 h-3 | w-9 h-5 |
| SettingsPanel knob | w-2.5 h-2.5 | w-3.5 h-3.5 |
| XPBar height | h-3 | h-5 |
| LevelBadge avatar | w-8 h-8 | w-12 h-12 |
| TitleBar height | h-[24px] | h-[36px] |

## 5. TypeScript 檢查

```
npx tsc --noEmit
```
**結果：通過，無錯誤。**

---

## 總結

所有指定檔案已完成字體加大、按鈕/容器尺寸按比例加大、視窗尺寸調整，TypeScript 編譯無錯誤。UI 縮放問題已解決。
