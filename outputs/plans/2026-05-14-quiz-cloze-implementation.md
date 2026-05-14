# 例句填空題型（Cloze）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在現有測驗模式新增第 4 種題型「例句填空」（cloze），讓使用者透過上下文判斷填入正確單字。

**Architecture:** 出題邏輯獨立到 `src/lib/cloze.ts`（變形偵測 + 出題 + 干擾項），透過 `buildQuiz` 整合進現有流程；UI 在 QuizSetup 加 chip + 中譯提示 toggle，QuizSession 切換題幹版面，QuizResult 顯示完整例句 + 答案標示。

**Tech Stack:** React 18 · TypeScript · Vitest + RTL · Playwright · Biome · Tailwind

**Design 來源:** [outputs/plans/2026-05-14-quiz-cloze-design.md](2026-05-14-quiz-cloze-design.md)

---

## File Structure

**New files:**
- `src/lib/cloze.ts` — 變形偵測、`buildClozeQuestion`、`pickClozeDistractors`、不規則動詞表
- `src/lib/cloze.test.ts` — 變形偵測 + 資料品質鎖 + 出題單元測試
- `e2e/quiz-cloze.spec.ts` — 端到端流程

**Modified files:**
- `src/types.ts` — `QuizType` 加 `'cloze'`，`QuizQuestion` 加 `prompt`/`promptZh`/`blankAnswer`（optional）
- `src/lib/quiz.ts` — `QuizConfig.showClozeHint`、`buildQuiz` 整合 cloze 並支援 skip-on-fail
- `src/lib/quiz.test.ts` — buildQuiz 對 cloze 整合的測試
- `src/components/quiz/QuizSetup.tsx` — 題型 chip 加 cloze、加 `showClozeHint` toggle（用 `useLocalStorageState` 持久化）
- `src/components/quiz/QuizSession.tsx` — `type === 'cloze'` 時的題幹版面
- `src/components/quiz/QuizView.tsx` — `startQuiz` 接 `showClozeHint`
- `src/components/quiz/QuizResult.tsx` — 錯題回顧顯示完整例句 + `[blankAnswer]` 標示
- `SPEC.md` — §5.3 題型清單從三種改為四種

**Out of scope（明確不做）:**
- 其他 quiz 設定（level/count/source/types）的 localStorage 持久化 — 不在本 PR 範圍
- 進階變形（被動式、第三人稱否定、分詞等）

---

## Task 1: 型別擴充

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/quiz.ts:75-80` (QuizConfig)

- [ ] **Step 1.1: 擴充 `QuizType` 與 `QuizQuestion`**

修改 `src/types.ts`：

```ts
export type QuizType = 'en2zh' | 'zh2en' | 'listen' | 'cloze';

export interface QuizQuestion {
  type: QuizType;
  word: WordWithLevel;
  options: string[];
  answerIndex: number;
  // cloze 專用（其他題型為 undefined）
  prompt?: string;        // 已挖空例句: "The doctor ______ me to drink more water"
  promptZh?: string;      // example_zh，僅在 showClozeHint=true 時填入
  blankAnswer?: string;   // 原例句中該字實際出現的形態（變形原樣，保留大小寫）
}
```

- [ ] **Step 1.2: 擴充 `QuizConfig`**

修改 `src/lib/quiz.ts` 的 `QuizConfig`：

```ts
export interface QuizConfig {
  level: Level | 'mixed';
  types: QuizType[];
  count: number;
  source: WordSource;
  showClozeHint?: boolean;  // 新增；缺省視為 false
}
```

使用 optional 是為了避免影響現有測試（測試呼叫不帶此欄位仍能跑）。

- [ ] **Step 1.3: 型別檢查**

Run: `npm run check`
Expected: PASS（型別 + lint 皆無錯誤）

- [ ] **Step 1.4: Commit**

```bash
git add src/types.ts src/lib/quiz.ts
git commit -m "feat(quiz): add cloze type and config fields"
```

---

## Task 2: 變形偵測 — 規則部分（TDD）

**Files:**
- Create: `src/lib/cloze.ts`
- Create: `src/lib/cloze.test.ts`

- [ ] **Step 2.1: 寫變形偵測的失敗測試**

建立 `src/lib/cloze.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { findBlankSpan } from './cloze';

