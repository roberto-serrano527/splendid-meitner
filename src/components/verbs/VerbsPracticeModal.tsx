import React, { useState, useEffect, useCallback } from 'react';
import type { IrregularVerb } from '../../data/verbsData';
import { speakVerbTriplet } from '../../data/verbsData';
import { speakWord } from '../../lib/speech';
import confetti from 'canvas-confetti';
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Zap,
  ArrowRight,
  Trophy,
} from 'lucide-react';

interface VerbsPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  verbs: IrregularVerb[];
  favorites: string[];
}

type PracticeType = 'fill-in' | 'multiple-choice';

export const VerbsPracticeModal: React.FC<VerbsPracticeModalProps> = ({
  isOpen,
  onClose,
  verbs,
  favorites,
}) => {
  // Practice configuration
  const [practiceType, setPracticeType] = useState<PracticeType>('fill-in');
  const [filterScope, setFilterScope] = useState<'all' | 'common' | 'favorites'>('all');
  const [pool, setPool] = useState<IrregularVerb[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stats
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Fill-in state
  const [inputPast, setInputPast] = useState('');
  const [inputParticiple, setInputParticiple] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPastCorrect, setIsPastCorrect] = useState<boolean | null>(null);
  const [isParticipleCorrect, setIsParticipleCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Multiple choice state
  const [targetForm, setTargetForm] = useState<'past' | 'participle'>('past');
  const [mcOptions, setMcOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const resetQuestionState = useCallback(() => {
    setInputPast('');
    setInputParticiple('');
    setSubmitted(false);
    setIsPastCorrect(null);
    setIsParticipleCorrect(null);
    setShowHint(false);
    setSelectedOption(null);
  }, []);

  // Initialize pool
  const initPool = useCallback(() => {
    let selected = [...verbs];
    if (filterScope === 'common') {
      selected = selected.filter((v) => v.common);
    } else if (filterScope === 'favorites') {
      selected = selected.filter((v) => favorites.includes(v.id));
      if (selected.length === 0) selected = [...verbs]; // fallback
    }

    // Shuffle and pick 15
    const shuffled = [...selected].sort(() => Math.random() - 0.5).slice(0, 15);
    setPool(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setCompleted(false);
    resetQuestionState();
  }, [verbs, filterScope, favorites, resetQuestionState]);

  useEffect(() => {
    if (isOpen) {
      initPool();
    }
  }, [isOpen, initPool]);

  const currentVerb = pool[currentIndex];

  // Generate Multiple Choice Options when currentVerb changes
  useEffect(() => {
    if (!currentVerb || practiceType !== 'multiple-choice') return;

    const askForParticiple = Math.random() > 0.5;
    setTargetForm(askForParticiple ? 'participle' : 'past');

    const correctAnswer = askForParticiple
      ? currentVerb.pastParticiple.split('/')[0].trim()
      : currentVerb.pastSimple.split('/')[0].trim();

    // Pick 3 distractors
    const otherVerbs = verbs.filter((v) => v.id !== currentVerb.id);
    const distractors: string[] = [];

    const shuffledOthers = [...otherVerbs].sort(() => Math.random() - 0.5);
    for (const v of shuffledOthers) {
      const candidate = askForParticiple
        ? v.pastParticiple.split('/')[0].trim()
        : v.pastSimple.split('/')[0].trim();
      if (candidate.toLowerCase() !== correctAnswer.toLowerCase() && !distractors.includes(candidate)) {
        distractors.push(candidate);
      }
      if (distractors.length >= 3) break;
    }

    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    setMcOptions(options);
  }, [currentIndex, currentVerb, practiceType, verbs]);

  // Clean strings for flexible comparison
  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z]/g, '').trim();

  const checkAnswerMatch = (input: string, correctSpec: string) => {
    const cleanInput = normalize(input);
    if (!cleanInput) return false;
    // Spec might have variants like "Burnt / Burned" or "Got / Gotten"
    const variants = correctSpec.split('/').map((s) => normalize(s));
    return variants.includes(cleanInput);
  };

  const handleCheckFillIn = () => {
    if (!currentVerb || submitted) return;

    const pastOk = checkAnswerMatch(inputPast, currentVerb.pastSimple);
    const partOk = checkAnswerMatch(inputParticiple, currentVerb.pastParticiple);

    setIsPastCorrect(pastOk);
    setIsParticipleCorrect(partOk);
    setSubmitted(true);

    const isAllCorrect = pastOk && partOk;
    if (isAllCorrect) {
      setScore((s) => s + 1);
      setStreak((st) => {
        const nextSt = st + 1;
        if (nextSt > bestStreak) setBestStreak(nextSt);
        return nextSt;
      });
      speakVerbTriplet(currentVerb.infinitive, currentVerb.pastSimple, currentVerb.pastParticiple);
    } else {
      setStreak(0);
    }
  };

  const handleSelectMCOption = (opt: string) => {
    if (!currentVerb || selectedOption !== null) return;
    setSelectedOption(opt);

    const correctAnswer =
      targetForm === 'participle'
        ? currentVerb.pastParticiple.split('/')[0].trim()
        : currentVerb.pastSimple.split('/')[0].trim();

    const isCorrect = normalize(opt) === normalize(correctAnswer);

    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((st) => {
        const nextSt = st + 1;
        if (nextSt > bestStreak) setBestStreak(nextSt);
        return nextSt;
      });
      speakWord(opt, 'en-US');
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < pool.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetQuestionState();
    } else {
      setCompleted(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto animate-in zoom-in-95">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Entrenador de Conjugación
              </h3>
              <p className="text-[11px] text-slate-500">
                Aprende el Pasado Simple y Participio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector & Filter */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-slate-100 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPracticeType('fill-in')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                practiceType === 'fill-in' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              ✍️ Escribir Formas
            </button>
            <button
              onClick={() => setPracticeType('multiple-choice')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                practiceType === 'multiple-choice' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              ⚡ Opción Múltiple
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Todos los verbos</option>
              <option value="common">⭐ Top 40 Más comunes</option>
              {favorites.length > 0 && <option value="favorites">❤️ Mis Favoritos ({favorites.length})</option>}
            </select>
          </div>
        </div>

        {/* Progress and Streak Bar */}
        <div className="px-4 sm:px-6 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Pregunta {currentIndex + 1} de {pool.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              🔥 Racha: <strong className="text-amber-700">{streak}</strong>
            </span>
            <span className="text-indigo-600">
              Aciertos: {score}/{pool.length}
            </span>
          </div>
        </div>

        {/* Progress Line */}
        <div className="px-4 sm:px-6 pt-2">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / pool.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Area */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
          {completed ? (
            /* Result Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">¡Sesión Completada!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Has practicado {pool.length} verbos irregulares.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto py-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="block text-2xl font-black text-indigo-600">{score}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Aciertos</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="block text-2xl font-black text-amber-600">{bestStreak}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Mejor Racha</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={initPool}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Practicar Otra Vez</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Terminar
                </button>
              </div>
            </div>
          ) : currentVerb ? (
            <div className="space-y-5">
              {/* Target Verb Card */}
              <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/60 p-5 rounded-3xl border border-indigo-100 text-center relative shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    Patrón {currentVerb.pattern}
                  </span>
                  <button
                    onClick={() => speakWord(currentVerb.infinitive, 'en-US')}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                    title="Escuchar infinitivo"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                  Infinitivo
                </span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight my-1">
                  {currentVerb.infinitive}
                </h2>
                <p className="text-sm font-semibold text-indigo-900/80">
                  {currentVerb.spanish}
                </p>
              </div>

              {/* MODE 1: Fill in forms */}
              {practiceType === 'fill-in' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Past Simple Input */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500">
                        Pasado Simple (Past Simple)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={inputPast}
                          onChange={(e) => setInputPast(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCheckFillIn()}
                          disabled={submitted}
                          placeholder="Escribe el pasado..."
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium outline-none transition-all ${
                            submitted
                              ? isPastCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                : 'bg-rose-50 border-rose-300 text-rose-900'
                              : 'bg-white border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                          }`}
                        />
                        {submitted && (
                          <div className="absolute right-3 top-2.5">
                            {isPastCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {submitted && !isPastCorrect && (
                        <p className="text-xs text-rose-600 font-semibold pt-0.5">
                          Correcto: <strong>{currentVerb.pastSimple}</strong>
                        </p>
                      )}
                    </div>

                    {/* Past Participle Input */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500">
                        Participio Pasado (Past Participle)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={inputParticiple}
                          onChange={(e) => setInputParticiple(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCheckFillIn()}
                          disabled={submitted}
                          placeholder="Escribe el participio..."
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium outline-none transition-all ${
                            submitted
                              ? isParticipleCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                : 'bg-rose-50 border-rose-300 text-rose-900'
                              : 'bg-white border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                          }`}
                        />
                        {submitted && (
                          <div className="absolute right-3 top-2.5">
                            {isParticipleCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {submitted && !isParticipleCorrect && (
                        <p className="text-xs text-rose-600 font-semibold pt-0.5">
                          Correcto: <strong>{currentVerb.pastParticiple}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for Fill-In */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    {!submitted ? (
                      <>
                        <button
                          onClick={() => setShowHint(true)}
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                          <span>¿Pistas?</span>
                        </button>

                        <button
                          onClick={handleCheckFillIn}
                          disabled={!inputPast.trim() || !inputParticiple.trim()}
                          className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                            !inputPast.trim() || !inputParticiple.trim()
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95'
                          }`}
                        >
                          Comprobar Respuesta
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            speakVerbTriplet(
                              currentVerb.infinitive,
                              currentVerb.pastSimple,
                              currentVerb.pastParticiple
                            )
                          }
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>Escuchar las 3</span>
                        </button>

                        <button
                          onClick={handleNext}
                          autoFocus
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <span>Siguiente</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Hint text if requested */}
                  {showHint && !submitted && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 animate-in fade-in">
                      💡 <strong>Pista de patrón ({currentVerb.pattern}):</strong>{' '}
                      {currentVerb.pattern === 'AAA'
                        ? '¡Las tres formas son idénticas!'
                        : currentVerb.pattern === 'ABB'
                        ? 'El pasado y el participio se escriben exactamente igual.'
                        : currentVerb.pattern === 'ABA'
                        ? 'El participio vuelve a ser igual al infinitivo.'
                        : 'Las tres formas son diferentes.'}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: Multiple Choice */}
              {practiceType === 'multiple-choice' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600 text-center">
                    ¿Cuál es el{' '}
                    <span className="text-indigo-600 underline font-black">
                      {targetForm === 'past' ? 'Pasado Simple' : 'Participio Pasado'}
                    </span>{' '}
                    de <strong>{currentVerb.infinitive}</strong>?
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {mcOptions.map((opt) => {
                      const isSelected = selectedOption === opt;
                      const correctAnswer =
                        targetForm === 'participle'
                          ? currentVerb.pastParticiple.split('/')[0].trim()
                          : currentVerb.pastSimple.split('/')[0].trim();
                      const isThisCorrect = normalize(opt) === normalize(correctAnswer);

                      let btnStyle = 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800';
                      if (selectedOption !== null) {
                        if (isThisCorrect) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                        } else {
                          btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectMCOption(opt)}
                          disabled={selectedOption !== null}
                          className={`p-3.5 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {selectedOption !== null && isThisCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          {selectedOption !== null && isSelected && !isThisCorrect && (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption !== null && (
                    <div className="pt-3 flex items-center justify-between animate-in fade-in">
                      <button
                        onClick={() =>
                          speakVerbTriplet(
                            currentVerb.infinitive,
                            currentVerb.pastSimple,
                            currentVerb.pastParticiple
                          )
                        }
                        className="p-2 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Escuchar trío</span>
                      </button>

                      <button
                        onClick={handleNext}
                        autoFocus
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Siguiente</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
