import { useState, useEffect } from 'react';
import type { Deck } from '../../types';
import { Layers, X } from 'lucide-react';

interface DeckEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deckData: { title: string; description: string; targetLang: string; color: string }) => void;
  initialDeck?: Deck | null;
}

const LANGUAGES = [
  { code: 'en-US', label: '🇺🇸 Inglés (Estados Unidos)' },
  { code: 'es-ES', label: '🇪🇸 Español' },
  { code: 'fr-FR', label: '🇫🇷 Francés' },
  { code: 'de-DE', label: '🇩🇪 Alemán' },
  { code: 'it-IT', label: '🇮🇹 Italiano' },
  { code: 'ja-JP', label: '🇯🇵 Japonés' },
  { code: 'pt-BR', label: '🇧🇷 Portugués' },
  { code: 'zh-CN', label: '🇨🇳 Chino Mandarín' },
];

const COLORS = [
  { key: 'indigo', label: 'Índigo', bg: 'bg-indigo-600' },
  { key: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-600' },
  { key: 'violet', label: 'Violeta', bg: 'bg-violet-600' },
  { key: 'amber', label: 'Ámbar', bg: 'bg-amber-600' },
  { key: 'rose', label: 'Rosa', bg: 'bg-rose-600' },
  { key: 'sky', label: 'Cielo', bg: 'bg-sky-600' },
];

export const DeckEditorModal: React.FC<DeckEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDeck,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetLang, setTargetLang] = useState('en-US');
  const [color, setColor] = useState('indigo');

  useEffect(() => {
    if (initialDeck) {
      setTitle(initialDeck.title);
      setDescription(initialDeck.description || '');
      setTargetLang(initialDeck.targetLang || 'en-US');
      setColor(initialDeck.color || 'indigo');
    } else {
      setTitle('');
      setDescription('');
      setTargetLang('en-US');
      setColor('indigo');
    }
  }, [initialDeck, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      targetLang,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-lg">
              {initialDeck ? 'Editar Colección' : 'Nueva Colección'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre de la Colección *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. Inglés B2, Verbos Irregulares..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿De qué trata este mazo de palabras?"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Idioma que vas a aprender
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Color Distintivo
            </label>
            <div className="flex items-center gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform cursor-pointer ${
                    color === c.key ? 'ring-3 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-colors cursor-pointer"
            >
              {initialDeck ? 'Guardar Cambios' : 'Crear Colección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