describe('findBlankSpan', () => {
  it('matches exact word', () => {
    expect(findBlankSpan('abandon', 'She decided to abandon her plan.')).toMatchObject({
      matchedForm: 'abandon',
    });
  });

  it('matches plural +s', () => {
    expect(findBlankSpan('bean', 'My mother always adds a few beans to the soup.')).toMatchObject({
      matchedForm: 'beans',
    });
  });

  it('matches +es', () => {
    expect(findBlankSpan('wash', 'He washes his hands every hour.')).toMatchObject({
      matchedForm: 'washes',
    });
  });

  it('matches past tense +ed', () => {
    expect(findBlankSpan('call', 'She called her mother.')).toMatchObject({
      matchedForm: 'called',
    });
  });

  it('matches +d when word ends in e', () => {
    expect(findBlankSpan('care', 'She really cares about her friends.')).toMatchObject({
      matchedForm: 'cares',
    });
    expect(findBlankSpan('advise', 'The doctor advised me to drink water.')).toMatchObject({
      matchedForm: 'advised',
    });
  });

  it('matches -ing', () => {
    expect(findBlankSpan('camp', 'We camped near the river.')).toMatchObject({
      matchedForm: 'camped',
    });
    expect(findBlankSpan('play', 'They are playing soccer outside.')).toMatchObject({
      matchedForm: 'playing',
    });
  });

  it('matches e→ing', () => {
    expect(findBlankSpan('care', 'She is caring for the children.')).toMatchObject({
      matchedForm: 'caring',
    });
  });

  it('matches y→ies', () => {
    expect(findBlankSpan('study', 'She studies hard every day.')).toMatchObject({
      matchedForm: 'studies',
    });
  });

  it('matches y→ied', () => {
    expect(findBlankSpan('study', 'She studied hard yesterday.')).toMatchObject({
      matchedForm: 'studied',
    });
  });

  it('returns null when no form matches', () => {
    expect(findBlankSpan('abandon', 'Completely unrelated sentence here.')).toBeNull();
  });

  it('returns start/end pointing to the matched substring', () => {
    const ex = 'She called her mother.';
    const r = findBlankSpan('call', ex);
    expect(r).not.toBeNull();
    if (r) expect(ex.slice(r.start, r.end)).toBe('called');
  });

  it('matches case-insensitively but preserves original case', () => {
    const ex = 'Abandon all hope, ye who enter.';
    const r = findBlankSpan('abandon', ex);
    expect(r).not.toBeNull();
    if (r) expect(ex.slice(r.start, r.end)).toBe('Abandon');
  });
});
```

- [ ] **Step 2.2: 跑測試確認 fail**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: FAIL — `Cannot find module './cloze'`

- [ ] **Step 2.3: 實作 `findBlankSpan`（規則部分）**

建立 `src/lib/cloze.ts`：

```ts
export interface BlankSpan {
  start: number;
  end: number;
  matchedForm: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function candidatesFromRules(word: string): string[] {
  const out = [word, word + 's', word + 'es', word + 'ed'];
  if (word.endsWith('e')) out.push(word + 'd');
  out.push(word + 'ing');
  if (word.endsWith('e')) out.push(word.slice(0, -1) + 'ing');
  if (word.endsWith('y')) {
    out.push(word.slice(0, -1) + 'ies');
    out.push(word.slice(0, -1) + 'ied');
  }
  return out;
}

function findFirstMatch(forms: string[], example: string): BlankSpan | null {
  for (const f of forms) {
    const re = new RegExp(`\\b${escapeRegex(f)}\\b`, 'i');
    const m = re.exec(example);
    if (m) {
      return { start: m.index, end: m.index + m[0].length, matchedForm: m[0] };
    }
  }
  return null;
}

export function findBlankSpan(word: string, example: string): BlankSpan | null {
  return findFirstMatch(candidatesFromRules(word), example);
}
```

- [ ] **Step 2.4: 跑測試確認 pass**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: PASS（11 tests）

- [ ] **Step 2.5: Commit**

```bash
git add src/lib/cloze.ts src/lib/cloze.test.ts
git commit -m "feat(cloze): add rule-based variant detection (findBlankSpan)"
```

---

## Task 3: 變形偵測 — CVC 雙寫子音 + 不規則動詞白名單

**Files:**
- Modify: `src/lib/cloze.ts`
- Modify: `src/lib/cloze.test.ts`

- [ ] **Step 3.1: 寫 CVC + 不規則的失敗測試**

在 `src/lib/cloze.test.ts` 的 `describe('findBlankSpan', ...)` 內加入：

```ts
  it('matches CVC doubling: nod → nodded', () => {
    expect(findBlankSpan('nod', 'He nodded his head.')).toMatchObject({ matchedForm: 'nodded' });
  });

  it('matches CVC doubling: tap → tapped', () => {
    expect(findBlankSpan('tap', 'She tapped on the shoulder.')).toMatchObject({
      matchedForm: 'tapped',
    });
  });

  it('matches CVC doubling: shrug → shrugged', () => {
    expect(findBlankSpan('shrug', 'He shrugged his shoulders.')).toMatchObject({
      matchedForm: 'shrugged',
    });
  });

  it('matches irregular: shake → shook', () => {
    expect(findBlankSpan('shake', 'The boy shook the bottle.')).toMatchObject({
      matchedForm: 'shook',
    });
  });

  it('matches irregular: shoot → shot', () => {
    expect(findBlankSpan('shoot', 'The archer shot an arrow.')).toMatchObject({
      matchedForm: 'shot',
    });
  });

  it('matches irregular: sting → stung', () => {
    expect(findBlankSpan('sting', 'The bee stung her finger.')).toMatchObject({
      matchedForm: 'stung',
    });
  });

