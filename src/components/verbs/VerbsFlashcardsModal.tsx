import React, { useState, useEffect } from 'react';
import type { IrregularVerb } from '../../data/verbsData';
import { speakVerbTriplet } from '../../data/verbsData';
import { speakWord } from '../../lib/speech';
import {
  X,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCw,
  Heart,
} from 'lucide-react';

interface VerbsFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  verbs: IrregularVerb[];
  favorites: string[];
  onToggleFavorite: (verbId: string) => void;
}

export const VerbsFlashcardsModal: React.FC<VerbsFlashcardsModalProps> = ({
  isOpen,
  onClose,
  verbs,
  favorites,
  onToggleFavorite,
}) => {
  const [deck, setDeck] = useState<IrregularVerb[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeck([...verbs]);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen, verbs]);

  const currentVerb = deck[currentIndex];

  useEffect(() => {
    if (currentVerb && isOpen) {
      speakWord(currentVerb.infinitive, 'en-US');
    }
  }, [currentIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, deck.length]);

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!isOpen || !currentVerb) return null;

  const isFavorite = favorites.includes(currentVerb.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col justify-between text-white p-4 sm:p-6 select-none">
      {/* Top Bar */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Verbos Irregulares</span>
            <span className="text-xs font-bold text-indigo-400">Flashcards de 3 Formas</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Mezclar tarjetas"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
            {currentIndex + 1} / {deck.length}
          </span>
        </div>
      </div>

      {/* Main Flashcard Container */}
      <div className="max-w-lg w-full mx-auto my-auto py-4">
        <div
          onClick={() => setIsFlipped((f) => !f)}
          className="relative min-h-[380px] sm:min-h-[420px] w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between cursor-pointer border border-slate-100 transition-transform active:scale-[0.99]"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                Patrón {currentVerb.pattern}
              </span>
              {currentVerb.common && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                  ★ Esencial
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(currentVerb.id);
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isFavorite
                    ? 'text-rose-500 bg-rose-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Marcar como favorito"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFlipped) {
                    speakVerbTriplet(
                      currentVerb.infinitive,
                      currentVerb.pastSimple,
                      currentVerb.pastParticiple
                    );
                  } else {
                    speakWord(currentVerb.infinitive, 'en-US');
                  }
                }}
                className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Pronunciación"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="my-auto text-center space-y-4 py-4">
            {!isFlipped ? (
              /* Front of Card */
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                  Infinitivo
                </span>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {currentVerb.infinitive}
                </h2>
                <div className="text-xl font-bold text-emerald-700 pt-2">
                  {currentVerb.spanish}
                </div>
                <div className="pt-8 text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                  <RotateCw className="w-4 h-4" />
                  <span>Toca la tarjeta para ver Pasado y Participio</span>
                </div>
              </div>
            ) : (
              /* Back of Card */
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="text-sm font-bold text-slate-500">
                  {currentVerb.spanish}
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Infinitivo
                    </span>
                    <strong className="text-sm sm:text-base text-slate-900 block font-black">
                      {currentVerb.infinitive}
                    </strong>
                  </div>

                  <div className="space-y-1 border-x border-slate-200 px-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-500 block">
                      Pasado Simple
                    </span>
                    <strong className="text-sm sm:text-base text-indigo-700 block font-black">
                      {currentVerb.pastSimple}
                    </strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-violet-500 block">
                      Participio
                    </span>
                    <strong className="text-sm sm:text-base text-violet-700 block font-black">
                      {currentVerb.pastParticiple}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakVerbTriplet(
                      currentVerb.infinitive,
                      currentVerb.pastSimple,
                      currentVerb.pastParticiple
                    );
                  }}
                  className="mx-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Escuchar las 3 Formas</span>
                </button>

                <div className="text-xs text-slate-500 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 text-left">
                  💡 <strong>Regla:</strong>{' '}
                  {currentVerb.pattern === 'AAA'
                    ? '¡Las tres formas se escriben exactamente igual!'
                    : currentVerb.pattern === 'ABB'
                    ? 'El Pasado Simple y el Participio Pasado son idénticos.'
                    : currentVerb.pattern === 'ABA'
                    ? 'El Infinitivo y el Participio Pasado son iguales.'
                    : 'Las 3 formas son distintas. ¡Pon atención a las vocales!'}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-400">
            {isFlipped ? 'Reverso (Conjugaciones)' : 'Anverso (Presiona Espacio para voltear)'}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="max-w-lg w-full mx-auto flex items-center justify-between gap-4 pb-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
          disabled={currentIndex === deck.length - 1}
          className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentIndex === deck.length - 1
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
