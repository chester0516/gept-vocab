# 例句填空題型（Cloze）設計

- **日期**：2026-05-14
- **目標**：在現有測驗模式新增第 4 種題型「例句填空」
- **題型代碼**：`cloze`
- **狀態**：設計完成，待 implementation plan

---

## 1. 動機

現有測驗有三種題型：
- `en2zh`：看英文選中譯
- `zh2en`：看中譯選英文
- `listen`：聽音選英文

三者都缺少**閱讀理解 / 上下文判斷**的訓練。GEPT 實際考試會在閱讀題裡測驗單字運用，題目給一句話、要求填入正確的字。新增 `cloze` 題型補上這個缺口。

跟 `zh2en` 的差異：
- `zh2en` 給的是脫離上下文的中譯
- `cloze` 給的是該字實際的英文句子上下文（可選擇要不要附中譯）

---

## 2. 使用者體驗

### 2.1 設定畫面（QuizSetup）

題型多選 chip 新增「例句填空」：

```
題型：[英→中] [中→英] [聽音] [例句填空]
```

勾「例句填空」後下方多出一個 toggle：

```
☐ 例句填空時顯示中文提示
```

未勾「例句填空」時這個 toggle hidden。

### 2.2 答題畫面（QuizSession）

```
┌─────────────────────────────────────────────┐
│  例句填空                          題 5 / 20 │
│                                             │
│  The doctor ______ me to drink more         │
│  water every day.                           │
│                                             │
│  （醫生建議我每天多喝水）  ← 開啟提示時顯示       │
│                                             │
│  ┌──────────┐ ┌──────────┐                  │
│  │ 1 advise │ │ 2 agree  │                  │
│  ├──────────┤ ├──────────┤                  │
│  │ 3 ask    │ │ 4 bring  │                  │
│  └──────────┘ └──────────┘                  │
│                                             │
│  （選項皆為原型；上下文「The doctor ___ me」    │
│   提示這裡是動詞過去式 → 選 advise）             │
└─────────────────────────────────────────────┘
```

- 鍵盤 `1`–`4` 選答、`Enter` 下一題（沿用現有快捷鍵）
- 答題後正確選項變綠、錯誤變紅（沿用現有 feedback 樣式）
- 例句不發音（這是閱讀題）
- 不顯示詞性（避免額外提示）

### 2.3 結果畫面（QuizResult）

錯題回顧顯示完整未挖空的例句，把正確答案用 `[ ]` 標示：

```
The doctor [advised] me to drink more water every day.
你選：asked   ✗
```

---

## 3. 型別與資料結構

### 3.1 `types.ts` 變更

```ts
export type QuizType = 'en2zh' | 'zh2en' | 'listen' | 'cloze';

export interface QuizQuestion {
  type: QuizType;
  word: WordWithLevel;
  options: string[];
  answerIndex: number;
  // cloze 專用
  prompt?: string;        // 已挖空的句子: "The doctor ______ me to..."
  promptZh?: string;      // example_zh，only when showClozeHint=true
  blankAnswer?: string;   // 變形原樣: "advised"
}
```

### 3.2 `QuizConfig` 變更（quiz.ts）

```ts
export interface QuizConfig {
  level: Level | 'mixed';
  types: QuizType[];
  count: number;
  source: WordSource;
  showClozeHint: boolean;  // 新增；預設 false
}
```

### 3.3 localStorage 偏好持久化

沿用既有 `useLocalStorageState` 機制：
- `types` 持久化（若使用者上次勾了 cloze，下次預設保留）
- `showClozeHint` 持久化

---

## 4. 出題邏輯（quiz.ts）

### 4.1 變形偵測 `findBlankSpan(word, example)`

依序嘗試以下變形，第一個 `\b<form>\b` 命中的 form 即為挖空對象：

| 序 | 嘗試 form | 範例 |
|----|----------|------|
| 1 | `word` 原型 | abandon → abandon |
| 2 | `word + s` | bean → beans |
| 3 | `word + es` | wash → washes |
| 4 | `word + ed` | call → called |
| 5 | `word + d`（字尾為 e） | care → cared |
| 6 | `word + ing` | camp → camping |
| 7 | 字尾 e 去掉 + `ing` | care → caring |
| 8 | 字尾 y → `ies` | study → studies |
| 9 | 字尾 y → `ied` | study → studied |
| 10 | 不規則動詞白名單（~30–50 字） | run → ran/running、give → gave/given |

匹配採 case-insensitive；命中後回傳 `{ start, end, matchedForm }`。整個資料集應達到 99%+ 命中率（剩餘走不規則白名單兜底）。

實作位置：`src/lib/cloze.ts`（新檔，獨立模組方便測試）。

### 4.2 `buildClozeQuestion(word, pool)`

```
1. span = findBlankSpan(word.word, word.example)
2. 若 span 為 null → 回傳 null（呼叫端跳過此字）
3. prompt = example 中 [span.start, span.end] 區段替換為 '______'（6 字符）
4. blankAnswer = matchedForm（保留原大小寫）
5. distractors = pickClozeDistractors(pool, word, 3)
6. options = shuffle([word.word, ...distractors])
   - 注意：選項顯示的是「原型」word.word，不是變形
     （學習目標是認原型；變形是上下文提示）
7. return { type:'cloze', word, options, answerIndex, prompt, blankAnswer }
```