  it('matches irregular: swear → swore', () => {
    expect(findBlankSpan('swear', 'She swore to protect her sister.')).toMatchObject({
      matchedForm: 'swore',
    });
  });
```

- [ ] **Step 3.2: 跑測試確認 fail**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: 7 個新 test FAIL

- [ ] **Step 3.3: 加入 CVC 雙寫規則 + 不規則動詞表**

修改 `src/lib/cloze.ts`：

```ts
// 不規則動詞表：規則嘗試都 miss 的單字。經資料分析後鎖定。
const IRREGULAR_FORMS: Record<string, string[]> = {
  shake: ['shook', 'shaken', 'shaking'],
  shoot: ['shot', 'shooting'],
  sting: ['stung', 'stinging'],
  swear: ['swore', 'sworn', 'swearing'],
};

// CVC = 子音-母音-子音 結尾，且尾子音不在 {w,x,y}。例：nod / tap / shrug。
// 命中時尾子音雙寫後加 ed/ing/er。
const CVC_PATTERN = /[bcdfghjklmnpqrstvz][aeiou][bcdfghjklmnprstvz]$/i;

function candidatesFromRules(word: string): string[] {
  const out = [word, word + 's', word + 'es', word + 'ed'];
  if (word.endsWith('e')) out.push(word + 'd');
  out.push(word + 'ing');
  if (word.endsWith('e')) out.push(word.slice(0, -1) + 'ing');
  if (word.endsWith('y')) {
    out.push(word.slice(0, -1) + 'ies');
    out.push(word.slice(0, -1) + 'ied');
  }
  if (CVC_PATTERN.test(word)) {
    const last = word[word.length - 1];
    out.push(word + last + 'ed', word + last + 'ing', word + last + 'er');
  }
  const irregular = IRREGULAR_FORMS[word.toLowerCase()];
  if (irregular) out.push(...irregular);
  return out;
}
```

（`findBlankSpan` 本身不需改，因為它已呼叫 `candidatesFromRules`。）

- [ ] **Step 3.4: 跑測試確認 pass**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: PASS（18 tests）

- [ ] **Step 3.5: Commit**

```bash
git add src/lib/cloze.ts src/lib/cloze.test.ts
git commit -m "feat(cloze): add CVC doubling + irregular verb whitelist"
```

---

## Task 4: 變形偵測 — 資料品質鎖

**Files:**
- Modify: `src/lib/cloze.test.ts`

- [ ] **Step 4.1: 加上資料集 99% 命中率的測試**

在 `src/lib/cloze.test.ts` 檔尾加入：

```ts
import { allWords } from './data';

describe('findBlankSpan dataset coverage', () => {
  it('matches at least 99% of words in their own example', () => {
    let hit = 0;
    const miss: string[] = [];
    for (const w of allWords) {
      if (findBlankSpan(w.word, w.example ?? '')) hit++;
      else miss.push(w.word);
    }
    const rate = hit / allWords.length;
    // 若 miss 太多，列出前幾個方便除錯
    if (rate < 0.99) {
      console.log('miss samples:', miss.slice(0, 20));
    }
    expect(rate).toBeGreaterThanOrEqual(0.99);
  });
});
```

- [ ] **Step 4.2: 跑測試確認 pass**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: PASS（命中率 ≥ 99.89%，鎖在 99% 留 buffer）

- [ ] **Step 4.3: Commit**

```bash
git add src/lib/cloze.test.ts
git commit -m "test(cloze): lock variant detection at >=99% dataset coverage"
```

---

## Task 5: 同詞性干擾項

**Files:**
- Modify: `src/lib/cloze.ts`
- Modify: `src/lib/cloze.test.ts`

- [ ] **Step 5.1: 寫干擾項的失敗測試**

在 `src/lib/cloze.test.ts` 加入：

```ts
import { pickClozeDistractors } from './cloze';
import type { WordWithLevel } from '../types';

const w = (id: string, word: string, pos: string): WordWithLevel => ({
  id, word, pos, zh: '',
  example: '', example_zh: '', level: 'elementary',
});

describe('pickClozeDistractors', () => {
  const target = w('1', 'cat', 'n.');

  it('returns 3 distractors all matching POS', () => {
    const pool = [
      target,
      w('2', 'dog', 'n.'),
      w('3', 'bird', 'n.'),
      w('4', 'fish', 'n.'),
      w('5', 'run', 'v.'),
      w('6', 'fast', 'adj.'),
    ];
    const out = pickClozeDistractors(pool, target, 3);
    expect(out).toHaveLength(3);
    expect(out).not.toContain('cat');
    expect(new Set(out).size).toBe(3);
    // POS check: 比對 pool 找出每個 word 的 pos
    const posOf = (word: string) => pool.find((p) => p.word === word)?.pos;
    for (const word of out) expect(posOf(word)).toBe('n.');
  });

  it('falls back to other POS when same-pos pool is too small', () => {
    const pool = [
      target,
      w('2', 'dog', 'n.'),     // 唯一同詞性
      w('3', 'run', 'v.'),
      w('4', 'jump', 'v.'),
      w('5', 'fast', 'adj.'),
    ];
    const out = pickClozeDistractors(pool, target, 3);
    expect(out).toHaveLength(3);
    expect(out).toContain('dog');  // 同詞性的一定要先用
  });

  it('returns fewer than count when whole pool cannot supply enough', () => {
    const pool = [target, w('2', 'dog', 'n.')];
    const out = pickClozeDistractors(pool, target, 3);
    expect(out).toHaveLength(1);
  });
});
```

- [ ] **Step 5.2: 跑測試確認 fail**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: 3 個新 test FAIL — `pickClozeDistractors is not exported`

- [ ] **Step 5.3: 實作 `pickClozeDistractors`**

在 `src/lib/cloze.ts` 加入：

```ts
import type { WordWithLevel } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickClozeDistractors(
  pool: WordWithLevel[],
  target: WordWithLevel,
  count: number,
): string[] {
  const seen = new Set<string>([target.word]);
  const out: string[] = [];

  // 1. 先抽同詞性
  const samePos = shuffle(pool.filter((w) => w.id !== target.id && w.pos === target.pos));
  for (const w of samePos) {
    if (out.length === count) break;
    if (seen.has(w.word)) continue;
    seen.add(w.word);
    out.push(w.word);
  }

  // 2. 不足再從 pool 整體補
  if (out.length < count) {
    const rest = shuffle(pool.filter((w) => w.id !== target.id && w.pos !== target.pos));
    for (const w of rest) {
      if (out.length === count) break;
      if (seen.has(w.word)) continue;
      seen.add(w.word);
      out.push(w.word);
    }
  }

  return out;
}
```

- [ ] **Step 5.4: 跑測試確認 pass**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: PASS（21 tests）

- [ ] **Step 5.5: Commit**

```bash
git add src/lib/cloze.ts src/lib/cloze.test.ts
git commit -m "feat(cloze): add same-pos distractor picker with fallback"
```

---

## Task 6: `buildClozeQuestion`

**Files:**
- Modify: `src/lib/cloze.ts`
- Modify: `src/lib/cloze.test.ts`

- [ ] **Step 6.1: 寫 `buildClozeQuestion` 的失敗測試**

在 `src/lib/cloze.test.ts` 加入：

```ts
import { buildClozeQuestion } from './cloze';

describe('buildClozeQuestion', () => {
  const target: WordWithLevel = {
    id: '1', word: 'advise', pos: 'v.', zh: '建議',
    example: 'The doctor advised me to drink more water.',
    example_zh: '醫生建議我多喝水。',
    level: 'elementary',
  };
  const pool: WordWithLevel[] = [
    target,
    w('2', 'agree', 'v.'),
    w('3', 'ask', 'v.'),
    w('4', 'bring', 'v.'),
    w('5', 'cat', 'n.'),
  ];

  it('produces prompt with blank replacing the variant form', () => {
    const q = buildClozeQuestion(target, pool, false);
    expect(q).not.toBeNull();
    if (!q) return;
    expect(q.type).toBe('cloze');
    expect(q.prompt).toBe('The doctor ______ me to drink more water.');
    expect(q.blankAnswer).toBe('advised');
  });

  it('options contain the base form, not the variant', () => {
    const q = buildClozeQuestion(target, pool, false);
    if (!q) throw new Error('expected question');
    expect(q.options).toContain('advise');
    expect(q.options).not.toContain('advised');
    expect(q.options[q.answerIndex]).toBe('advise');
    expect(q.options).toHaveLength(4);
  });

  it('omits promptZh when includeHint=false', () => {
    const q = buildClozeQuestion(target, pool, false);
    if (!q) throw new Error('expected question');
    expect(q.promptZh).toBeUndefined();
  });

  it('includes promptZh when includeHint=true', () => {
    const q = buildClozeQuestion(target, pool, true);
    if (!q) throw new Error('expected question');
    expect(q.promptZh).toBe('醫生建議我多喝水。');
  });

  it('returns null when the example does not contain the word', () => {
    const broken: WordWithLevel = {
      ...target,
      example: 'Completely unrelated example sentence.',
    };
    expect(buildClozeQuestion(broken, pool, false)).toBeNull();
  });
});
```

- [ ] **Step 6.2: 跑測試確認 fail**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: 5 個新 test FAIL — `buildClozeQuestion is not exported`

- [ ] **Step 6.3: 實作 `buildClozeQuestion`**

在 `src/lib/cloze.ts` 加入：

```ts
import type { QuizQuestion } from '../types';

const BLANK = '______'; // 6 個底線，固定不洩漏字長

export function buildClozeQuestion(
  word: WordWithLevel,
  pool: WordWithLevel[],
  includeHint: boolean,
): QuizQuestion | null {
  const example = word.example ?? '';
  const span = findBlankSpan(word.word, example);
  if (!span) return null;

  const prompt = example.slice(0, span.start) + BLANK + example.slice(span.end);
  const distractors = pickClozeDistractors(pool, word, 3);
  const options = shuffle([word.word, ...distractors]);

  return {
    type: 'cloze',
    word,
    options,
    answerIndex: options.indexOf(word.word),
    prompt,
    promptZh: includeHint ? word.example_zh : undefined,
    blankAnswer: span.matchedForm,
  };
}
```

- [ ] **Step 6.4: 跑測試確認 pass**

Run: `npm run test -- src/lib/cloze.test.ts`
Expected: PASS（26 tests）

- [ ] **Step 6.5: Commit**

```bash
git add src/lib/cloze.ts src/lib/cloze.test.ts
git commit -m "feat(cloze): add buildClozeQuestion"
```

---

## Task 7: 整合 cloze 進 `buildQuiz`

**Files:**
- Modify: `src/lib/quiz.ts`
- Modify: `src/lib/quiz.test.ts`

- [ ] **Step 7.1: 寫整合的失敗測試**

在 `src/lib/quiz.test.ts` 的 `describe('buildQuiz', ...)` 內加入：

```ts
  it('produces cloze questions with prompt and blankAnswer', () => {
    const out = buildQuiz(
      { level: 'elementary', types: ['cloze'], count: 3, source: 'all' },
      emptyProgress(),
    );
    expect(out).toHaveLength(3);
    for (const q of out) {
      expect(q.type).toBe('cloze');
      expect(q.prompt).toContain('______');
      expect(q.blankAnswer).toBeTruthy();
      expect(q.options).toHaveLength(4);
      expect(q.options[q.answerIndex]).toBe(q.word.word);
    }
  });

