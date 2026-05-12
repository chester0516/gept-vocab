import { useTheme } from '../hooks/useTheme';
import type { View } from '../types';
import { ThemeToggle } from './shared/ThemeToggle';

interface Props {
  view: View;
  onNavigate: (view: View) => void;
}

const items: { id: View; label: string; icon: JSX.Element }[] = [
  {
    id: 'home',
    label: '首頁',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'flashcard',
    label: '字卡',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    id: 'quiz',
    label: '測驗',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 9a3 3 0 1 1 6 0c0 2-3 3-3 5" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    id: 'library',
    label: '單字',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

export function Header({ view, onNavigate }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <>
      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur border-b border-line">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="mr-auto whitespace-nowrap font-serif text-xl text-ink tracking-tight"
          >
            <span className="italic">GEPT</span>
            <span className="ml-2 text-ink-soft">·</span>
            <span className="ml-2">單字</span>
          </button>
          {/* Desktop / tablet inline nav */}
          <nav className="hidden sm:flex gap-1">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  view === item.id ? 'text-ink font-medium' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {item.label}
                {view === item.id && (
                  <span className="absolute inset-x-3 -bottom-[17px] h-px bg-accent" />
                )}
              </button>
            ))}
          </nav>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-paper/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]"
        aria-label="主要導覽"
      >
        <div className="grid grid-cols-4 max-w-3xl mx-auto">
          {items.map((item) => {
            const active = view === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  active ? 'text-accent' : 'text-ink-mute active:text-ink'
                }`}
              >
                {item.icon}
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
