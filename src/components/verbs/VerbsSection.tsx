import React, { useState, useMemo, useEffect } from 'react';
import {
  IRREGULAR_VERBS,
  REGULAR_VERBS,
  speakVerbTriplet,
} from '../../data/verbsData';
import { speakWord } from '../../lib/speech';
import { VerbsPracticeModal } from './VerbsPracticeModal';
import { VerbsFlashcardsModal } from './VerbsFlashcardsModal';
import { db } from '../../db';
import {
  Search,
  Volume2,
  Zap,
  Heart,
  BookOpen,
  Filter,
  Check,
  Download,
  Table as TableIcon,
  LayoutGrid,
  Headphones,
} from 'lucide-react';

interface VerbsSectionProps {
  onOpenDeck?: (deckId: string) => void;
}

type MainVerbTab = 'irregular' | 'regular';
type PatternFilter = 'all' | 'common' | 'AAA' | 'ABB' | 'ABA' | 'ABC' | 'favorites';

export const VerbsSection: React.FC<VerbsSectionProps> = ({ onOpenDeck }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<MainVerbTab>('irregular');
  const [patternFilter, setPatternFilter] = useState<PatternFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Regular verbs filter
  const [soundFilter, setSoundFilter] = useState<'all' | '/id/' | '/t/' | '/d/'>('all');

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('lexicards_verb_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('lexicards_verb_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  const toggleFavorite = (verbId: string) => {
    setFavorites((prev) =>
      prev.includes(verbId) ? prev.filter((id) => id !== verbId) : [...prev, verbId]
    );
  };

  // Filtered irregular verbs
  const filteredIrregularVerbs = useMemo(() => {
    return IRREGULAR_VERBS.filter((verb) => {
      // Pattern filter
      if (patternFilter === 'common' && !verb.common) return false;
      if (patternFilter === 'AAA' && verb.pattern !== 'AAA') return false;
      if (patternFilter === 'ABB' && verb.pattern !== 'ABB') return false;
      if (patternFilter === 'ABA' && verb.pattern !== 'ABA') return false;
      if (patternFilter === 'ABC' && verb.pattern !== 'ABC') return false;
      if (patternFilter === 'favorites' && !favorites.includes(verb.id)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesInfinitive = verb.infinitive.toLowerCase().includes(query);
        const matchesPast = verb.pastSimple.toLowerCase().includes(query);
        const matchesParticiple = verb.pastParticiple.toLowerCase().includes(query);
        const matchesSpanish = verb.spanish.toLowerCase().includes(query);
        return matchesInfinitive || matchesPast || matchesParticiple || matchesSpanish;
      }

      return true;
    });
  }, [patternFilter, searchQuery, favorites]);

  // Filtered regular verbs
  const filteredRegularVerbs = useMemo(() => {
    return REGULAR_VERBS.filter((verb) => {
      if (soundFilter !== 'all' && verb.sound !== soundFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesBase = verb.base.toLowerCase().includes(query);
        const matchesPast = verb.past.toLowerCase().includes(query);
        const matchesSpanish = verb.spanish.toLowerCase().includes(query);
        return matchesBase || matchesPast || matchesSpanish;
      }

      return true;
    });
  }, [soundFilter, searchQuery]);

  // Save Irregular Verbs as a Deck in Dexie DB
  const handleImportToDecks = async () => {
    const timestamp = Date.now();
    const newDeckId = `deck-irregular-verbs-${timestamp}`;
    const verbsToImport = filteredIrregularVerbs.length > 0 ? filteredIrregularVerbs : IRREGULAR_VERBS;

    await db.transaction('rw', db.decks, db.cards, async () => {
      await db.decks.add({
        id: newDeckId,
        title: 'Verbos Irregulares (Completo)',
        description: `Colección de ${verbsToImport.length} verbos irregulares con Pasado Simple, Participio y traducción.`,
        targetLang: 'en-US',
        sourceLang: 'es-ES',
        color: 'violet',
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      for (let i = 0; i < verbsToImport.length; i++) {
        const v = verbsToImport[i];
        await db.cards.add({
          id: `card-verb-${timestamp}-${i}`,
          deckId: newDeckId,
          word: `${v.infinitive}`,
          partOfSpeech: 'verb',
          translation: v.spanish,
          definition: `Infinitivo: ${v.infinitive} | Pasado Simple: ${v.pastSimple} | Participio: ${v.pastParticiple}`,
          example: `Past: ${v.pastSimple} | Participle: have/has ${v.pastParticiple}`,
          notes: `Patrón: ${v.pattern}`,
          tags: ['verbos-irregulares', v.pattern],
          srsRepetitions: 0,
          srsInterval: 0,
          srsEaseFactor: 2.5,
          dueDate: timestamp + i * 10,
          state: 'NEW',
          createdAt: timestamp + i,
          updatedAt: timestamp + i,
        });
      }
    });

    setImportSuccessMessage(`¡Se han añadido ${verbsToImport.length} verbos a tus Colecciones con SRS!`);
    setTimeout(() => {
      setImportSuccessMessage(null);
      if (onOpenDeck) onOpenDeck(newDeckId);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Main Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700">
                Gramática Esencial
              </span>
              <span className="text-xs text-slate-400 font-semibold">• 154 Verbos de tu Guía</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Aprende los Verbos Irregulares
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Domina el <strong>Infinitivo</strong>, <strong>Pasado Simple</strong> y{' '}
              <strong>Participio Pasado</strong> mediante patrones mnemotécnicos (A-A-A, A-B-B, A-B-A, A-B-C), audio nativo y ejercicios interactivos.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setIsPracticeOpen(true)}
              className="px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-violet-200 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Practicar Conjugación</span>
            </button>

            <button
              onClick={() => setIsFlashcardsOpen(true)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>Flashcards</span>
            </button>

            <button
              onClick={handleImportToDecks}
              className="px-3.5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Guardar como Colección en LexiCards para repasar con algoritmo SM-2"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Guardar Colección</span>
            </button>
          </div>
        </div>

        {/* Success toast after importing */}
        {importSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{importSuccessMessage}</span>
          </div>
        )}

        {/* Subtabs Switcher: Irregular vs Regular */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('irregular')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'irregular'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Verbos Irregulares (154)</span>
          </button>

          <button
            onClick={() => setActiveTab('regular')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'regular'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Verbos Regulares & Pronunciación ({REGULAR_VERBS.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: IRREGULAR VERBS ================= */}
      {activeTab === 'irregular' && (
        <div className="space-y-5">
          {/* Mnemonic Patterns Guide Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setPatternFilter(patternFilter === 'AAA' ? 'all' : 'AAA')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                patternFilter === 'AAA'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/50'
                  : 'bg-white border-slate-200/80 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  Patrón A-A-A
                </span>
                <span className="text-[11px] font-bold text-slate-400">20 verbos</span>
              </div>
              <strong className="text-xs text-slate-900 block font-bold">
                Las 3 formas idénticas
              </strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ej: <em>cut - cut - cut</em>, <em>put - put - put</em>, <em>cost - cost - cost</em>
              </p>
            </button>

            <button
              onClick={() => setPatternFilter(patternFilter === 'ABB' ? 'all' : 'ABB')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                patternFilter === 'ABB'
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400/50'
                  : 'bg-white border-slate-200/80 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                  Patrón A-B-B
                </span>
                <span className="text-[11px] font-bold text-slate-400">60 verbos</span>
              </div>
              <strong className="text-xs text-slate-900 block font-bold">
                Pasado = Participio
              </strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ej: <em>buy - bought - bought</em>, <em>feel - felt - felt</em>, <em>bring</em>
              </p>
            </button>

            <button
              onClick={() => setPatternFilter(patternFilter === 'ABA' ? 'all' : 'ABA')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                patternFilter === 'ABA'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-white border-slate-200/80 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  Patrón A-B-A
                </span>
                <span className="text-[11px] font-bold text-slate-400">4 verbos</span>
              </div>
              <strong className="text-xs text-slate-900 block font-bold">
                Infinitivo = Participio
              </strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ej: <em>come - came - come</em>, <em>run - ran - run</em>, <em>become</em>
              </p>
            </button>

            <button
              onClick={() => setPatternFilter(patternFilter === 'ABC' ? 'all' : 'ABC')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                patternFilter === 'ABC'
                  ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/50'
                  : 'bg-white border-slate-200/80 hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
                  Patrón A-B-C
                </span>
                <span className="text-[11px] font-bold text-slate-400">70 verbos</span>
              </div>
              <strong className="text-xs text-slate-900 block font-bold">
                Las 3 formas distintas
              </strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ej: <em>write - wrote - written</em>, <em>drink - drank - drunk</em>
              </p>
            </button>
          </div>

          {/* Search Bar & Filters */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por infinitivo, pasado, participio o español (ej. break, wrote, romper)..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View switch */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                  }`}
                  title="Vista Tabla"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                  }`}
                  title="Vista Tarjetas"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" /> Filtrar:
              </span>

              <button
                onClick={() => setPatternFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                  patternFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({IRREGULAR_VERBS.length})
              </button>

              <button
                onClick={() => setPatternFilter('common')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-colors flex items-center gap-1 ${
                  patternFilter === 'common'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>⭐ Top Esenciales ({IRREGULAR_VERBS.filter((v) => v.common).length})</span>
              </button>

              <button
                onClick={() => setPatternFilter('favorites')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-colors flex items-center gap-1 ${
                  patternFilter === 'favorites'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                <span>Mis Favoritos ({favorites.length})</span>
              </button>

              <button
                onClick={() => setPatternFilter('AAA')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                  patternFilter === 'AAA'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                A-A-A
              </button>

              <button
                onClick={() => setPatternFilter('ABB')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                  patternFilter === 'ABB'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                A-B-B
              </button>

              <button
                onClick={() => setPatternFilter('ABA')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                  patternFilter === 'ABA'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                A-B-A
              </button>

              <button
                onClick={() => setPatternFilter('ABC')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                  patternFilter === 'ABC'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                A-B-C
              </button>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">⭐</th>
                      <th className="py-3 px-4">Infinitivo</th>
                      <th className="py-3 px-4">Pasado Simple</th>
                      <th className="py-3 px-4">Participio Pasado</th>
                      <th className="py-3 px-4">Español</th>
                      <th className="py-3 px-3 text-center">Patrón</th>
                      <th className="py-3 px-4 text-center">Audio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIrregularVerbs.length > 0 ? (
                      filteredIrregularVerbs.map((verb) => {
                        const isFav = favorites.includes(verb.id);
                        return (
                          <tr
                            key={verb.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => toggleFavorite(verb.id)}
                                className="cursor-pointer p-1 rounded-lg hover:bg-slate-200/50"
                                title={isFav ? 'Quitar de favoritos' : 'Marcar favorito'}
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    isFav ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                                  }`}
                                />
                              </button>
                            </td>

                            <td className="py-3 px-4 font-black text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{verb.infinitive}</span>
                                {verb.common && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                                    ★
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 font-bold text-indigo-700 font-mono">
                              {verb.pastSimple}
                            </td>

                            <td className="py-3 px-4 font-bold text-violet-700 font-mono">
                              {verb.pastParticiple}
                            </td>

                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {verb.spanish}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  verb.pattern === 'AAA'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : verb.pattern === 'ABB'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : verb.pattern === 'ABA'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {verb.pattern}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => speakWord(verb.infinitive, 'en-US')}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Escuchar infinitivo"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    speakVerbTriplet(
                                      verb.infinitive,
                                      verb.pastSimple,
                                      verb.pastParticiple
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                                  title="Escuchar las 3 formas en secuencia"
                                >
                                  <Headphones className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No se encontraron verbos irregulares para este filtro o búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredIrregularVerbs.map((verb) => {
                const isFav = favorites.includes(verb.id);
                return (
                  <div
                    key={verb.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            verb.pattern === 'AAA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : verb.pattern === 'ABB'
                              ? 'bg-indigo-100 text-indigo-800'
                              : verb.pattern === 'ABA'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          Patrón {verb.pattern}
                        </span>
                        {verb.common && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            ★ Top
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFavorite(verb.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        <button
                          onClick={() =>
                            speakVerbTriplet(verb.infinitive, verb.pastSimple, verb.pastParticiple)
                          }
                          className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          title="Escuchar las 3 formas"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {verb.infinitive}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{verb.spanish}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-indigo-50/70 p-2 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-indigo-500 block">
                          Past Simple
                        </span>
                        <strong className="text-indigo-900 font-mono font-bold block">
                          {verb.pastSimple}
                        </strong>
                      </div>

                      <div className="bg-violet-50/70 p-2 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-violet-500 block">
                          Past Participle
                        </span>
                        <strong className="text-violet-900 font-mono font-bold block">
                          {verb.pastParticiple}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: REGULAR VERBS & PRONUNCIATION ================= */}
      {activeTab === 'regular' && (
        <div className="space-y-5">
          {/* Explanation of the 3 Pronunciation Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* /id/ sound */}
            <div
              onClick={() => setSoundFilter(soundFilter === '/id/' ? 'all' : '/id/')}
              className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                soundFilter === '/id/'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/50'
                  : 'bg-white border-slate-200/80 hover:border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full font-mono">
                  Sonido /ɪd/
                </span>
                <span className="text-xs text-slate-400 font-bold">16 verbos</span>
              </div>
              <strong className="text-sm font-bold text-slate-900 block">
                Terminación en T o D
              </strong>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ¡Agrega una sílaba extra! Suena como "id".
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-rose-700 font-medium">
                Ej: <em>Want</em> ➔ <strong>Wanted</strong>, <em>Need</em> ➔ <strong>Needed</strong>
              </div>
            </div>

            {/* /t/ sound */}
            <div
              onClick={() => setSoundFilter(soundFilter === '/t/' ? 'all' : '/t/')}
              className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                soundFilter === '/t/'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-white border-slate-200/80 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full font-mono">
                  Sonido /t/
                </span>
                <span className="text-xs text-slate-400 font-bold">22 verbos</span>
              </div>
              <strong className="text-sm font-bold text-slate-900 block">
                Sonidos Sordos (Voiceless)
              </strong>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sin vibración en cuerdas vocales (p, k, f, s, sh, ch).
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-medium">
                Ej: <em>Cook</em> ➔ <strong>Cooked</strong>, <em>Help</em> ➔ <strong>Helped</strong>
              </div>
            </div>

            {/* /d/ sound */}
            <div
              onClick={() => setSoundFilter(soundFilter === '/d/' ? 'all' : '/d/')}
              className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                soundFilter === '/d/'
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/50'
                  : 'bg-white border-slate-200/80 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full font-mono">
                  Sonido /d/
                </span>
                <span className="text-xs text-slate-400 font-bold">31 verbos</span>
              </div>
              <strong className="text-sm font-bold text-slate-900 block">
                Sonidos Sonoros & Vocales
              </strong>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Con vibración (l, n, r, b, v, g, m, z y todas las vocales).
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-blue-700 font-medium">
                Ej: <em>Play</em> ➔ <strong>Played</strong>, <em>Clean</em> ➔ <strong>Cleaned</strong>
              </div>
            </div>
          </div>

          {/* Regular Verbs Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filtrar por pronunciación:</span>
                <button
                  onClick={() => setSoundFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    soundFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({REGULAR_VERBS.length})
                </button>
                <button
                  onClick={() => setSoundFilter('/id/')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono cursor-pointer ${
                    soundFilter === '/id/'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  /id/
                </button>
                <button
                  onClick={() => setSoundFilter('/t/')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono cursor-pointer ${
                    soundFilter === '/t/'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  /t/
                </button>
                <button
                  onClick={() => setSoundFilter('/d/')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono cursor-pointer ${
                    soundFilter === '/d/'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  /d/
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar verbo regular..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Base Form</th>
                    <th className="py-3 px-4">Past & Participle (-ed)</th>
                    <th className="py-3 px-4 text-center">Terminación Fonética</th>
                    <th className="py-3 px-4">Español</th>
                    <th className="py-3 px-4 text-center">Pronunciación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegularVerbs.map((verb) => (
                    <tr key={verb.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{verb.base}</td>
                      <td className="py-3 px-4 font-bold text-indigo-700 font-mono">
                        {verb.past}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-full ${
                            verb.sound === '/id/'
                              ? 'bg-rose-100 text-rose-800'
                              : verb.sound === '/t/'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {verb.sound} sound
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{verb.spanish}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => speakWord(verb.past, 'en-US')}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title={`Escuchar pronunciación de ${verb.past}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Practice Modal */}
      <VerbsPracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        verbs={IRREGULAR_VERBS}
        favorites={favorites}
      />

      {/* Flashcards Modal */}
      <VerbsFlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        verbs={filteredIrregularVerbs.length > 0 ? filteredIrregularVerbs : IRREGULAR_VERBS}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};
