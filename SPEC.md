# 規格 / Specification

本文記錄 **GEPT 單字** 這個專案的目標、範圍、設計原則與技術選擇。  
和 `README.md`（給使用者）/ `WORKFLOW.md`（給開發者）的分工：
**SPEC = 為什麼**、**README = 是什麼**、**WORKFLOW = 怎麼合作**。

> 更新規則：功能 / 範圍 / 設計原則有實質變動時才改 SPEC。日常 bug fix、refactor、measurement-tweak 不用動。

---

## 1. 概覽

一個純前端、無後端、無帳號的 GEPT 初／中級單字學習網站。目標是給認真準備 GEPT 的人一個**乾淨、克制、可離線**的工具：翻字卡、做測驗、追蹤學習進度。所有資料留在使用者瀏覽器的 localStorage。

線上：<https://chester0516.github.io/gept-vocab/>  
原始碼：<https://github.com/chester0516/gept-vocab>

---

## 2. 目標 / Goals

- **G1. 涵蓋 GEPT 初中級單字**（目前 ~1800 + ~1800 ≈ 3600 字；對齊常見 GEPT 詞表，非 LTTC 官方版本）
- **G2. 三個核心學習模式**：字卡（被動記憶）、測驗（主動回想）、單字列表（搜尋與檢視）
- **G3. 進度可見**：已學會 / 收藏 / 錯題三類狀態，首頁儀表板可一眼掌握
- **G4. 零成本可用**：開瀏覽器即用，免登入、免安裝、免訂閱
- **G5. 視覺有質感**：避免「Tailwind 預設」/「AI 量產」的廉價感；學院風、長時間閱讀友善
- **G6. 工程紀律**：每個變更走 PR，CI（lint + format + typecheck + unit + e2e）必須綠才能 merge

---

## 3. 不做 / Non-goals

這些不是「永遠不做」，而是「目前刻意不做」。要做需要先重新評估架構成本。

- **N1. 使用者帳號／雲端同步**：沒有 server、不存使用者資料、不收集分析。換裝置就重來（透過 Export/Import 手動搬）
- **N2. 內建詞典查詢**：點 word 不會跳出其他語意解釋；查單字請用 Google 翻譯或字典 app
- **N3. 多語言介面**：UI 只有繁體中文。學習語言固定是 English → 繁中
- **N4. 自製單字 / 詞表上傳**：詞表固定為內建 elementary / intermediate
- **N5. Spaced repetition / SM-2 / Anki 演算法**：選詞策略目前是「依範圍洗牌」，不做時間衰減記憶模型
- **N6. 真人錄音**：發音用瀏覽器內建 `SpeechSynthesis`，品質受限於系統 TTS（macOS / Windows 較好、Linux 較差）
- **N7. 行動 app（iOS / Android）**：PWA / capacitor / RN 都不在計畫內，純 web
- **N8. 社交功能**：沒有排行榜、好友、分享學習進度

---

## 4. 對象 / Target users

主要：**準備 GEPT 初級或中級的中文母語者**，期待一個比 Quizlet 更安靜、比 Anki 更輕的工具。

次要：**已通過 GEPT、想維持單字量的人**（收藏 + 錯題模式對這類使用者最有用）。

明確排除：**對單字學習有強需求且願意付費的進階學習者**（他們需要 SRS、自製詞表、跨裝置同步 — 全在 N1–N5）。

---

## 5. 功能範圍 / Feature scope

當下實作。詳細互動請看 `README.md` 與各 component。

### 5.1 首頁（Home）
- 三張統計卡：已學會 / 收藏 / 錯題（進度條 vs 該等級總字數）
- 三個進入點：字卡、測驗、單字列表
- 最近 5 次測驗紀錄
- Footer 含 PayPal 贊助 + email 聯絡 + 版本號 + git SHA
- Export / Import 進度為 JSON

### 5.2 字卡（Flashcard）
- 3D 翻牌動畫，正面英文 / 背面中譯 + 例句
- 等級切換：初級 / 中級
- 範圍切換：隨機 / 收藏 / 錯題（取代舊的「字母順序」）
- 顯示切換：全部 / 未學會
- 語速切換：慢 / 中 / 快
- 卡上操作：星號（收藏）、勾號（已學會）、發音
- 鍵盤：`←` `→` 切換、`Space` 翻面
- **不變量**：toggle 收藏 / 已學會 不會讓眼前的卡片瞬移（穩定洗牌，由 unit test 鎖住）

