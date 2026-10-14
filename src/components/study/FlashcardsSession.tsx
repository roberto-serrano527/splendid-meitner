import { useState, useEffect } from 'react';
import type { Card, Deck } from '../../types';
import { speakWord } from '../../lib/speech';
import {
  Volume2,
  X,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCw,
} from 'lucide-react';

interface FlashcardsSessionProps {
  deck: Deck;
  cards: Card[];
  onClose: () => void;
}

export const FlashcardsSession: React.FC<FlashcardsSessionProps> = ({
  deck,
  cards,
  onClose,
}) => {
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setDeckCards([...cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  const currentCard = deckCards[currentIndex];

  useEffect(() => {
    if (currentCard) {
      speakWord(currentCard.word, deck.targetLang);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, deckCards.length]);

  const handleNext = () => {
    if (currentIndex < deckCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...deckCards].sort(() => Math.random() - 0.5);
    setDeckCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col justify-between text-white p-4 sm:p-6 select-none">
      {/* Top Bar */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <span className="text-xs text-slate-400 font-medium block">{deck.title}</span>
            <span className="text-xs font-semibold text-indigo-400">Modo Flashcards Clásico</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShuffle}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Mezclar tarjetas"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-300">
            {currentIndex + 1} / {deckCards.length}
          </span>
        </div>
      </div>

      {/* Main Flashcard */}
      <div className="max-w-xl w-full mx-auto my-auto py-4">
        <div
          onClick={() => setIsFlipped((prev) => !prev)}
          className="relative min-h-[380px] sm:min-h-[420px] w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between cursor-pointer border border-slate-100 transition-transform active:scale-[0.99]"
        >
          {/* Card Top */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentCard.partOfSpeech && (
                <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {currentCard.partOfSpeech}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakWord(currentCard.word, deck.targetLang);
              }}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-all shadow-xs cursor-pointer"
              title="Escuchar pronunciación"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Card Body */}
          <div className="my-auto text-center space-y-4 py-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {currentCard.word}
            </h2>

            {currentCard.phonetic && (
              <p className="text-sm font-mono text-indigo-600 font-medium">
                {currentCard.phonetic}
              </p>
            )}

            {isFlipped ? (
              <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                <div className="text-2xl font-bold text-emerald-700">
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
              </div>
            ) : (
              <div className="pt-8 text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <RotateCw className="w-4 h-4" />
                <span>Toca o presiona Espacio para ver traducción</span>
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-400">
            {isFlipped ? 'Reverso' : 'Anverso'}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-4 pb-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentIndex === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Anterior</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === deckCards.length - 1}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentIndex === deckCards.length - 1
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-lg shadow-indigo-950/40'
          }`}
        >
          <span>Siguiente</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