  it('cycles cloze with other types', () => {
    const out = buildQuiz(
      { level: 'elementary', types: ['en2zh', 'cloze'], count: 4, source: 'all' },
      emptyProgress(),
    );
    expect(out.map((q) => q.type)).toEqual(['en2zh', 'cloze', 'en2zh', 'cloze']);
  });

  it('omits promptZh by default and includes it when showClozeHint=true', () => {
    const off = buildQuiz(
      { level: 'elementary', types: ['cloze'], count: 1, source: 'all' },
      emptyProgress(),
    );
    expect(off[0].promptZh).toBeUndefined();

    const on = buildQuiz(
      {
        level: 'elementary',
        types: ['cloze'],
        count: 1,
        source: 'all',
        showClozeHint: true,
      },
      emptyProgress(),
    );
    expect(on[0].promptZh).toBeTruthy();
  });
```

- [ ] **Step 7.2: 跑測試確認 fail**

Run: `npm run test -- src/lib/quiz.test.ts`
Expected: 3 個新 test FAIL（buildQuiz 還沒處理 cloze）

- [ ] **Step 7.3: 修改 `buildQuiz` dispatch（不動 `buildQuestion` 簽章）**

修改 `src/lib/quiz.ts`：

1. 在檔頭加 import：

```ts
import { buildClozeQuestion } from './cloze';
```

2. 把 `buildQuiz` 整段改為：

```ts
export function buildQuiz(config: QuizConfig, progress: ProgressState): QuizQuestion[] {
  const sourcePool = selectSourceWords(config, progress);
  if (sourcePool.length === 0) return [];

  const distractorPool =
    config.level === 'mixed'
      ? allWords
      : config.level === 'elementary'
        ? elementaryWords
        : intermediateWords;

  const types = config.types.length > 0 ? config.types : (['en2zh'] as QuizType[]);
  const wantedCount = Math.min(config.count, sourcePool.length);
  const shuffled = shuffle(sourcePool);
  const out: QuizQuestion[] = [];
  let cursor = 0;

  while (out.length < wantedCount && cursor < shuffled.length) {
    const word = shuffled[cursor++];
    const type = types[out.length % types.length];
    let q: QuizQuestion | null;
    if (type === 'cloze') {
      q = buildClozeQuestion(word, distractorPool, config.showClozeHint ?? false);
    } else {
      q = buildQuestion(word, type, distractorPool);
    }
    // 若 q 為 null（通常是 cloze 變形偵測失敗），跳過此字從 shuffled 抽下一個
    if (q) out.push(q);
  }
  return out;
}
```

3. `buildQuestion` 的簽章不變（仍回傳 `QuizQuestion`、不處理 cloze）— 舊測試完全不受影響。

> 註：buildQuestion 內現有 fallthrough 邏輯把未識別的 type 當 listen 處理。理論上 'cloze' 不會走進來（dispatch 已隔開），但若想保險可在 buildQuestion 開頭加 `if (type === 'cloze') throw new Error('use buildClozeQuestion');`。本 plan 不做，保持最小變更。

- [ ] **Step 7.4: 跑全部測試**

Run: `npm run test`
Expected: PASS（既有 quiz.test 仍 pass、新增 3 個 cloze 整合 test pass）

- [ ] **Step 7.5: Commit**

```bash
git add src/lib/quiz.ts src/lib/quiz.test.ts
git commit -m "feat(quiz): integrate cloze into buildQuiz with skip-on-fail"
```

---

## Task 8: QuizSetup — 題型 chip 加 cloze

**Files:**
- Modify: `src/components/quiz/QuizSetup.tsx:16-20` (allTypes)

- [ ] **Step 8.1: 加入 cloze 項目**

修改 `src/components/quiz/QuizSetup.tsx`：

```ts
const allTypes: { id: QuizType; label: string; desc: string }[] = [
  { id: 'en2zh', label: '英選中', desc: '看英文選中譯' },
  { id: 'zh2en', label: '中選英', desc: '看中譯選英文' },
  { id: 'listen', label: '聽音選詞', desc: '播放發音選拼寫' },
  { id: 'cloze', label: '例句填空', desc: '看上下文選單字' },
];
```

同時把第 72 行的 `grid sm:grid-cols-3` 改為 `grid sm:grid-cols-2 md:grid-cols-4`，讓 4 個 chip 在桌面排成一列、平板兩列、手機一行一個。

- [ ] **Step 8.2: 跑型別檢查**

Run: `npm run check`
Expected: PASS

- [ ] **Step 8.3: Commit**

```bash
git add src/components/quiz/QuizSetup.tsx
git commit -m "feat(quiz-setup): add cloze chip in question types"
```

---

## Task 9: QuizSetup — 中譯提示 toggle + localStorage 持久化

**Files:**
- Modify: `src/components/quiz/QuizSetup.tsx`
- Modify: `src/components/quiz/QuizView.tsx`

- [ ] **Step 9.1: 在 QuizSetup 加 `showClozeHint` 狀態**

修改 `src/components/quiz/QuizSetup.tsx`：

1. 引入 `useLocalStorageState`：

```ts
import { useLocalStorageState } from '../../hooks/useLocalStorageState';
```

2. 把 `onStart` 的型別擴充，並在 `QuizSetup` 內加入 `showClozeHint` 狀態：

```ts
interface Props {
  progress: UseProgress;
  onStart: (config: {
    level: Level | 'mixed';
    types: QuizType[];
    count: number;
    source: WordSource;
    showClozeHint: boolean;
  }) => void;
}

export function QuizSetup({ progress, onStart }: Props) {
  const [level, setLevel] = useState<Level | 'mixed'>('elementary');
  const [types, setTypes] = useState<QuizType[]>(['en2zh']);
  const [count, setCount] = useState<number>(10);
  const [source, setSource] = useState<WordSource>('all');
  const [showClozeHint, setShowClozeHint] = useLocalStorageState<boolean>(
    'quiz.showClozeHint',
    false,
  );
  // ...其他不變
}
```

3. 在「題型」section 的 `</section>` 前、且 `types.includes('cloze')` 為真時，render toggle：

```tsx
        {types.includes('cloze') && (
          <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showClozeHint}
              onChange={(e) => setShowClozeHint(e.target.checked)}
              className="rounded border-line"
            />
            <span>例句填空時顯示中文提示</span>
          </label>
        )}
