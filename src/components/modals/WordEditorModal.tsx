import { useState, useEffect } from 'react';
import type { Card, PartOfSpeech } from '../../types';
import { speakWord } from '../../lib/speech';
import { Volume2, X, Sparkles } from 'lucide-react';

interface WordEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<Card, 'id' | 'deckId' | 'createdAt' | 'updatedAt' | 'srsRepetitions' | 'srsInterval' | 'srsEaseFactor' | 'dueDate' | 'state'>) => void;
  initialCard?: Card | null;
  targetLang: string;
}

const PART_OF_SPEECH_OPTIONS: Array<{ value: PartOfSpeech; label: string }> = [
  { value: 'noun', label: 'Sustantivo' },
  { value: 'verb', label: 'Verbo' },
  { value: 'adjective', label: 'Adjetivo' },
  { value: 'adverb', label: 'Adverbio' },
  { value: 'phrase', label: 'Frase' },
  { value: 'idiom', label: 'Modismo / Expresión' },
  { value: 'preposition', label: 'Preposición' },
  { value: 'conjunction', label: 'Conjunción' },
  { value: 'other', label: 'Otro' },
];

export const WordEditorModal: React.FC<WordEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard,
  targetLang,
}) => {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>('noun');
  const [phonetic, setPhonetic] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialCard) {
      setWord(initialCard.word);
      setTranslation(initialCard.translation);
      setPartOfSpeech((initialCard.partOfSpeech as PartOfSpeech) || 'noun');
      setPhonetic(initialCard.phonetic || '');
      setDefinition(initialCard.definition || '');
      setExample(initialCard.example || '');
      setExampleTranslation(initialCard.exampleTranslation || '');
      setNotes(initialCard.notes || '');
    } else {
      setWord('');
      setTranslation('');
      setPartOfSpeech('noun');
      setPhonetic('');
      setDefinition('');
      setExample('');
      setExampleTranslation('');
      setNotes('');
    }
  }, [initialCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;

    onSave({
      word: word.trim(),
      translation: translation.trim(),
      partOfSpeech,
      phonetic: phonetic.trim() || undefined,
      definition: definition.trim() || undefined,
      example: example.trim() || undefined,
      exampleTranslation: exampleTranslation.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: [],
    });
    onClose();
  };

  const handleTestAudio = () => {
    if (word.trim()) {
      speakWord(word.trim(), targetLang);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-lg">
              {initialCard ? 'Editar Palabra' : 'Nueva Palabra'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Word and Audio Test */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Palabra o Término *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="ej. Serendipity, Resilient, Avoir..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm font-medium"
              />
              <button
                type="button"
                onClick={handleTestAudio}
                title="Escuchar pronunciación"
                className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Translation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Traducción *
            </label>
            <input
              type="text"
              required
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="ej. Hallazgo afortunado, Resiliente..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm"
            />
          </div>

          {/* Part of Speech & Phonetic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Categoría Gramatical
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value as PartOfSpeech)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              >
                {PART_OF_SPEECH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Fonética / IPA
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="ej. /ˌser.ənˈdɪp.ə.ti/"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm font-mono text-xs"
              />
            </div>
          </div>

          {/* Definition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Definición (Opcional)
            </label>
            <textarea
              rows={2}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Explicación del significado en idioma objetivo o materno..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm resize-none"
            />
          </div>

          {/* Example Sentence & Example Translation */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-semibold text-indigo-700 block">
              📖 Contexto de Uso (Recomendado para retención)
            </span>
            <div>
              <input
                type="text"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Oración de ejemplo en el idioma objetivo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm"
              />
            </div>
            <div>
              <input
                type="text"
                value={exampleTranslation}
                onChange={(e) => setExampleTranslation(e.target.value)}
                placeholder="Traducción de la oración de ejemplo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Notes / Mnemonic */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nota / Truco Nemotécnico (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Asociación mental para no olvidarla..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
            />
          </div>

          {/* Buttons */}
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
              {initialCard ? 'Guardar Cambios' : 'Añadir Palabra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
