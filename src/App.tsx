import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initSampleDataIfNeeded, reviewCard, deleteDeckCascade } from './db';
import type { Deck, Card, SRSGrade } from './types';
import { isCardDue } from './lib/srs';
import { Navbar } from './components/layout/Navbar';
import { BottomNav, type MainTab } from './components/layout/BottomNav';
import { DeckCard } from './components/deck/DeckCard';
import { DeckDetailView } from './components/deck/DeckDetailView';
import { DeckEditorModal } from './components/modals/DeckEditorModal';
import { WordEditorModal } from './components/modals/WordEditorModal';
import { BulkImportModal } from './components/modals/BulkImportModal';
import { ExportModal } from './components/modals/ExportModal';
import { AIPromptModal } from './components/modals/AIPromptModal';
import { SRSReviewSession } from './components/study/SRSReviewSession';
import { FlashcardsSession } from './components/study/FlashcardsSession';
import { QuizSession } from './components/study/QuizSession';
import { SpellingSession } from './components/study/SpellingSession';
import { StatsView } from './components/stats/StatsView';
import { VerbsSection } from './components/verbs/VerbsSection';
import {
  Sparkles,
  Download,
  Smartphone,
  Layers,
  ArrowRight,
  Bot,
  BookA,
} from 'lucide-react';