```

4. 修改最後 `onStart` 呼叫：

```tsx
onClick={() => onStart({ level, types, count, source, showClozeHint })}
```

- [ ] **Step 9.2: 修改 `QuizView.startQuiz` 接受新 config 欄位**

修改 `src/components/quiz/QuizView.tsx`：

```ts
  const startQuiz = (config: {
    level: Level | 'mixed';
    types: QuizType[];
    count: number;
    source: WordSource;
    showClozeHint: boolean;
  }) => {
    const questions = buildQuiz(config, progress.state);
    if (questions.length === 0) return;
    setStage({ kind: 'session', questions, level: config.level });
  };
```

`buildQuiz` 已接受 `showClozeHint`（optional），這裡會直接傳入。

- [ ] **Step 9.3: 跑型別檢查 + 測試**

Run: `npm run check && npm run test`
Expected: PASS

- [ ] **Step 9.4: Commit**

```bash
git add src/components/quiz/QuizSetup.tsx src/components/quiz/QuizView.tsx
git commit -m "feat(quiz-setup): add showClozeHint toggle with localStorage"
```

---

## Task 10: QuizSession — 渲染 cloze 題幹

**Files:**
- Modify: `src/components/quiz/QuizSession.tsx`

- [ ] **Step 10.1: 修改題目區塊**

修改 `src/components/quiz/QuizSession.tsx`：

1. 在第 22-26 行的 `useEffect` 加 cloze 排除（cloze 不發音）— 現有條件 `if (q.type === 'listen')` 已自動排除 cloze，不需改。

2. 修改第 59-64 行的 `prompt` 字串：

```ts
  const prompt =
    q.type === 'en2zh'
      ? '請選擇正確的中文意思'
      : q.type === 'zh2en'
        ? '請選擇對應的英文單字'
        : q.type === 'listen'
          ? '聽發音選正確拼寫'
          : '依上下文選出正確的字（原型）';