### 5.3 測驗（Quiz）
- 四種題型：英選中 / 中選英 / 聽音選詞 / 例句填空（可複選）
- 範圍：全部 / 排除已學會 / 收藏 / 錯題
- 例句填空：給挖空例句 + 4 個原型單字選項，可選擇是否顯示中譯提示
- 題數：10 / 20 / 50
- 答錯自動加入錯題清單
- 結束後顯示分數、耗時、錯題回顧
- 鍵盤：`1`–`4` 選答、`Enter` 下一題

### 5.4 單字列表（Library）
- 搜尋（match word 或 zh）
- 篩選：等級、狀態（已學會 / 收藏 / 錯題 / 未學會）
- 每行可直接 toggle 狀態 + 發音

### 5.5 共用
- 深淺色主題切換，存 localStorage，預設跟系統
- 桌面：頂部 inline nav；手機：底部 tab bar
- 字型：Noto Sans + Noto Sans TC + JetBrains Mono（透過 Google Fonts CDN）

---

## 6. 設計原則 / Design principles

來自累積的 PR 決策與「學院風冷的誠懇」design system overhaul（PR #12）。

- **DP1. 暖色奶油底，非純白**：`--bg: 249 245 236` 給長時間閱讀友善的紙感
- **DP2. 純 sans 字型 + 字重做層級**：捨棄 serif/sans 混搭；用 `font-bold` / `font-extrabold` / `font-mono` 區分標題、正文、數字
- **DP3. CSS 變數 + Tailwind alpha**：所有顏色都是 `rgb(var(--x) / <alpha-value>)` token，深淺色切換不靠 class 反轉而是換變數值
- **DP4. 動畫克制**：fade-in、translateY 6px 為主；無放大、無 bounce、無 parallax
- **DP5. 紙紋理但不喧賓奪主**：inline SVG noise filter，opacity 0.035
- **DP6. 預設行為要對**：字卡預設「隨機」+「未學會」，測驗預設「全部」+ 10 題，都是最常見的學習場景
- **DP7. 鍵盤可達**：所有主要操作（翻牌、切換、答題）皆有鍵盤捷徑
- **DP8. 不打斷使用者**：不彈窗、不上 cookie 條、不要求授權、不打通知

---

## 7. 技術架構 / Architecture

- **Stack**：Vite 5 + React 18 + TypeScript + Tailwind 3
- **狀態管理**：純 React hooks（`useProgress`、`useTheme`、`useSpeech`、`useLocalStorageState`）。沒有 Redux / Zustand / Context
- **路由**：沒有 router；用 `App.tsx` 內 `view` state 切換條件渲染（4 個 view + 測驗 setup → session → result 子狀態）
- **部署**：GitHub Pages，由 `.github/workflows/deploy.yml` 觸發；base path `/gept-vocab/`
- **品質閘**：`.github/workflows/ci.yml` 跑 Biome + tsc + Vitest + Playwright，全綠才可 merge
- **預提交**：Husky + lint-staged 對 `src/**/*.{ts,tsx}` 跑 `biome check --write`

### 模組職責

| 路徑 | 責任 |
|---|---|
| `src/data/` | 單字資料 JSON（純資料，無邏輯） |
| `src/lib/data.ts` | 載入 + 合併等級 + 賦 `id` |
| `src/lib/progress.ts` | 進度狀態的 pure functions（toggle / merge / save / load）+ localStorage |
| `src/lib/quiz.ts` | 題目生成、選項干擾項、分數計算 |
| `src/hooks/` | 上述 lib 的 React 包裝（add reactive state） |
| `src/components/` | UI，依模組分子目錄（home / flashcard / quiz / library / shared） |
| `e2e/` | Playwright 端對端測試，跑 Desktop Chrome + Pixel 5 兩個 project |

---

## 8. 資料模型 / Data model

定義在 `src/types.ts`。

```ts
// 單字
interface Word {
  word: string;       // English
  pos: string;        // part of speech, e.g. "v." / "n."
  zh: string;         // 中文意思，多個用 ";" 分隔
  example?: string;
  example_zh?: string;
}
interface WordWithLevel extends Word {
  level: 'elementary' | 'intermediate';
  id: string;         // 'elem-<word>' or 'inter-<word>'，跨等級唯一
}

// 進度（localStorage 主結構）
interface ProgressState {
  knownIds: Record<string, true>;       // 已學會
  favoriteIds: Record<string, true>;    // 收藏
  wrongIds: Record<string, true>;       // 錯題
  history: QuizRecord[];                // 最近測驗紀錄
}

// 測驗
type QuizType = 'en2zh' | 'zh2en' | 'listen';
type WordSource = 'all' | 'favorites' | 'wrong' | 'excludeKnown';
```

> ⚠️ Flashcard 的 `scope` 型別（`'random' | 'favorites' | 'wrong'`）與 Quiz 的 `WordSource` 概念重疊但尚未統一。記在第 12 節。