**為何選項顯示原型而非變形**：
- 學習目標是讓使用者認字根
- 顯示變形會洩漏題目線索（哪個是「動詞變形」就是答案）
- 上下文已足夠判斷，使用者看到 "The doctor ______ me" 自然知道要選動詞過去式

### 4.3 干擾項 `pickClozeDistractors(pool, word, 3)`

```
1. samePos = pool.filter(w => w.pos === word.pos && w.id !== word.id)
2. shuffle(samePos)，取 3 個（基於 word 欄位去重）
3. 若不足 3 個 → 從 pool 整體補滿（Set 去重）
```

### 4.4 `buildQuiz` 整合

現有邏輯 `picked.map((word, i) => buildQuestion(word, types[i % types.length], pool))` 改為：

```
- 對每個 picked word + 該題分配的 type 嘗試建構問題
- 若 type === 'cloze' 且 findBlankSpan 回傳 null → 從 sourcePool 抽下一個未使用的字補上
- 若整個 sourcePool 都耗盡仍湊不齊 count 題 → 回傳目前題目（沿用現有 0 題保護的處理方式）
```

---

## 5. UI 實作要點

### 5.1 `QuizSession.tsx`
- 用 `question.type === 'cloze'` 切換題幹版面：
  - 題幹文字：`question.prompt`
  - 若 `question.promptZh` 存在 → 下方灰字顯示中譯
- 選項按鈕沿用現有 component（不需新元件）
- 不渲染 SpeakerButton

### 5.2 `QuizSetup.tsx`
- 題型 chip 多一個 `{ value: 'cloze', label: '例句填空' }`
- 中譯提示 toggle：`showClozeHint` 狀態，僅當 `types.includes('cloze')` 時 render
- 切換 toggle 後寫回 localStorage

### 5.3 `QuizResult.tsx`
- 錯題回顧若 `answer.question.type === 'cloze'`：
  - 顯示 `word.example`（完整原句）
  - 把 `blankAnswer` 用 `[xxx]` 包起來（或用 `<strong>` 標起來）
  - 取代「英文 → 中譯」的單字配對版面

### 5.4 視覺
- 底線用固定 6 個 `_` 字符（不洩漏字長），CSS 可加微調 `letter-spacing` 讓視覺平衡
- 沿用既有「學院風」設計 token（PR #12 的 design system）

---

## 6. 邊界情況

| 情況 | 處理 |
|------|------|
| 變形偵測完全 miss 的字 | 不出 cloze 題；改抽下一個 |
| 同詞性 distractor < 3 個 | 從全 pool 補滿，Set 去重 |
| 例句有同字根多次出現 | `\b` word boundary，只挖第一個命中位置 |
| 大小寫（句首） | 變形偵測 case-insensitive；挖空時保留原大小寫（不洩漏「答案是否在句首」） |
| 例句太長（行動裝置） | 沿用現有題目卡片 padding，例句最長字串實測可容 |
| 使用者只勾 cloze + 範圍是「錯題」+ 錯題裡剛好都無法挖空 | 沿用現有「該範圍出不了題」的設定畫面提示（0 題保護） |
| 多選題型同時勾 cloze + 其他 | 沿用 `types[i % types.length]` 輪流分配 |

---

## 7. 測試

### 7.1 Unit tests（Vitest）

**`src/lib/cloze.test.ts`（新檔）**
- 變形偵測 11 個 case：原型、+s、+es、+ed、+d、+ing、e→ing、y→ies、y→ied、不規則白名單、無法匹配
- 資料品質鎖：跑全 3608 字 + example，斷言 99%+ 命中

**`src/lib/quiz.test.ts`（既有檔擴充）**
- `buildClozeQuestion`：正確產出 prompt、blankAnswer、options（含原型答案）
- 干擾項同詞性：mock pool，斷言 3 個 distractor 都是同 pos
- 同詞性不足 fallback：mock 出只有 1 個同 pos 的場景，斷言會從全 pool 補
- `buildQuiz` 整合：遇到無法挖空的字會自動換下一個

### 7.2 E2E（Playwright）

**`e2e/quiz-cloze.spec.ts`（新檔）**
- 桌面：勾「例句填空」→ 開始 → 看到底線題幹 → 鍵盤 `1` 選答 → 結果頁能看到完整例句 + `[答案]` 標示
- 桌面：開啟「顯示中譯提示」→ 看到中譯
- 行動：tap 4 個選項 + 切換中譯提示 toggle

### 7.3 Regression 防護

既有 38 unit + 18 e2e 不應退化。

---

## 8. SPEC.md 更新（PR 同步）

`SPEC.md §5.3 測驗（Quiz）` 把題型清單從三種改為四種：

```
- 四種題型：英選中 / 中選英 / 聽音選詞 / 例句填空（可複選）
```

---

## 9. 不做（明確排除）

- 例句不發音
- 不顯示詞性提示
- 不支援手動輸入文字答題（已決定為 4 選 1）
- 不做進階變形（被動式 been + p.p.、第三人稱 doesn't 等）— 若白名單需要再增補
- 不對所有單字保證能出 cloze 題（容忍 <1% 漏出率）

---

## 10. 待 implementation 階段確定的細節

- 不規則動詞白名單的具體名單：先跑一次資料分析，列出「規則嘗試 1–9 都 miss」的字（預估 50–100 個），人工挑出真正不規則的動詞
- `outputs/plans/` 位置：本檔依使用者 CLAUDE.md 規則放在 `outputs/plans/`
