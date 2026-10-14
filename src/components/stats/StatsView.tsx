import type { Card, Deck, StudyLog } from '../../types';
import { isCardDue } from '../../lib/srs';
import {
  Flame,
  Award,
  Sparkles,
  BarChart3,
  CheckCircle,
} from 'lucide-react';

interface StatsViewProps {
  decks: Deck[];
  cards: Card[];
  studyLogs: StudyLog[];
}

export const StatsView: React.FC<StatsViewProps> = ({
  decks,
  cards,
  studyLogs,
}) => {
  const now = Date.now();
  const dueCards = cards.filter((c) => isCardDue(c, now));
  const newCards = cards.filter((c) => c.state === 'NEW');
  const learningCards = cards.filter((c) => c.state === 'LEARNING');
  const reviewCards = cards.filter((c) => c.state === 'REVIEW');
  const masteredCards = cards.filter((c) => c.state === 'MASTERED');

  const totalWords = cards.length;
  const masteredPercentage = totalWords > 0 ? Math.round((masteredCards.length / totalWords) * 100) : 0;
  const goodOrEasyLogs = studyLogs.filter((l) => l.grade >= 3);
  const retentionRate = studyLogs.length > 0 ? Math.round((goodOrEasyLogs.length / studyLogs.length) * 100) : 100;

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <span>Tu Progreso y Retención</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Métricas de repetición espaciada y evolución de memoria a largo plazo.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total words */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Total Palabras
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalWords}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            en {decks.length} {decks.length === 1 ? 'colección' : 'colecciones'}
          </span>
        </div>

        {/* Due Today */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 block uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Pendientes Hoy
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {dueCards.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            para repasar hoy
          </span>
        </div>

        {/* Mastered */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 block uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            Dominadas
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {masteredPercentage}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {masteredCards.length} en memoria fija
          </span>
        </div>

        {/* Retention Rate */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-indigo-600 block uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Tasa Retención
          </span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">
            {retentionRate}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {studyLogs.length} repasos registrados
          </span>
        </div>
      </div>

      {/* Memory Funnel / Stages breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Embudo de Memoria (Curva del Olvido)
        </h2>
        <div className="space-y-3">
          {/* Dominadas */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-emerald-700">🏆 Dominadas (Intervalo &gt; 21 días)</span>
              <span className="text-slate-600">{masteredCards.length} ({totalWords > 0 ? Math.round((masteredCards.length / totalWords) * 100) : 0}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${totalWords > 0 ? (masteredCards.length / totalWords) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* En Repaso */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-indigo-700">🔄 En Repaso (Intervalo 3 - 20 días)</span>
              <span className="text-slate-600">{reviewCards.length} ({totalWords > 0 ? Math.round((reviewCards.length / totalWords) * 100) : 0}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${totalWords > 0 ? (reviewCards.length / totalWords) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* En Aprendizaje */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-amber-700">🌱 En Aprendizaje (Intervalo 1 - 2 días)</span>
              <span className="text-slate-600">{learningCards.length} ({totalWords > 0 ? Math.round((learningCards.length / totalWords) * 100) : 0}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${totalWords > 0 ? (learningCards.length / totalWords) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Nuevas */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">✨ Nuevas (Sin estudiar)</span>
              <span className="text-slate-600">{newCards.length} ({totalWords > 0 ? Math.round((newCards.length / totalWords) * 100) : 0}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 rounded-full transition-all duration-500"
                style={{ width: `${totalWords > 0 ? (newCards.length / totalWords) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spaced Repetition Advice */}
      <div className="bg-indigo-50/70 p-5 rounded-3xl border border-indigo-100 flex items-start gap-4">
        <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shrink-0 mt-0.5">
          <Flame className="w-5 h-5" />
        </div>
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong className="block font-bold text-sm text-indigo-950 mb-1">
            Consejo para maximizar tu retención:
          </strong>
          Estudiar 5 a 10 minutos cada día es 5 veces más efectivo que estudiar 2 horas una vez por semana. El algoritmo SM-2 se encarga de programar los intervalos exactos para que no tengas que repasar palabras que ya dominas.
        </div>
      </div>
    </div>
  );
};
