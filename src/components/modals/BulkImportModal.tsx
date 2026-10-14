import React, { useState } from 'react';
import { parseImportContent, type ParsedImportResult } from '../../lib/importer';
import type { Deck, Card } from '../../types';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles, Bot } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  currentDeckId?: string;
  onImportSuccess: (
    cards: Array<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>>,
    targetDeckId: string,
    newDeckMeta?: Partial<Deck>
  ) => void;
  onOpenAIPrompt?: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  decks,
  currentDeckId,
  onImportSuccess,
  onOpenAIPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState('');
  const [selectedDeckOption, setSelectedDeckOption] = useState<string>(
    currentDeckId || (decks.length > 0 ? decks[0].id : 'NEW_DECK')
  );
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedImportResult | null>(null);

  if (!isOpen) return null;

  const handleParse = (textToParse: string) => {
    const res = parseImportContent(textToParse);
    setParsedResult(res);
    if (res.deckMetadata?.title && !newDeckTitle) {
      setNewDeckTitle(res.deckMetadata.title);
      setSelectedDeckOption('NEW_DECK');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    handleParse(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.cards.length === 0) return;

    onImportSuccess(
      parsedResult.cards,
      selectedDeckOption,
      selectedDeckOption === 'NEW_DECK'
        ? {
            title: newDeckTitle.trim() || 'Colección Importada',
            description: parsedResult.deckMetadata?.description || 'Colección importada desde archivo/texto.',
            targetLang: parsedResult.deckMetadata?.targetLang || 'en-US',
            color: parsedResult.deckMetadata?.color || 'indigo',
          }
        : undefined
    );

    // Reset and close
    setRawText('');
    setParsedResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-lg">Importar Vocabulario</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Soporta archivos o texto en <strong>CSV, Texto Plano y JSON</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-100 flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                activeTab === 'text'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Pegar Texto Plano</span>
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                activeTab === 'file'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Subir Archivo (.csv, .txt, .json)</span>
            </button>
          </div>

          {onOpenAIPrompt && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAIPrompt();
              }}
              className="mb-2 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200/80 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              <span>Generar con IA</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'text' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Pega tu lista de palabras
                </label>
                <span className="text-[11px] text-slate-400">
                  Separadores aceptados: <code>-</code>, <code>:</code>, <code>|</code>, o <code>Tabulación (Excel)</code>
                </span>
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={handleTextChange}
                placeholder={`Ejemplo de formatos válidos:
Apple - Manzana - I eat a red apple
Dog - Perro
Serendipity | Serendipia | Finding something good by chance
Book : Libro : She is reading a book`}
                className="w-full p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs font-mono resize-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Selecciona tu archivo
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Arrastra o selecciona un archivo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos compatibles: .csv, .txt, .json (Anki, Quizlet o respaldos)
                </p>
                <input
                  type="file"
                  accept=".csv,.txt,.json,text/plain,text/csv,application/json"
                  onChange={handleFileUpload}
                  className="mt-3 block mx-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Destination Deck Selection */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Destino de importación
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {decks.length > 0 && (
                <div>
                  <select
                    value={selectedDeckOption}
                    onChange={(e) => setSelectedDeckOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="NEW_DECK">+ Crear una Nueva Colección</option>
                    {decks.map((d) => (
                      <option key={d.id} value={d.id}>
                        Añadir a: {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedDeckOption === 'NEW_DECK' && (
                <div>
                  <input
                    type="text"
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    placeholder="Nombre de la nueva colección..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          {parsedResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Palabras detectadas ({parsedResult.cards.length})
                </span>
                {parsedResult.errors.length > 0 && (
                  <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {parsedResult.errors.length} advertencia(s)
                  </span>
                )}
              </div>

              {parsedResult.cards.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {parsedResult.cards.slice(0, 15).map((c, idx) => (
                    <div key={idx} className="p-2.5 text-xs flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-900">{c.word}</div>
                      <div className="text-slate-600 text-right">{c.translation}</div>
                      {c.example && (
                        <div className="text-slate-400 text-xs italic hidden md:block max-w-xs truncate">
                          "{c.example}"
                        </div>
                      )}
                    </div>
                  ))}
                  {parsedResult.cards.length > 15 && (
                    <div className="p-2 text-center text-xs text-slate-400 bg-slate-50">
                      ... y {parsedResult.cards.length - 15} palabras más
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Escribe o sube palabras arriba para ver la previsualización.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!parsedResult || parsedResult.cards.length === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer ${
              parsedResult && parsedResult.cards.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            Importar {parsedResult && parsedResult.cards.length > 0 ? `(${parsedResult.cards.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