export function App() {
  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<MainTab>('decks');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);

  // Active study mode
  const [activeStudyMode, setActiveStudyMode] = useState<
    'srs' | 'flashcards' | 'quiz' | 'spelling' | null
  >(null);
  const [sessionCards, setSessionCards] = useState<Card[]>([]);

  // Modals state
  const [isDeckEditorOpen, setIsDeckEditorOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportingDeck, setExportingDeck] = useState<Deck | null>(null);

  // PWA Install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Shared Link Import State
  const [sharedDeckPrompt, setSharedDeckPrompt] = useState<{
    deck: Partial<Deck>;
    cards: any[];
  } | null>(null);

  // Initialize Sample Data
  useEffect(() => {
    initSampleDataIfNeeded().catch(console.error);
  }, []);

  // Listen for PWA beforeinstallprompt on Android/Chrome
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Listen for Shared Link in URL Hash (#import=...)
  useEffect(() => {
    const checkHashImport = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#import=')) {
        try {
          const base64 = hash.replace('#import=', '');
          const jsonStr = decodeURIComponent(escape(atob(base64)));
          const payload = JSON.parse(jsonStr);
          if (payload.deck && payload.cards) {
            setSharedDeckPrompt({
              deck: payload.deck,
              cards: payload.cards,
            });
            // Clear hash
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch (err) {
          console.error('Error importing shared deck from hash:', err);
        }
      }
    };

    checkHashImport();
    window.addEventListener('hashchange', checkHashImport);
    return () => window.removeEventListener('hashchange', checkHashImport);
  }, []);

  // Reactive DB queries with Dexie
  const decks = useLiveQuery(() => db.decks.toArray(), []) || [];
  const cards = useLiveQuery(() => db.cards.toArray(), []) || [];
  const studyLogs = useLiveQuery(() => db.studyLogs.toArray(), []) || [];

  const now = Date.now();
  const dueTodayCards = cards.filter((c) => isCardDue(c, now));

  const activeDeck = decks.find((d) => d.id === activeDeckId) || null;
  const activeDeckCards = cards.filter((c) => c.deckId === activeDeckId);

  // Compute a fallback deck for global study if activeDeck is not set
  const studyDeck: Deck = activeDeck || {
    id: 'daily-review',
    title: 'Repaso Diario',
    description: 'Todas las palabras pendientes de hoy',
    targetLang:
      (sessionCards[0] && decks.find((d) => d.id === sessionCards[0].deckId)?.targetLang) ||
      'en-US',
    sourceLang: 'es-ES',
    color: 'amber',
    createdAt: now,
    updatedAt: now,
  };

  // Install PWA
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  // Deck CRUD
  const handleSaveDeck = async (deckData: {
    title: string;
    description: string;
    targetLang: string;
    color: string;
  }) => {
    const timestamp = Date.now();
    if (editingDeck) {
      await db.decks.update(editingDeck.id, {
        ...deckData,
        updatedAt: timestamp,
      });
    } else {
      const newDeckId = `deck-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
      await db.decks.add({
        id: newDeckId,
        ...deckData,
        sourceLang: 'es-ES',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    setEditingDeck(null);
  };

  const handleDeleteDeck = async (deck: Deck) => {
    if (confirm(`¿Estás seguro de eliminar la colección "${deck.title}" y todas sus palabras?`)) {
      await deleteDeckCascade(deck.id);
      if (activeDeckId === deck.id) {
        setActiveDeckId(null);
      }
    }
  };

  // Card CRUD
  const handleSaveWord = async (
    cardData: Omit<
      Card,
      | 'id'
      | 'deckId'
      | 'createdAt'
      | 'updatedAt'
      | 'srsRepetitions'
      | 'srsInterval'
      | 'srsEaseFactor'
      | 'dueDate'
      | 'state'
    >
  ) => {
    if (!activeDeckId) return;
    const timestamp = Date.now();

    if (editingCard) {
      await db.cards.update(editingCard.id, {
        ...cardData,
        updatedAt: timestamp,
      });
    } else {
      const newCardId = `card-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
      await db.cards.add({
        id: newCardId,
        deckId: activeDeckId,
        ...cardData,
        srsRepetitions: 0,
        srsInterval: 0,
        srsEaseFactor: 2.5,
        dueDate: timestamp,
        state: 'NEW',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    setEditingCard(null);
  };

  const handleDeleteWord = async (cardId: string) => {
    if (confirm('¿Eliminar esta palabra?')) {
      await db.cards.delete(cardId);
      await db.studyLogs.where('cardId').equals(cardId).delete();
    }
  };

  // Review card with SRS
  const handleReviewCard = async (cardId: string, grade: SRSGrade) => {
    await reviewCard(cardId, grade);
  };

  // Handle Bulk Import
  const handleBulkImportSuccess = async (
    importedCards: Array<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>>,
    targetDeckId: string,
    newDeckMeta?: Partial<Deck>
  ) => {
    const timestamp = Date.now();
    let finalDeckId = targetDeckId;

    if (targetDeckId === 'NEW_DECK' && newDeckMeta) {
      finalDeckId = `deck-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
      await db.decks.add({
        id: finalDeckId,
        title: newDeckMeta.title || 'Colección Importada',
        description: newDeckMeta.description || '',
        targetLang: newDeckMeta.targetLang || 'en-US',
        sourceLang: 'es-ES',
        color: newDeckMeta.color || 'indigo',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await db.transaction('rw', db.cards, async () => {
      for (let i = 0; i < importedCards.length; i++) {
        const c = importedCards[i];
        await db.cards.add({
          ...c,
          id: `card-${timestamp}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          deckId: finalDeckId,
          createdAt: timestamp + i,
          updatedAt: timestamp + i,
        });
      }
    });

    setActiveDeckId(finalDeckId);
  };

  // Handle Shared Deck prompt acceptance
  const handleConfirmSharedDeckImport = async () => {
    if (!sharedDeckPrompt) return;
    const timestamp = Date.now();
    const newDeckId = `deck-shared-${timestamp}`;

    await db.transaction('rw', db.decks, db.cards, async () => {
      await db.decks.add({
        id: newDeckId,
        title: sharedDeckPrompt.deck.title || 'Colección Compartida',
        description: sharedDeckPrompt.deck.description || 'Importada desde enlace compartido.',
        targetLang: sharedDeckPrompt.deck.targetLang || 'en-US',
        sourceLang: sharedDeckPrompt.deck.sourceLang || 'es-ES',
        color: sharedDeckPrompt.deck.color || 'violet',
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      for (let i = 0; i < sharedDeckPrompt.cards.length; i++) {
        const c = sharedDeckPrompt.cards[i];
        await db.cards.add({
          ...c,
          id: `card-shared-${timestamp}-${i}`,
          deckId: newDeckId,
          srsRepetitions: 0,
          srsInterval: 0,
          srsEaseFactor: 2.5,
          dueDate: timestamp,
          state: 'NEW',
          createdAt: timestamp + i,
          updatedAt: timestamp + i,
        });
      }
    });

    setSharedDeckPrompt(null);
    setActiveDeckId(newDeckId);
  };

  // Start study sessions
  const startSRSForDeck = (deck: Deck) => {
    const deckCards = cards.filter((c) => c.deckId === deck.id);
    const due = deckCards.filter((c) => isCardDue(c, Date.now()));
    setActiveDeckId(deck.id); // Set active deck so UI renders properly
    setSessionCards(due.length > 0 ? due : deckCards);
    setActiveStudyMode('srs');
  };

  const startDailyReviewAll = () => {
    const due = cards.filter((c) => isCardDue(c, Date.now()));
    if (due.length > 0) {
      setSessionCards(due);
      setActiveStudyMode('srs');
    } else if (cards.length > 0) {
      // If none due today, study 15 random cards
      setSessionCards([...cards].sort(() => Math.random() - 0.5).slice(0, 15));
      setActiveStudyMode('srs');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-safe">
      {/* Top Navbar */}
      <Navbar
        dueTodayCount={dueTodayCards.length}
        onNewDeck={() => {
          setEditingDeck(null);
          setIsDeckEditorOpen(true);
        }}
        onImportClick={() => setIsBulkImportOpen(true)}
        onAIPromptClick={() => setIsAIPromptOpen(true)}
        onVerbsClick={() => {
          setActiveDeckId(null);
          setCurrentTab('verbs');
        }}
        isVerbsActive={!activeDeck && currentTab === 'verbs'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        {/* PWA Android Install Banner */}
        {showInstallBanner && (
          <div className="mb-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-3.5 sm:p-4 rounded-3xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <strong className="block text-sm font-bold">Instalar como App en Android</strong>
                <span className="text-xs text-indigo-100">
                  Acceso rápido desde tu pantalla de inicio y funcionamiento 100% offline.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallPWA}
                className="px-3.5 py-1.5 bg-white text-indigo-700 font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                Instalar
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-xs text-indigo-200 hover:text-white px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Desktop Tab Switcher */}
        {!activeDeck && (
          <div className="hidden sm:flex items-center gap-2 mb-6">
            <button
              onClick={() => setCurrentTab('decks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'decks'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Colecciones ({decks.length})
            </button>
            <button
              onClick={() => setCurrentTab('verbs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'verbs'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <BookA className="w-3.5 h-3.5 text-violet-400" />
              <span>Verbos Irregulares (154)</span>
            </button>
            <button
              onClick={() => setCurrentTab('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'today'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Repaso Hoy ({dueTodayCards.length})</span>
            </button>
            <button
              onClick={() => setCurrentTab('stats')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'stats'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Progreso & SRS
            </button>
          </div>
        )}

        {/* View Routing */}
        {activeDeck ? (
          <DeckDetailView
            deck={activeDeck}
            cards={activeDeckCards}
            onBack={() => setActiveDeckId(null)}
            onAddWord={() => {
              setEditingCard(null);
              setIsWordEditorOpen(true);
            }}
            onEditWord={(card) => {
              setEditingCard(card);
              setIsWordEditorOpen(true);
            }}
            onDeleteWord={handleDeleteWord}
            onImportWords={() => setIsBulkImportOpen(true)}
            onShareDeck={() => {
              setExportingDeck(activeDeck);
              setIsExportOpen(true);
            }}
            onStartSRS={() => startSRSForDeck(activeDeck)}
            onStartFlashcards={() => {
              setSessionCards(activeDeckCards);
              setActiveStudyMode('flashcards');
            }}
            onStartQuiz={() => {
              setSessionCards(activeDeckCards);
              setActiveStudyMode('quiz');
            }}
            onStartSpelling={() => {
              setSessionCards(activeDeckCards);
              setActiveStudyMode('spelling');
            }}
          />
        ) : currentTab === 'verbs' ? (
          <VerbsSection onOpenDeck={(deckId) => setActiveDeckId(deckId)} />
        ) : currentTab === 'decks' ? (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Tus Colecciones de Vocabulario
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Aprende palabras de forma eficiente con memoria espaciada (SM-2) y pronunciación nativa.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsAIPromptOpen(true)}
                  className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-2xl border border-indigo-200/80 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span>Prompt para IA</span>
                </button>

                {dueTodayCards.length > 0 && (
                  <button
                    onClick={startDailyReviewAll}
                    className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Repasar Todo Hoy ({dueTodayCards.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Deck Cards Grid */}
            {decks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    cards={cards.filter((c) => c.deckId === deck.id)}
                    onOpenDeck={(d) => setActiveDeckId(d.id)}
                    onStudySRS={startSRSForDeck}
                    onShare={(d) => {
                      setExportingDeck(d);
                      setIsExportOpen(true);
                    }}
                    onEdit={(d) => {
                      setEditingDeck(d);
                      setIsDeckEditorOpen(true);
                    }}
                    onDelete={handleDeleteDeck}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-4">
                <Layers className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">No tienes colecciones aún</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Crea tu primera colección, usa el generador de prompts con IA o importa un archivo CSV, texto o JSON.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => setIsDeckEditorOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    + Crear Colección
                  </button>
                  <button
                    onClick={() => setIsAIPromptOpen(true)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200/80"
                  >
                    🤖 Generar con IA
                  </button>
                  <button
                    onClick={() => setIsBulkImportOpen(true)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Importar archivo
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : currentTab === 'today' ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                <span>Palabras Pendientes para Hoy</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                El algoritmo SM-2 ha calculado que estas palabras están a punto de olvidarse y necesitan repaso.
              </p>

              {dueTodayCards.length > 0 ? (
                <div className="mt-5 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <strong className="text-base font-bold text-amber-900 block">
                      {dueTodayCards.length} palabras esperando tu revisión
                    </strong>
                    <span className="text-xs text-amber-700">
                      Toma menos de 3 minutos completar esta sesión.
                    </span>
                  </div>
                  <button
                    onClick={startDailyReviewAll}
                    className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Comenzar Repaso</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-5 p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <span className="text-2xl block mb-1">🎉</span>
                  <strong className="text-base font-bold text-emerald-900 block">
                    ¡Estás al día por hoy!
                  </strong>
                  <span className="text-xs text-emerald-700 block mt-1">
                    No tienes palabras vencidas para hoy. Si deseas seguir practicando, puedes abrir cualquier colección y usar los modos Flashcard, Quiz o Dictado.
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <StatsView decks={decks} cards={cards} studyLogs={studyLogs} />
        )}
      </main>

      {/* Bottom Navigation for Mobile / Android */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setActiveDeckId(null);
          setCurrentTab(tab);
        }}
        dueTodayCount={dueTodayCards.length}
      />

      {/* Modals */}
      <DeckEditorModal
        isOpen={isDeckEditorOpen}
        onClose={() => {
          setIsDeckEditorOpen(false);
          setEditingDeck(null);
        }}
        onSave={handleSaveDeck}
        initialDeck={editingDeck}
      />

      <WordEditorModal
        isOpen={isWordEditorOpen}
        onClose={() => {
          setIsWordEditorOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveWord}
        initialCard={editingCard}
        targetLang={activeDeck?.targetLang || 'en-US'}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        decks={decks}
        currentDeckId={activeDeckId || undefined}
        onImportSuccess={handleBulkImportSuccess}
        onOpenAIPrompt={() => setIsAIPromptOpen(true)}
      />

      <AIPromptModal
        isOpen={isAIPromptOpen}
        onClose={() => setIsAIPromptOpen(false)}
        decks={decks}
        currentDeckId={activeDeckId || undefined}
        onImportCards={handleBulkImportSuccess}
      />

      {exportingDeck && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => {
            setIsExportOpen(false);
            setExportingDeck(null);
          }}
          deck={exportingDeck}
          cards={cards.filter((c) => c.deckId === exportingDeck.id)}
        />
      )}

      {/* Shared Deck Received Prompt */}
      {sharedDeckPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              ¡Colección Compartida Recibida!
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Se ha detectado la colección: <strong>"{sharedDeckPrompt.deck.title}"</strong> con{' '}
              <strong>{sharedDeckPrompt.cards.length} palabras</strong>.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSharedDeckPrompt(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
              >
                Descartar
              </button>
              <button
                onClick={handleConfirmSharedDeckImport}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200"
              >
                Importar a mi Biblioteca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Study Session Overlays */}
      {activeStudyMode === 'srs' && sessionCards.length > 0 && (
        <SRSReviewSession
          deck={studyDeck}
          cards={sessionCards}
          onReviewCard={handleReviewCard}
          onClose={() => setActiveStudyMode(null)}
        />
      )}

      {activeStudyMode === 'flashcards' && (activeDeck || studyDeck) && sessionCards.length > 0 && (
        <FlashcardsSession
          deck={activeDeck || studyDeck}
          cards={sessionCards}
          onClose={() => setActiveStudyMode(null)}
        />
      )}

      {activeStudyMode === 'quiz' && (activeDeck || studyDeck) && sessionCards.length > 0 && (
        <QuizSession
          deck={activeDeck || studyDeck}
          cards={sessionCards}
          onClose={() => setActiveStudyMode(null)}
        />
      )}

      {activeStudyMode === 'spelling' && (activeDeck || studyDeck) && sessionCards.length > 0 && (
        <SpellingSession
          deck={activeDeck || studyDeck}
          cards={sessionCards}
          onClose={() => setActiveStudyMode(null)}
        />
      )}
    </div>
  );
}

export default App;