```

3. 修改第 92-109 行的題目顯示區塊，加入 cloze 分支：

```tsx
        <div className="text-center py-4">
          {q.type === 'en2zh' && (
            <div className="font-bold text-4xl sm:text-5xl text-ink tracking-tight">
              {q.word.word}
            </div>
          )}
          {q.type === 'zh2en' && (
            <div className="font-bold text-3xl sm:text-4xl text-ink tracking-tight">
              {q.word.zh}
            </div>
          )}
          {q.type === 'listen' && (
            <div className="flex flex-col items-center gap-3">
              <SpeakerButton text={q.word.word} size="lg" />
              <div className="label-sc">點擊喇叭再聽一次</div>
            </div>
          )}
          {q.type === 'cloze' && (
            <div className="space-y-3">
              <p className="text-lg sm:text-xl text-ink leading-relaxed tracking-tight">
                {q.prompt}
              </p>
              {q.promptZh && (
                <p className="text-sm text-ink-mute leading-relaxed">{q.promptZh}</p>
              )}
            </div>
          )}
        </div>
```

- [ ] **Step 10.2: 視覺微調（CSS）**

`______` 在預設字型下可能太細。為了讓底線視覺上更穩定，把它包在一個小 span：

把 `{q.prompt}` 改寫為 helper render（在 component 內部宣告，或直接 inline replace）：

```tsx
              <p className="text-lg sm:text-xl text-ink leading-relaxed tracking-tight">
                {q.prompt?.split('______').flatMap((part, i, arr) => {
                  const out = [<span key={`t-${i}`}>{part}</span>];
                  if (i < arr.length - 1) {
                    out.push(
                      <span key={`b-${i}`} className="font-mono text-ink tracking-wider">
                        ______
                      </span>,
                    );
                  }
                  return out;
                })}
              </p>
