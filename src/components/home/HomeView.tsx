import type { UseProgress } from '../../hooks/useProgress';
import { elementaryWords, intermediateWords } from '../../lib/data';
import type { Level, View } from '../../types';
import { ProgressBar } from '../shared/ProgressBar';
import { BackupSection } from './BackupSection';

interface Props {
  progress: UseProgress;
  onNavigate: (view: View) => void;
}

function countByLevel(bag: Record<string, true>, level: Level): number {
  const list = level === 'elementary' ? elementaryWords : intermediateWords;
  return list.reduce((acc, w) => (bag[w.id] ? acc + 1 : acc), 0);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HomeView({ progress, onNavigate }: Props) {
  const knownCount = Object.keys(progress.state.knownIds).length;
  const favCount = Object.keys(progress.state.favoriteIds).length;
  const wrongCount = Object.keys(progress.state.wrongIds).length;

  const elemKnown = countByLevel(progress.state.knownIds, 'elementary');
  const intKnown = countByLevel(progress.state.knownIds, 'intermediate');
  const elemTotal = elementaryWords.length;
  const intTotal = intermediateWords.length;

  const recent = progress.state.history.slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 space-y-10">
      {/* Hero */}
      <header className="space-y-3">
        <p className="label-sc">A Quiet Place to Study</p>
        <h1 className="font-extrabold text-4xl sm:text-5xl text-ink tracking-tight leading-[1.1]">
          全民英檢單字
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed">
          GEPT 初級 ＋ 中級，共
          <span className="font-medium text-ink"> {elemTotal + intTotal} </span>
          個字。專為長時間閱讀設計。
        </p>
      </header>

      {/* Stats — three muted figures with serif numerals */}
      <section className="grid grid-cols-3 gap-px bg-line rounded-md overflow-hidden border border-line">
        {[
          { label: '已學會', value: knownCount, color: 'text-success' },
          { label: '收藏', value: favCount, color: 'text-warn' },
          { label: '錯題', value: wrongCount, color: 'text-danger' },
        ].map((s) => (
          <div key={s.label} className="bg-surface px-4 py-5 text-center">
            <div className="label-sc">{s.label}</div>
            <div
              className={`font-mono font-medium text-[2.25rem] leading-none mt-2 tabular-nums ${s.color}`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </section>

      {/* Progress card */}
      <section className="bg-surface border border-line rounded-md p-6 space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold text-xl text-ink">學習進度</h2>
          <span className="label-sc">Progress</span>
        </div>
        <ProgressBar value={elemKnown} max={elemTotal} label="初級" />
        <ProgressBar value={intKnown} max={intTotal} label="中級" />
      </section>

      {/* Actions — list-style entries with serif title + small caption */}
      <section className="space-y-px bg-line border border-line rounded-md overflow-hidden">
        {[
          {
            id: 'flashcard' as const,
            title: '字卡學習',
            caption: 'Flashcards · 翻牌記憶模式',
            roman: 'I',
          },
          {
            id: 'quiz' as const,
            title: '測驗模式',
            caption: 'Quiz · 英選中 / 中選英 / 聽音選詞',
            roman: 'II',
          },
          {
            id: 'library' as const,
            title: '單字列表',
            caption: 'Library · 查詢、收藏、標記',
            roman: 'III',
          },
        ].map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onNavigate(a.id)}
            className="group w-full bg-surface hover:bg-paper px-6 py-5 flex items-center gap-5 text-left transition-colors"
          >
            <span className="italic font-bold text-ink-mute text-lg w-6">{a.roman}</span>
            <span className="flex-1">
              <span className="block font-semibold text-lg text-ink">{a.title}</span>
              <span className="block text-sm text-ink-soft mt-0.5">{a.caption}</span>
            </span>
            <span className="text-ink-mute group-hover:text-ink transition-colors" aria-hidden>
              →
            </span>
          </button>
        ))}
      </section>

      {recent.length > 0 && (
        <section className="bg-surface border border-line rounded-md overflow-hidden">
          <div className="px-6 py-4 border-b border-line flex items-baseline justify-between">
            <h2 className="font-bold text-lg text-ink">最近測驗紀錄</h2>
            <span className="label-sc">Recent</span>
          </div>
          <ul className="divide-y divide-line text-sm">
            {recent.map((r) => (
              <li key={r.date} className="px-6 py-3 flex items-center gap-3">
                <span className="text-ink-mute font-mono text-xs w-20">{formatDate(r.date)}</span>
                <span className="text-ink-soft">
                  {r.level === 'elementary' ? '初級' : r.level === 'intermediate' ? '中級' : '混合'}
                </span>
                <span className="ml-auto font-mono font-medium tabular-nums text-ink">
                  {r.correct}
                  <span className="text-ink-mute"> / </span>
                  {r.total}
                </span>
                <span className="text-ink-mute text-xs w-12 text-right font-mono tabular-nums">
                  {Math.round((r.correct / r.total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <BackupSection progress={progress} />

      {(knownCount > 0 || favCount > 0 || wrongCount > 0 || recent.length > 0) && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (confirm('確定要清除全部學習進度嗎？此動作無法復原。')) {
                progress.resetAll();
              }
            }}
            className="text-xs text-ink-mute hover:text-danger underline underline-offset-4 decoration-line hover:decoration-danger"
          >
            清除所有學習進度
          </button>
        </div>
      )}
    </div>
  );
}
