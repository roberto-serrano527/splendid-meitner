import { BookOpen, Sparkles, Download, Plus, Bot, BookA } from 'lucide-react';

interface NavbarProps {
  onNewDeck: () => void;
  onImportClick: () => void;
  onAIPromptClick: () => void;
  onVerbsClick: () => void;
  isVerbsActive?: boolean;
  dueTodayCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewDeck,
  onImportClick,
  onAIPromptClick,
  onVerbsClick,
  isVerbsActive = false,
  dueTodayCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">LexiCards</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                SRS SM-2
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Vocabulario con Repetición Espaciada
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {dueTodayCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{dueTodayCount} para hoy</span>
            </div>
          )}

          <button
            onClick={onVerbsClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer border ${
              isVerbsActive
                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                : 'text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-200/80'
            }`}
            title="Aprender Verbos Irregulares y Reglas de Pronunciación"
          >
            <BookA className={`w-4 h-4 ${isVerbsActive ? 'text-white' : 'text-violet-600'}`} />
            <span>Verbos</span>
          </button>

          <button
            onClick={onAIPromptClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer"
            title="Generar vocabulario con prompt para ChatGPT, Claude o Gemini"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Prompt IA</span>
          </button>

          <button
            onClick={onImportClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Importar CSV, Texto o JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden xs:inline">Importar</span>
          </button>

          <button
            onClick={onNewDeck}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Colección</span>
          </button>
        </div>
      </div>
    </header>
  );
};
