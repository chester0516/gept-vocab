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
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">全民英檢單字</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          GEPT 初級 ＋ 中級 · 共 {elemTotal + intTotal} 字
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: '已學會',
            value: knownCount,
            color: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: '收藏',
            value: favCount,
            color: 'text-amber-500 dark:text-amber-400',
          },
          {
            label: '錯題',
            value: wrongCount,
            color: 'text-rose-500 dark:text-rose-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
        <h2 className="font-semibold">學習進度</h2>
        <ProgressBar value={elemKnown} max={elemTotal} label="初級" />
        <ProgressBar value={intKnown} max={intTotal} label="中級" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('flashcard')}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl px-4 py-5 text-left"
        >
          <div className="text-lg font-semibold">字卡學習</div>
          <div className="text-sm text-blue-100 mt-1">翻牌記憶模式</div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('quiz')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
        >
          <div className="text-lg font-semibold">測驗模式</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            英選中 / 中選英 / 聽音
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
        >
          <div className="text-lg font-semibold">單字列表</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">查詢、收藏、標記</div>
        </button>
      </div>

      {recent.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 font-semibold">
            最近測驗紀錄
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {recent.map((r) => (
              <li key={r.date} className="px-4 py-3 flex items-center gap-3">
                <span className="text-slate-400 dark:text-slate-500 w-20">
                  {formatDate(r.date)}
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {r.level === 'elementary' ? '初級' : r.level === 'intermediate' ? '中級' : '混合'}
                </span>
                <span className="ml-auto font-semibold text-blue-600 dark:text-blue-400">
                  {r.correct}/{r.total}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs w-12 text-right">
                  {Math.round((r.correct / r.total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
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
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 underline underline-offset-2"
          >
            清除所有學習進度
          </button>
        </div>
      )}
    </div>
  );
}