```

- [ ] **Step 10.3: 跑測試 + 型別檢查**

Run: `npm run check && npm run test`
Expected: PASS

- [ ] **Step 10.4: Commit**

```bash
git add src/components/quiz/QuizSession.tsx
git commit -m "feat(quiz-session): render cloze prompt with optional zh hint"
```

---

## Task 11: QuizResult — cloze 錯題回顧樣式

**Files:**
- Modify: `src/components/quiz/QuizResult.tsx`

- [ ] **Step 11.1: 修改錯題項目渲染**

修改 `src/components/quiz/QuizResult.tsx` 第 54-66 行的 `<li>`：

```tsx
            {wrong.map((a) => {
              const q = a.question;
              if (q.type === 'cloze') {
                const example = q.word.example ?? '';
                const before = q.blankAnswer
                  ? example.slice(0, example.indexOf(q.blankAnswer))
                  : example;
                const after = q.blankAnswer
                  ? example.slice(example.indexOf(q.blankAnswer) + q.blankAnswer.length)
                  : '';
                return (
                  <li key={q.word.id} className="px-5 py-3 space-y-1">
                    <div className="text-sm text-ink leading-relaxed">
                      {before}
                      <span className="font-semibold text-success">[{q.blankAnswer}]</span>
                      {after}
                    </div>
                    <div className="text-xs text-ink-mute">
                      你選：
                      <span className="font-medium text-danger">
                        {q.options[a.selectedIndex]}
                      </span>
                      <span className="ml-2 text-ink-mute">
                        正解：{q.options[q.answerIndex]}
                      </span>
                    </div>
                  </li>
                );
              }
              return (
                <li key={q.word.id} className="px-5 py-3 flex items-center gap-3">
                  <SpeakerButton text={q.word.word} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-ink">{q.word.word}</div>
                    <div className="text-sm text-ink-soft truncate">{q.word.zh}</div>
                  </div>
                  <div className="label-sc">
                    {q.word.level === 'elementary' ? '初級' : '中級'}
                  </div>
                </li>
              );
            })}
```

注意：`example.indexOf(q.blankAnswer)` 在大小寫敏感下用原大小寫 `blankAnswer`（已保留），所以能正確命中。

- [ ] **Step 11.2: 跑測試 + 型別檢查**

Run: `npm run check && npm run test`
Expected: PASS

- [ ] **Step 11.3: Commit**

```bash
git add src/components/quiz/QuizResult.tsx
git commit -m "feat(quiz-result): render cloze wrong items with example reveal"
```

---

## Task 12: SPEC.md 更新

**Files:**
- Modify: `SPEC.md` §5.3

- [ ] **Step 12.1: 找到並修改題型清單**

在 `SPEC.md` 中找到：

```
- 三種題型：英選中 / 中選英 / 聽音選詞（可複選）
```

改為：

```
- 四種題型：英選中 / 中選英 / 聽音選詞 / 例句填空（可複選）
```

同時在「範圍：全部 / 排除已學會 / 收藏 / 錯題」那行下方加一個 bullet：

```
- 例句填空：給挖空例句 + 4 個原型單字選項，可選擇是否顯示中譯提示
```

- [ ] **Step 12.2: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): mention cloze question type in §5.3"
```

---

## Task 13: E2E 測試

**Files:**
- Create: `e2e/quiz-cloze.spec.ts`

- [ ] **Step 13.1: 先看現有 e2e 模式**

Run: `ls e2e/ && cat e2e/$(ls e2e/ | grep quiz | head -1)`
Expected: 看到既有的 quiz e2e 測試結構（如果有的話）

