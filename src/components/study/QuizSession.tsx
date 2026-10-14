import { useState, useEffect } from 'react';
import type { Card, Deck } from '../../types';
import { speakWord } from '../../lib/speech';
import confetti from 'canvas-confetti';
import {
  Volume2,
  X,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface QuizSessionProps {
  deck: Deck;
  cards: Card[];
  onClose: () => void;
}

interface Question {
  card: Card;
  options: string[];
  correctAnswer: string;
}

export const QuizSession: React.FC<QuizSessionProps> = ({
  deck,
  cards,
  onClose,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (cards.length < 2) return;

    // Generate questions for all cards or sample of up to 15 cards
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    const generated: Question[] = shuffledCards.map((targetCard) => {
      const otherCards = cards.filter((c) => c.id !== targetCard.id);
      const distractors = [...otherCards]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.translation);

      const allOptions = [...distractors, targetCard.translation].sort(
        () => Math.random() - 0.5
      );

      return {
        card: targetCard,
        options: allOptions,
        correctAnswer: targetCard.translation,
      };
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsFinished(false);
  }, [cards]);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (currentQ && !isFinished) {
      speakWord(currentQ.card.word, deck.targetLang);
    }
  }, [currentIndex, isFinished]);

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null || !currentQ) return;

    setSelectedOption(option);
    const isCorrect = option === currentQ.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Advance to next after 1.2s delay
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        setIsFinished(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    }, 1200);
  };

  if (cards.length < 2) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl">
          <HelpCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-lg">Necesitas más palabras</h3>
          <p className="text-xs text-slate-500 mt-2 mb-4">
            El modo Quiz requiere al menos 2 palabras en la colección para generar opciones múltiples.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ¡Quiz Finalizado!
          </h2>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            Puntuación: <strong className="text-slate-900">{score}</strong> de {questions.length} ({percentage}%)
          </p>

          <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
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

  if (!currentQ) return null;

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
            <span className="text-xs font-semibold text-indigo-400">Modo Quiz (Quizlet Style)</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-300">
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-xs text-emerald-400 block font-semibold">
            Aciertos: {score}
          </span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="max-w-xl w-full mx-auto my-auto py-4">
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ¿Cuál es la traducción correcta?
            </span>
            <button
              onClick={() => speakWord(currentQ.card.word, deck.targetLang)}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-colors cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center py-2">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {currentQ.card.word}
            </h2>
            {currentQ.card.phonetic && (
              <p className="text-xs font-mono text-indigo-600 mt-1">
                {currentQ.card.phonetic}
              </p>
            )}
            {currentQ.card.example && (
              <p className="text-xs text-slate-400 italic mt-2">
                "{currentQ.card.example}"
              </p>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

              let btnStyle = 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200';
              if (selectedOption !== null) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500 text-white border-rose-600';
                } else {
                  btnStyle = 'bg-slate-100 text-slate-400 border-transparent opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={selectedOption !== null}
                  onClick={() => handleSelectOption(option)}
                  className={`p-4 rounded-2xl border-2 text-left font-semibold text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span className="truncate">{option}</span>
                  {selectedOption !== null && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 shrink-0 ml-2 text-white" />
                  )}
                  {selectedOption !== null && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 shrink-0 ml-2 text-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pb-2">
        Selecciona la opción para avanzar automáticamente
      </div>
    </div>
  );
};
