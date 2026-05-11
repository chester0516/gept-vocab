import { useTheme } from '../hooks/useTheme';
import type { View } from '../types';
import { ThemeToggle } from './shared/ThemeToggle';

interface Props {
  view: View;
  onNavigate: (view: View) => void;
}

const items: { id: View; label: string }[] = [
  { id: 'home', label: '首頁' },
  { id: 'flashcard', label: '字卡' },
  { id: 'quiz', label: '測驗' },
  { id: 'library', label: '單字' },
];

export function Header({ view, onNavigate }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="font-bold text-lg text-slate-900 dark:text-slate-100 mr-auto"
        >
          GEPT 單字
        </button>
        <nav className="flex gap-1">
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                view === item.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>
    </header>
  );
}