如果沒有 quiz e2e 範例，看 `e2e/flashcard.spec.ts` 或類似檔案瞭解 helper、selector 慣例。

- [ ] **Step 13.2: 建立 cloze e2e**

建立 `e2e/quiz-cloze.spec.ts`：

```ts
import { expect, test } from '@playwright/test';

test.describe('Quiz cloze (例句填空)', () => {
  test('desktop: complete one cloze quiz from setup to result', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /測驗/ }).first().click();

    // 取消預設「英選中」、選「例句填空」
    await page.getByRole('button', { name: /英選中/ }).click();
    await page.getByRole('button', { name: /例句填空/ }).click();

    // 題數選 10（預設）→ 直接開始
    await page.getByRole('button', { name: /開始測驗/ }).click();

    // 預期看到底線題幹
    await expect(page.locator('text=______').first()).toBeVisible();

    // 用鍵盤 1 選第一個答案
    await page.keyboard.press('1');

    // 答完後出現「下一題」或「看結果」
    const nextBtn = page.getByRole('button', { name: /下一題|看結果/ });
    await expect(nextBtn).toBeVisible();
  });

  test('desktop: showClozeHint toggle reveals zh', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /測驗/ }).first().click();

    await page.getByRole('button', { name: /英選中/ }).click();
    await page.getByRole('button', { name: /例句填空/ }).click();

    // 勾「顯示中文提示」
    const toggle = page.getByRole('checkbox', { name: /例句填空時顯示中文提示/ });
    await toggle.check();

    await page.getByRole('button', { name: /開始測驗/ }).click();

    // 題目區應該有中文提示（包含中文字元）
    const promptArea = page.locator('.bg-surface').filter({ hasText: '______' }).first();
    await expect(promptArea.locator('text=/[一-鿿]/')).toBeVisible();
  });

  test('mobile: tap option works', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'mobile-only test');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: /測驗/ }).first().click();
    await page.getByRole('button', { name: /英選中/ }).click();
    await page.getByRole('button', { name: /例句填空/ }).click();
    await page.getByRole('button', { name: /開始測驗/ }).click();
    await expect(page.locator('text=______').first()).toBeVisible();

    // tap 第一個選項
    await page.locator('button').filter({ hasText: /^1/ }).first().click();
    await expect(page.getByRole('button', { name: /下一題|看結果/ })).toBeVisible();
  });
});
```

註：selector 可能需要依實際 DOM 結構微調；若 button name 有變，按實際 UI 修。執行 `npm run e2e:ui` 開 Playwright UI 模式逐步除錯。

- [ ] **Step 13.3: 跑 e2e**

Run: `npm run e2e -- quiz-cloze`
Expected: PASS（3 tests）

- [ ] **Step 13.4: Commit**

```bash
git add e2e/quiz-cloze.spec.ts
git commit -m "test(e2e): cover quiz cloze happy path on desktop and mobile"
```

---

## Task 14: 最終驗證

**Files:** 無變更，純驗證

- [ ] **Step 14.1: 跑全部檢查**

Run: `npm run check && npm run test && npm run e2e && npm run build`
Expected: 全 PASS（lint + type + 38+ unit + 18+ e2e + 成功 build）

- [ ] **Step 14.2: 手動煙霧測試**

Run: `npm run dev`，瀏覽器打開，手動驗證：
- 測驗頁勾「例句填空」chip → 出現底線題幹
- 勾「顯示中文提示」→ 中譯出現在例句下方
- 答錯一題 → 結果頁錯題回顧顯示完整例句 + 答案標示
- 重整頁面 → showClozeHint 偏好保留（仍勾選）

若都正常即完工。

- [ ] **Step 14.3: 開 PR**

```bash
git push -u origin <branch>
gh pr create --title "feat(quiz): add cloze (例句填空) question type" --body "..."
```

PR description 引用 design doc：`outputs/plans/2026-05-14-quiz-cloze-design.md`。

---

## Spec Coverage Check

| 設計 spec 章節 | 對應 task |
|---------------|-----------|
| §2.1 設定畫面 chip + toggle | Task 8, 9 |
| §2.2 答題畫面 cloze 版面 | Task 10 |
| §2.3 結果畫面 答案標示 | Task 11 |
| §3.1 型別擴充 | Task 1 |
| §3.2 QuizConfig | Task 1 |
| §3.3 localStorage（僅 showClozeHint）| Task 9 |
| §4.1 變形偵測規則 | Task 2, 3 |
| §4.2 buildClozeQuestion | Task 6 |
| §4.3 同詞性 distractor | Task 5 |
| §4.4 buildQuiz 整合 + skip-on-fail | Task 7 |
| §5 UI 實作要點 | Task 8, 9, 10, 11 |
| §6 邊界情況（命中率、fallback、case） | Task 2, 3, 4, 5, 6, 7 |
| §7.1 Unit tests | Task 2-7 |
| §7.2 E2E | Task 13 |
| §8 SPEC.md 更新 | Task 12 |
