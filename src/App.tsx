import { useState } from 'react';
import { FlashcardView } from './components/flashcard/FlashcardView';
import { Header } from './components/Header';
import { HomeView } from './components/home/HomeView';
import { LibraryView } from './components/library/LibraryView';
import { QuizView } from './components/quiz/QuizView';
import { useProgress } from './hooks/useProgress';
import type { View } from './types';

export default function App() {
  const [view, setView] = useState<View>('home');
  const progress = useProgress();

  return (
    <div className="min-h-full">
      <Header view={view} onNavigate={setView} />
      <main className="pb-24 sm:pb-12">
        {view === 'home' && <HomeView progress={progress} onNavigate={setView} />}
        {view === 'flashcard' && <FlashcardView progress={progress} />}
        {view === 'quiz' && <QuizView progress={progress} onHome={() => setView('home')} />}
        {view === 'library' && <LibraryView progress={progress} />}
      </main>
    </div>
  );
}
