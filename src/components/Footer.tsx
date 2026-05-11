const REPO_URL = 'https://github.com/chester0516/gept-vocab';

export function Footer() {
  const commit = __APP_COMMIT__;
  const version = __APP_VERSION__;
  const commitUrl = commit === 'dev' ? null : `${REPO_URL}/commit/${commit}`;

  return (
    <footer className="max-w-3xl mx-auto px-4 mt-8 mb-4 text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        如果這個網站對你有幫助，歡迎贊助
      </p>
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
