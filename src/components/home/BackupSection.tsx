import { useRef, useState } from 'react';
import type { UseProgress } from '../../hooks/useProgress';
import { buildExport, parseImport } from '../../lib/progress';

interface Props {
  progress: UseProgress;
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function BackupSection({ progress }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    kind: 'ok' | 'error';
    text: string;
  } | null>(null);

  const handleExport = () => {
    const data = buildExport(progress.state);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gept-vocab-progress-${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ kind: 'ok', text: '已下載備份檔案' });
  };

  const handleImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'replace' | 'merge',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseImport(text);
      const knownN = Object.keys(imported.knownIds).length;
      const favN = Object.keys(imported.favoriteIds).length;
      const wrongN = Object.keys(imported.wrongIds).length;
      const confirmText =
        mode === 'replace'
          ? `匯入並覆蓋目前進度？\n\n檔案內容：\n  已學會 ${knownN} 字\n  收藏 ${favN} 字\n  錯題 ${wrongN} 字\n  測驗紀錄 ${imported.history.length} 筆`
          : `合併匯入到目前進度？\n\n檔案內容：\n  已學會 ${knownN} 字\n  收藏 ${favN} 字\n  錯題 ${wrongN} 字\n  測驗紀錄 ${imported.history.length} 筆\n\n（合併會將兩邊的標記取聯集）`;
      if (!confirm(confirmText)) {
        e.target.value = '';
        return;
      }
      if (mode === 'replace') {
        progress.replace(imported);
      } else {
        progress.merge(imported);
      }
      setMessage({
        kind: 'ok',
        text: mode === 'replace' ? '匯入完成（已覆蓋）' : '合併完成',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '無法解析檔案';
      setMessage({ kind: 'error', text: `匯入失敗：${msg}` });
    } finally {
      e.target.value = '';
    }
  };

  const triggerImport = (mode: 'replace' | 'merge') => {
    if (!fileInputRef.current) return;
    fileInputRef.current.dataset.mode = mode;
    fileInputRef.current.click();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div>
        <h2 className="font-semibold">資料備份</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          進度存在瀏覽器本地。換瀏覽器或裝置時可用此匯出再匯入。
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm"
        >
          匯出備份
        </button>
        <button
          type="button"
          onClick={() => triggerImport('merge')}
          className="px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm hover:bg-slate-50 dark:hover:bg-slate-600"
        >
          合併匯入
        </button>
        <button
          type="button"
          onClick={() => triggerImport('replace')}
          className="px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm hover:bg-slate-50 dark:hover:bg-slate-600"
        >
          覆蓋匯入
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const mode = (e.target.dataset.mode as 'replace' | 'merge' | undefined) ?? 'merge';
          handleImport(e, mode);
        }}
      />
      {message && (
        <div
          className={`text-sm ${
            message.kind === 'ok'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
