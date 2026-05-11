const REPO_URL = 'https://github.com/chester0516/gept-vocab';

export function Footer() {
  const commit = __APP_COMMIT__;
  const version = __APP_VERSION__;
  const commitUrl = commit === 'dev' ? null : `${REPO_URL}/commit/${commit}`;

  return (
    <footer className="max-w-3xl mx-auto px-4 mt-8 mb-4 text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        如果這個網站對你有幫助，歡迎贊助或來信回饋
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href="https://paypal.me/chester0516"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0070ba] hover:bg-[#005ea6] active:bg-[#004d8a] text-white font-medium text-sm transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Donate via PayPal.me
        </a>
        <a
          href="mailto:chester0516@gmail.com"
          title="chester0516@gmail.com"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 6 10-6" />
          </svg>
          <span className="sr-only">Email me</span>
        </a>
      </div>
      <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
        v{version}
        {' · '}
        {commitUrl ? (
          <a
            href={commitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono hover:text-slate-600 dark:hover:text-slate-300 hover:underline"
          >
            {commit}
          </a>
        ) : (
          <span className="font-mono">{commit}</span>
        )}
      </p>
    </footer>
  );
}