---

## 9. 儲存與隱私 / Persistence & privacy

- **儲存位置**：使用者瀏覽器 localStorage，完全 client-side
- **儲存內容**：進度（`ProgressState`）、UI 偏好（語速、預設等級、範圍、深淺主題、隱藏已學會）
- **量級**：~3600 個 word id × boolean ≈ 數十 KB，遠低於 localStorage 5–10 MB 上限
- **跨裝置**：不支援，需手動 Export JSON → 在新裝置 Import
- **不收集**：無 analytics、無錯誤回報、無 cookie；網站不發任何外部 request（除 Google Fonts CDN）
- **清除**：使用者可在「首頁 → 清除所有進度」一鍵抹除

### LocalStorage keys

| Key | 用途 |
|---|---|
| `gept-vocab-progress-v1` | 主進度（`ProgressState` 序列化） |
| `gept-flashcard-level` | 預設等級 |
| `gept-flashcard-hide-known` | 字卡是否隱藏已學會 |
| `gept-flashcard-scope` | 字卡範圍（隨機 / 收藏 / 錯題） |
| `gept-speech-rate` | 發音語速 |
| `gept-theme` | 深淺色 |

> 廢棄 key 一律在下次相關 component mount 時清理（見 PR #14、#15）。

---

## 10. 可訪問性 / Accessibility

目標 **Lighthouse Accessibility ≥ 90**（尚未實測，僅為設計時自我約束）。具體做法：

- 所有互動元素都是 `<button>` / `<a>`，鍵盤可達
- 字卡上的 icon button 有 `aria-label`（星號 = `收藏`，勾號 = `已學會`）
- 字卡設定區包成 `<section aria-label="字卡設定">`
- 空狀態提示加 `role="status" aria-live="polite"`
- 顏色對比：accent (`#2b3a55`) vs paper (`#f9f5ec`) 對比 ≥ 11:1
- 深色模式獨立調色，非簡單反轉

**尚未完成**：
- 字卡星號 / 勾號 button 的 `aria-label` 沒依狀態切換（「加入收藏」/「取消收藏」），目前固定 `收藏` — 記在第 12 節
- 全站 i18n / RTL 不支援，也不打算（見 N3）

---

## 11. 瀏覽器支援 / Browser support

- **必須支援**：最新版 Chrome / Safari / Edge / Firefox（桌面 + 行動）
- **發音功能**：依賴 `window.speechSynthesis` — 全部現代瀏覽器有，但 Linux 系統 voice 通常較差
- **不測試但盡力**：iOS Safari 私密模式（localStorage 仍可用，但 sessionStorage scope 行為不同）
- **不支援**：IE 11、KaiOS、其他 legacy 瀏覽器

---

## 12. 未來可能（非承諾）/ Future considerations

按優先序排，**只是清單**，未進 backlog 也未承諾。每個都需要先評估能否在現有 non-goals 框架內做。

| # | 想法 | 與現有 non-goals 的衝突 |
|---|---|---|
| F1 | 字卡星號 / 勾號的 `aria-label` 依狀態切文案 | 無，純 polish |
| F2 | 統一 `WordSource`（Quiz）與 Flashcard `scope` | 無，純 refactor |
| F3 | ADR 系列開始：技術選擇紀錄 | 無 |
| F4 | 中高級詞表（GEPT 高級或 TOEIC 進階） | 與 N4「不上傳自製詞表」不衝突；只是擴充內建 |
| F5 | 字卡「最近答錯」連發模式（不是 SRS，只是排序） | 邊緣觸及 N5；屬「弱版本」可接受 |
| F6 | 例句的另外發音 voice 選項 | 無，UI 範圍 |
| F7 | PWA（offline 可用） | 與現有 client-only 架構相容；只是 service worker 工程 |
| F8 | A/B 一個更簡的字卡 / 列表配色 variant | 純設計 iteration |

**這些一律 NO**（會破壞 N1–N8 的核心定位，要做就是另一個專案）：
- 帳號 / OAuth
- 後端 / 資料庫
- 任何形式的 telemetry
- 內建詞典 / 翻譯 API

---

## 13. 待決定 / Open questions

開放讓未來自己（或 reviewer）回答的問題。

- **Q1**：詞表要不要對齊到 LTTC 官方版本？目前是「常見 GEPT 等級」，若有官方授權問題或詞表更新需求需重看
- **Q2**：要不要把 `~/.claude/plans/` 內的歷史 implementation plan 整理進 `docs/plans/` 變成版控可追溯？（trade-off：是污染還是有用紀錄）
- **Q3**：F5「最近答錯連發」要不要做？做了會不會 scope creep 成 N5 的開頭？
