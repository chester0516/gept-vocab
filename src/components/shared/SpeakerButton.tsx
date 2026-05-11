import { useSpeech } from '../../hooks/useSpeech';

interface Props {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  className?: string;
}

export function SpeakerButton({
  text,
  size = 'md',
  variant = 'light',
  className = '',
}: Props) {
  const { speak, supported } = useSpeech();
  if (!supported) return null;

  const sizeClass =
    size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const colorClass =
    variant === 'dark'
      ? 'bg-white/15 hover:bg-white/25 active:bg-white/35 text-white'
      : 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label={`朗讀 ${text}`}
      className={`${sizeClass} ${colorClass} rounded-full transition-colors flex items-center justify-center ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
