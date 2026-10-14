import { useState, useEffect } from 'react';
import type { Card, Deck, SRSGrade } from '../../types';
import { previewNextIntervals } from '../../lib/srs';
import { speakWord } from '../../lib/speech';
import confetti from 'canvas-confetti';
import {
  Volume2,
  X,
  RotateCw,
  Sparkles,
  Trophy,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface SRSReviewSessionProps {
  deck: Deck;
  cards: Card[];
  onReviewCard: (cardId: string, grade: SRSGrade) => Promise<void>;
  onClose: () => void;
}

export const SRSReviewSession: React.FC<SRSReviewSessionProps> = ({
  deck,
  cards,
  onReviewCard,
  onClose,
}) => {
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [resultsStats, setResultsStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  useEffect(() => {
    // Clone cards into queue
    setQueue([...cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(cards.length === 0);
  }, [cards]);

  const currentCard = queue[currentIndex];
  const intervalsPreview = currentCard ? previewNextIntervals(currentCard) : null;

  // Auto-play audio when a new card appears
  useEffect(() => {
    if (currentCard && !isCompleted) {
      speakWord(currentCard.word, deck.targetLang);
    }
  }, [currentIndex, isCompleted]);

  // Keyboard shortcut listener (Space to flip, 1-4 to grade)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1);
        if (e.key === '2') handleGrade(2);
        if (e.key === '3') handleGrade(3);
        if (e.key === '4') handleGrade(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentCard, isCompleted]);

  const handleGrade = async (grade: SRSGrade) => {
    if (!currentCard) return;

    // Trigger subtle haptic feedback for Android devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }

    // Track review statistics
    setResultsStats((prev) => {
      if (grade === 1) return { ...prev, again: prev.again + 1 };
      if (grade === 2) return { ...prev, hard: prev.hard + 1 };
      if (grade === 3) return { ...prev, good: prev.good + 1 };
      return { ...prev, easy: prev.easy + 1 };
    });

    await onReviewCard(currentCard.id, grade);
    setReviewedCount((prev) => prev + 1);

    // If grade is "Again" (1), push card to end of queue so user reviews it again in this session
    let updatedQueue = [...queue];
    if (grade === 1) {
      updatedQueue.push(currentCard);
      setQueue(updatedQueue);
    }

    // Move to next card
    if (currentIndex + 1 < updatedQueue.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handlePlayAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentCard) {
      speakWord(currentCard.word, deck.targetLang);
    }
  };

  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ¡Sesión Completada!
          </h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            Has repasado <strong className="text-slate-800">{reviewedCount}</strong> palabras hoy con el algoritmo SM-2.
          </p>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-center">
              <span className="block text-xs text-rose-600 font-semibold">Otra vez</span>
              <span className="text-lg font-black text-rose-700">{resultsStats.again}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-center">
              <span className="block text-xs text-amber-600 font-semibold">Difícil</span>
              <span className="text-lg font-black text-amber-700">{resultsStats.hard}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <span className="block text-xs text-emerald-600 font-semibold">Bien</span>
              <span className="text-lg font-black text-emerald-700">{resultsStats.good}</span>
            </div>
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-center">
              <span className="block text-xs text-sky-600 font-semibold">Fácil</span>
              <span className="text-lg font-black text-sky-700">{resultsStats.easy}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Volver a la colección</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const progressPercentage = Math.round(((currentIndex + 1) / queue.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col justify-between text-white p-4 sm:p-6 select-none">
      {/* Top Bar */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <span className="text-xs text-slate-400 font-medium block">{deck.title}</span>
            <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Repetición Espaciada SM-2
            </span>
          </div>
        </div>

        {/* Counter and Progress */}
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-300">
            {currentIndex + 1} / {queue.length}
          </span>
          <div className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Flashcard Container */}
      <div className="max-w-xl w-full mx-auto my-auto py-4">
        <div
          onClick={() => setIsFlipped((prev) => !prev)}
          className="relative min-h-[380px] sm:min-h-[420px] w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between cursor-pointer border border-slate-100 transition-transform active:scale-[0.99]"
        >
          {/* Card Top: Badges & Audio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentCard.partOfSpeech && (
                <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {currentCard.partOfSpeech}
                </span>
              )}
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                currentCard.state === 'MASTERED' ? 'bg-emerald-100 text-emerald-800' :
                currentCard.state === 'REVIEW' ? 'bg-indigo-100 text-indigo-800' :
                currentCard.state === 'LEARNING' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                {currentCard.state}
              </span>
            </div>

            <button
              onClick={handlePlayAudio}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-all shadow-xs cursor-pointer"
              title="Escuchar pronunciación"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Card Middle: Front or Back */}
          <div className="my-auto text-center space-y-4 py-4">
            {/* Word (Always visible or in front) */}
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {currentCard.word}
            </h2>

            {currentCard.phonetic && (
              <p className="text-sm font-mono text-indigo-600 font-medium">
                {currentCard.phonetic}
              </p>
            )}

            {/* Back Information (Shown when flipped) */}
            {isFlipped ? (
              <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {currentCard.translation}
                </div>

                {currentCard.definition && (
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    {currentCard.definition}
                  </p>
                )}

                {currentCard.example && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left max-w-md mx-auto">
                    <p className="text-xs sm:text-sm text-slate-800 font-medium italic">
                      "{currentCard.example}"
                    </p>
                    {currentCard.exampleTranslation && (
                      <p className="text-xs text-slate-500 mt-1">
                        {currentCard.exampleTranslation}
                      </p>
                    )}
                  </div>
                )}

                {currentCard.notes && (
                  <div className="text-xs text-slate-400">
                    💡 <em>{currentCard.notes}</em>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-8 text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <RotateCw className="w-4 h-4 animate-spin-slow" />
                <span>Toca o presiona Espacio para voltear</span>
              </div>
            )}
          </div>

          {/* Card Bottom: State / Hint */}
          <div className="text-center text-[11px] text-slate-400">
            {isFlipped ? '¿Qué tan bien recordaste esta palabra?' : 'Evocación Activa (Active Recall)'}
          </div>
        </div>
      </div>

      {/* Bottom Rating Buttons or Flip Button */}
      <div className="max-w-xl w-full mx-auto pb-4">
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-3 duration-150">
            {/* 1: Again */}
            <button
              onClick={() => handleGrade(1)}
              className="flex flex-col items-center justify-center py-3 px-1 sm:px-2 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold">Otra vez</span>
              <span className="text-[10px] text-rose-100 font-medium mt-0.5">
                {intervalsPreview?.[1]}
              </span>
              <span className="text-[9px] opacity-70 mt-1 hidden sm:inline">(1)</span>
            </button>

            {/* 2: Hard */}
            <button
              onClick={() => handleGrade(2)}
              className="flex flex-col items-center justify-center py-3 px-1 sm:px-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all shadow-lg shadow-amber-900/30 cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold">Difícil</span>
              <span className="text-[10px] text-amber-100 font-medium mt-0.5">
                {intervalsPreview?.[2]}
              </span>
              <span className="text-[9px] opacity-70 mt-1 hidden sm:inline">(2)</span>
            </button>

            {/* 3: Good */}
            <button
              onClick={() => handleGrade(3)}
              className="flex flex-col items-center justify-center py-3 px-1 sm:px-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold">Bien</span>
              <span className="text-[10px] text-emerald-100 font-medium mt-0.5">
                {intervalsPreview?.[3]}
              </span>
              <span className="text-[9px] opacity-70 mt-1 hidden sm:inline">(3)</span>
            </button>

            {/* 4: Easy */}
            <button
              onClick={() => handleGrade(4)}
              className="flex flex-col items-center justify-center py-3 px-1 sm:px-2 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white transition-all shadow-lg shadow-sky-900/30 cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold">Fácil</span>
              <span className="text-[10px] text-sky-100 font-medium mt-0.5">
                {intervalsPreview?.[4]}
              </span>
              <span className="text-[9px] opacity-70 mt-1 hidden sm:inline">(4)</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-5 h-5" />
            <span>Mostrar Respuesta</span>
          </button>
        )}
      </div>
    </div>
  );
};
