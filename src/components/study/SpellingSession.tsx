import { useState, useEffect } from 'react';
import type { Card, Deck } from '../../types';
import { speakWord } from '../../lib/speech';
import confetti from 'canvas-confetti';
import {
  Volume2,
  X,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface SpellingSessionProps {
  deck: Deck;
  cards: Card[];
  onClose: () => void;
}

export const SpellingSession: React.FC<SpellingSessionProps> = ({
  deck,
  cards,
  onClose,
}) => {
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setSessionCards([...cards].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setUserInput('');
    setStatus('idle');
    setShowHint(false);
    setScore(0);
    setIsFinished(false);
  }, [cards]);

  const currentCard = sessionCards[currentIndex];

  useEffect(() => {
    if (currentCard && !isFinished) {
      speakWord(currentCard.word, deck.targetLang);
    }
  }, [currentIndex, isFinished]);

  const handleCheck = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentCard || status !== 'idle' || !userInput.trim()) return;

    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedTarget = currentCard.word.trim().toLowerCase();

    if (normalizedInput === normalizedTarget) {
      setStatus('correct');
      setScore((prev) => prev + 1);
    } else {
      setStatus('wrong');
    }

    setTimeout(() => {
      if (currentIndex + 1 < sessionCards.length) {
        setCurrentIndex((prev) => prev + 1);
        setUserInput('');
        setStatus('idle');
        setShowHint(false);
      } else {
        setIsFinished(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    }, 1800);
  };

  if (!currentCard) return null;

  if (isFinished) {
    const percentage = Math.round((score / sessionCards.length) * 100);

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ¡Dictado Finalizado!
          </h2>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            Ortografía correcta: <strong className="text-slate-900">{score}</strong> de {sessionCards.length} ({percentage}%)
          </p>

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
            <span className="text-xs font-semibold text-indigo-400">Modo Dictado y Ortografía</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-300">
            {currentIndex + 1} / {sessionCards.length}
          </span>
          <span className="text-xs text-emerald-400 block font-semibold">
            Aciertos: {score}
          </span>
        </div>
      </div>

      {/* Main Exercise Card */}
      <div className="max-w-xl w-full mx-auto my-auto py-4">
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <button
              onClick={() => speakWord(currentCard.word, deck.targetLang)}
              className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full mx-auto shadow-lg shadow-indigo-200 transition-transform active:scale-95 cursor-pointer"
              title="Escuchar de nuevo"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <p className="text-xs text-slate-400 font-medium">
              Toca para escuchar la palabra
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm mx-auto">
              <span className="text-xs text-slate-500 font-medium block">Traducción:</span>
              <strong className="text-base text-slate-800">{currentCard.translation}</strong>
            </div>

            {showHint && currentCard.phonetic && (
              <p className="text-xs font-mono text-indigo-600">
                Pista fonética: {currentCard.phonetic}
              </p>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleCheck} className="space-y-4">
            <input
              type="text"
              autoFocus
              disabled={status !== 'idle'}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Escribe la palabra exacta..."
              className={`w-full px-4 py-3.5 rounded-2xl border-2 text-center text-lg font-bold transition-all focus:outline-none ${
                status === 'correct'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : status === 'wrong'
                  ? 'border-rose-500 bg-rose-50 text-rose-800'
                  : 'border-slate-300 focus:border-indigo-600 bg-white text-slate-900'
              }`}
            />

            {status === 'wrong' && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center animate-in fade-in">
                <span className="text-xs text-rose-700 block">Respuesta correcta:</span>
                <strong className="text-base text-rose-900 font-bold">{currentCard.word}</strong>
              </div>
            )}

            {status === 'correct' && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-2 text-emerald-700 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡Excelente! Ortografía correcta</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Mostrar pista</span>
              </button>

              <button
                type="submit"
                disabled={status !== 'idle' || !userInput.trim()}
                className={`py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all cursor-pointer ${
                  status === 'idle' && userInput.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Comprobar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pb-2">
        Presiona Enter para comprobar tu respuesta
      </div>
    </div>
  );
};
