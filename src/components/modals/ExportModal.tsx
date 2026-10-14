import { useState } from 'react';
import type { Deck, Card } from '../../types';
import {
  exportToJsonFile,
  exportToCsvFile,
  exportToPlainTextFile,
  generateShareableUrl,
} from '../../lib/exporter';
import {
  Share2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: Deck;
  cards: Card[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  deck,
  cards,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyShareLink = () => {
    const url = generateShareableUrl(deck, cards);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-lg">Compartir y Exportar</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Deck Info */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-sm text-slate-900">{deck.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {cards.length} palabras disponibles para exportar
            </p>
          </div>

          {/* Share via Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Compartir con Enlace Directo
            </label>
            <p className="text-xs text-slate-500 mb-2.5">
              Cualquier persona con este enlace podrá previsualizar y clonar esta colección a su propia app al instante.
            </p>
            <button
              onClick={handleCopyShareLink}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Enlace copiado al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Enlace para Compartir</span>
                </>
              )}
            </button>
          </div>

          {/* Export Formats */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Descargar Archivo en tu Dispositivo
            </label>
            <div className="grid grid-cols-1 gap-2">
              {/* CSV */}
              <button
                onClick={() => exportToCsvFile(deck, cards)}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Formato CSV (.csv)</span>
                    <span className="text-[11px] text-slate-500">
                      Compatible con Excel, Google Sheets, Anki y Quizlet
                    </span>
                  </div>
                </div>
              </button>

              {/* JSON */}
              <button
                onClick={() => exportToJsonFile(deck, cards)}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <FileCode2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Formato JSON (.json)</span>
                    <span className="text-[11px] text-slate-500">
                      Copia de seguridad completa (incluye historial SRS y fonética)
                    </span>
                  </div>
                </div>
              </button>

              {/* Plain Text */}
              <button
                onClick={() => exportToPlainTextFile(deck, cards)}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-slate-500 hover:bg-slate-100 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Texto Plano (.txt)</span>
                    <span className="text-[11px] text-slate-500">
                      Lista simple con separadores <code>palabra - traducción - ejemplo</code>
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
