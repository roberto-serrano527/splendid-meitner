import type { Deck, Card } from '../../types';
import { isCardDue } from '../../lib/srs';
import { Share2, Sparkles, BookOpen, Trash2, Edit3 } from 'lucide-react';

interface DeckCardProps {
  deck: Deck;
  cards: Card[];
  onOpenDeck: (deck: Deck) => void;
  onStudySRS: (deck: Deck) => void;
  onShare: (deck: Deck) => void;
  onEdit: (deck: Deck) => void;
  onDelete: (deck: Deck) => void;
}

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string; border: string }> = {
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100' },
  violet: { bg: 'bg-violet-600', text: 'text-violet-600', badge: 'bg-violet-50 text-violet-700', border: 'border-violet-100' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700', border: 'border-amber-100' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', badge: 'bg-rose-50 text-rose-700', border: 'border-rose-100' },
  sky: { bg: 'bg-sky-600', text: 'text-sky-600', badge: 'bg-sky-50 text-sky-700', border: 'border-sky-100' },
};

const LANG_LABELS: Record<string, string> = {
  'en-US': '🇺🇸 Inglés',
  'es-ES': '🇪🇸 Español',
  'fr-FR': '🇫🇷 Francés',
  'de-DE': '🇩🇪 Alemán',
  'it-IT': '🇮🇹 Italiano',
  'ja-JP': '🇯🇵 Japonés',
  'pt-BR': '🇧🇷 Portugués',
  'zh-CN': '🇨🇳 Chino',
};

export const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  cards,
  onOpenDeck,
  onStudySRS,
  onShare,
  onEdit,
  onDelete,
}) => {
  const theme = COLOR_MAP[deck.color] || COLOR_MAP.indigo;
  const now = Date.now();
  const dueCards = cards.filter((c) => isCardDue(c, now));
  const masteredCards = cards.filter((c) => c.state === 'MASTERED');
  const masteryPercentage = cards.length > 0 ? Math.round((masteredCards.length / cards.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
      {/* Top Banner with color indicator */}
      <div>
        <div className={`h-2.5 w-full ${theme.bg}`} />
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${theme.badge}`}>
                {LANG_LABELS[deck.targetLang] || deck.targetLang}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {cards.length} {cards.length === 1 ? 'palabra' : 'palabras'}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(deck);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Compartir o Exportar"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(deck);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Editar Colección"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(deck);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Eliminar Colección"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <h3
            onClick={() => onOpenDeck(deck)}
            className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
          >
            {deck.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-8">
            {deck.description || 'Sin descripción.'}
          </p>

          {/* Mastery Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Dominadas</span>
              <span>{masteryPercentage}% ({masteredCards.length}/{cards.length})</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${masteryPercentage}%` }}
              />
              <div
                className="h-full bg-indigo-400 transition-all duration-500"
                style={{
                  width: `${cards.length > 0 ? ((cards.filter((c) => c.state === 'REVIEW').length) / cards.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
        {dueCards.length > 0 ? (
          <button
            onClick={() => onStudySRS(deck)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Repasar ({dueCards.length})</span>
          </button>
        ) : (
          <button
            onClick={() => onStudySRS(deck)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Estudiar</span>
          </button>
        )}

        <button
          onClick={() => onOpenDeck(deck)}
          className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          Ver palabras
        </button>
      </div>
    </div>
  );
};
