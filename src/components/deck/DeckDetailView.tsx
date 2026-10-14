import { useState } from 'react';
import type { Deck, Card, CardState } from '../../types';
import { isCardDue } from '../../lib/srs';
import { speakWord } from '../../lib/speech';
import {
  ArrowLeft,
  Plus,
  Share2,
  Download,
  Sparkles,
  BookOpen,
  HelpCircle,
  PenTool,
  Volume2,
  Search,
  Trash2,
  Edit3,
} from 'lucide-react';

interface DeckDetailViewProps {
  deck: Deck;
  cards: Card[];
  onBack: () => void;
  onAddWord: () => void;
  onEditWord: (card: Card) => void;
  onDeleteWord: (cardId: string) => void;
  onImportWords: () => void;
  onShareDeck: () => void;
  onStartSRS: () => void;
  onStartFlashcards: () => void;
  onStartQuiz: () => void;
  onStartSpelling: () => void;
}

export const DeckDetailView: React.FC<DeckDetailViewProps> = ({
  deck,
  cards,
  onBack,
  onAddWord,
  onEditWord,
  onDeleteWord,
  onImportWords,
  onShareDeck,
  onStartSRS,
  onStartFlashcards,
  onStartQuiz,
  onStartSpelling,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<CardState | 'ALL'>('ALL');

  const now = Date.now();
  const dueCards = cards.filter((c) => isCardDue(c, now));

  // Filter cards
  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.definition && c.definition.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesState = filterState === 'ALL' || c.state === filterState;
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
            title="Volver a colecciones"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {deck.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {deck.description || 'Colección de vocabulario'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={onShareDeck}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir</span>
          </button>

          <button
            onClick={onImportWords}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Importar</span>
          </button>

          <button
            onClick={onAddWord}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Palabra</span>
          </button>
        </div>
      </div>

      {/* Study Modes Hub */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Modos de Estudio y Práctica
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Mode 1: SRS */}
          <button
            onClick={onStartSRS}
            className="relative p-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-200/50 hover:shadow-lg transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              {dueCards.length > 0 && (
                <span className="text-[11px] font-bold bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                  {dueCards.length} hoy
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className="text-sm font-bold block">Repetición Espaciada</span>
              <span className="text-[11px] text-indigo-100 font-medium">Algoritmo SM-2</span>
            </div>
          </button>

          {/* Mode 2: Flashcards */}
          <button
            onClick={onStartFlashcards}
            className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-sm font-bold text-slate-900 block">Flashcards Clásicas</span>
              <span className="text-[11px] text-slate-500 font-medium">Giro libre con audio</span>
            </div>
          </button>

          {/* Mode 3: Quiz */}
          <button
            onClick={onStartQuiz}
            className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-sm font-bold text-slate-900 block">Modo Quiz</span>
              <span className="text-[11px] text-slate-500 font-medium">Opción múltiple rápida</span>
            </div>
          </button>

          {/* Mode 4: Spelling */}
          <button
            onClick={onStartSpelling}
            className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-violet-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <PenTool className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-sm font-bold text-slate-900 block">Dictado y Ortografía</span>
              <span className="text-[11px] text-slate-500 font-medium">Escucha y escribe</span>
            </div>
          </button>
        </div>
      </div>

      {/* Words List Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en esta colección..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* State Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {(['ALL', 'NEW', 'LEARNING', 'REVIEW', 'MASTERED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterState === st
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? `Todas (${cards.length})` :
                 st === 'NEW' ? 'Nuevas' :
                 st === 'LEARNING' ? 'Aprendiendo' :
                 st === 'REVIEW' ? 'Repaso' : 'Dominadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Word Rows */}
        {filteredCards.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredCards.map((card) => {
              const isDue = isCardDue(card, now);

              return (
                <div
                  key={card.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Word, Audio, Phonetic, Part of speech */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        onClick={() => speakWord(card.word, deck.targetLang)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                        title="Escuchar pronunciación"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <span className="font-bold text-base text-slate-900">
                        {card.word}
                      </span>

                      {card.phonetic && (
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-md">
                          {card.phonetic}
                        </span>
                      )}

                      {card.partOfSpeech && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {card.partOfSpeech}
                        </span>
                      )}

                      {isDue && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Toca hoy
                        </span>
                      )}
                    </div>

                    {/* Translation and Example */}
                    <p className="text-xs sm:text-sm font-semibold text-emerald-800">
                      {card.translation}
                    </p>

                    {card.definition && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {card.definition}
                      </p>
                    )}

                    {card.example && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl mt-1 border border-slate-100">
                        "{card.example}"
                      </p>
                    )}
                  </div>

                  {/* Right: SRS interval badge and Edit/Delete */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right text-[11px] text-slate-400">
                      <span className="block font-semibold text-slate-600">
                        Intervalo: {card.srsInterval}d
                      </span>
                      <span>Repasos: {card.srsRepetitions}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditWord(card)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                        title="Editar palabra"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteWord(card.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar palabra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium">
              {searchQuery ? 'No se encontraron palabras con esa búsqueda.' : 'Esta colección aún no tiene palabras.'}
            </p>
            <button
              onClick={onAddWord}
              className="py-2 px-4 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 cursor-pointer"
            >
              + Añadir primera palabra
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
