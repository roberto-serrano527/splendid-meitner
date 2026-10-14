import { useState } from 'react';
import type { Deck, Card } from '../../types';
import { parseImportContent } from '../../lib/importer';
import {
  Sparkles,
  Copy,
  Check,
  X,
  Bot,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Film,
  Tv,
} from 'lucide-react';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  currentDeckId?: string;
  onImportCards: (
    cards: Array<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>>,
    targetDeckId: string,
    newDeckMeta?: Partial<Deck>
  ) => void;
}

type PromptCategory = 'topic' | 'book' | 'movie' | 'series';

const LANGUAGES = [
  { code: 'en-US', name: 'Inglés' },
  { code: 'fr-FR', name: 'Francés' },
  { code: 'de-DE', name: 'Alemán' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-BR', name: 'Portugués' },
  { code: 'ja-JP', name: 'Japonés' },
  { code: 'es-ES', name: 'Español' },
  { code: 'zh-CN', name: 'Chino' },
];

const PRESET_TOPICS = [
  'Viajes, Aeropuerto y Hotel',
  'Negocios y Trabajo',
  'Comida y Restaurantes',
  'Expresiones Cotidianas y Slang',
  'Phrasal Verbs Comunes',
  'Tecnología y Programación',
  'Salud y Medicina',
  'Vocabulario Avanzado C1',
];

const PRESET_BOOKS = [
  { title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling' },
  { title: '1984', author: 'George Orwell' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { title: 'The Little Prince', author: 'Antoine de Saint-Exupéry' },
  { title: 'Atomic Habits', author: 'James Clear' },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee' },
];

const PRESET_MOVIES = [
  'Interstellar',
  'Inception',
  'Pulp Fiction',
  'The Dark Knight',
  'The Matrix',
  'The Godfather',
  'Spirited Away',
  'Gladiator',
];

const PRESET_SERIES = [
  { title: 'Friends', context: 'Slang y humor cotidiano' },
  { title: 'Breaking Bad', context: 'Drama y crimen' },
  { title: 'Stranger Things', context: 'Misterio y años 80' },
  { title: 'The Office', context: 'Inglés de oficina y humor' },
  { title: 'Peaky Blinders', context: 'Acento británico y época' },
  { title: 'Modern Family', context: 'Expresiones familiares diarias' },
];

const LEVELS = [
  { id: 'A1 - Principiante', label: 'A1 (Principiante)' },
  { id: 'A2 - Básico', label: 'A2 (Básico)' },
  { id: 'B1 - Intermedio', label: 'B1 (Intermedio)' },
  { id: 'B2 - Intermedio Alto', label: 'B2 (Intermedio Alto)' },
  { id: 'C1 - Avanzado', label: 'C1 (Avanzado)' },
];

export const AIPromptModal: React.FC<AIPromptModalProps> = ({
  isOpen,
  onClose,
  decks,
  currentDeckId,
  onImportCards,
}) => {
  const [category, setCategory] = useState<PromptCategory>('topic');
  const [targetLang, setTargetLang] = useState('Inglés');
  const [level, setLevel] = useState('B1 - Intermedio');
  const [wordCount, setWordCount] = useState(20);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Category specific fields
  const [topic, setTopic] = useState('Viajes, Aeropuerto y Hotel');
  const [bookTitle, setBookTitle] = useState('Harry Potter and the Sorcerer\'s Stone');
  const [bookAuthor, setBookAuthor] = useState('J.K. Rowling');
  const [movieTitle, setMovieTitle] = useState('Interstellar');
  const [seriesTitle, setSeriesTitle] = useState('Friends');
  const [seriesContext, setSeriesContext] = useState('Expresiones cotidianas');

  // Direct paste & import section
  const [aiResponseText, setAiResponseText] = useState('');
  const [selectedDeckOption, setSelectedDeckOption] = useState<string>(
    currentDeckId || (decks.length > 0 ? decks[0].id : 'NEW_DECK')
  );
  const [newDeckTitle, setNewDeckTitle] = useState('');

  if (!isOpen) return null;

  // Build the dynamic prompt depending on category
  let generatedPrompt = '';

  if (category === 'book') {
    generatedPrompt = `Actúa como un profesor experto de idiomas y literatura. Voy a leer el libro "${bookTitle}"${bookAuthor.trim() ? ` de ${bookAuthor.trim()}` : ''} en ${targetLang}.

Genera una lista de ${wordCount} palabras clave, expresiones literarias, adjetivos descriptivos y vocabulario característico que aparecen con frecuencia en esta obra (para nivel ${level}), de modo que pueda leer la obra fluidamente y comprender la atmósfera sin tener que buscar cada palabra en el diccionario.

FORMATO OBLIGATORIO:
Responde ÚNICAMENTE con texto plano, exactamente una palabra por línea, usando guiones como separadores con esta estructura:

Palabra - Traducción en español - Oración de ejemplo inspirada en el libro - Fonética IPA

REGLAS ESTRICTAS:
1. NO uses números (1., 2.), ni viñetas (*, -), ni tablas de Markdown.
2. NO incluyas introducciones ("Aquí tienes tu lista:") ni notas de cierre.
3. La oración de ejemplo debe reflejar el estilo y contexto del libro.
4. Cada línea debe contener exactamente los 4 campos separados por " - ".

Ejemplo exacto del resultado:
Wand - Varita mágica - He raised his wand to cast a spell. - /wɒnd/
Peculiar - Peculiar / Extraño - The family had a rather peculiar secret. - /pɪˈkjuː.li.ər/`;
  } else if (category === 'movie') {
    generatedPrompt = `Actúa como un profesor experto de idiomas y aficionado al cine. Voy a ver la película "${movieTitle}" en su idioma original (${targetLang}).

Genera una lista de ${wordCount} palabras clave, expresiones coloquiales, jerga y modismos recurrentes en esta película (para nivel ${level}), para que pueda entender los diálogos con naturalidad y disfrutar la trama sin depender de subtítulos.

FORMATO OBLIGATORIO:
Responde ÚNICAMENTE con texto plano, exactamente una palabra por línea, usando guiones como separadores con esta estructura:

Palabra - Traducción en español - Oración de ejemplo (o línea inspirada en la película) - Fonética IPA

REGLAS ESTRICTAS:
1. NO uses números (1., 2.), ni viñetas (*, -), ni tablas de Markdown.
2. NO incluyas introducciones ni notas al final.
3. Cada línea debe contener exactamente los 4 campos separados por " - ".

Ejemplo exacto del resultado:
Wormhole - Agujero de gusano - They traveled through a wormhole near Saturn. - /ˈwɜːm.həʊl/
Relativity - Relatividad - Time moves slower on this planet due to relativity. - /ˌrel.əˈtɪv.ə.ti/`;
  } else if (category === 'series') {
    generatedPrompt = `Actúa como un profesor experto de idiomas. Voy a ver la serie de televisión "${seriesTitle}"${seriesContext.trim() ? ` (${seriesContext.trim()})` : ''} en su idioma original (${targetLang}).

Genera una lista de ${wordCount} expresiones cotidianas, modismos (slang), frases hechas, muletillas y vocabulario característico de los personajes de esta serie (para nivel ${level}), para que pueda seguir los episodios, captar el humor y entender las conversaciones espontáneas.

FORMATO OBLIGATORIO:
Responde ÚNICAMENTE con texto plano, exactamente una palabra por línea, usando guiones como separadores con esta estructura:

Palabra - Traducción en español - Oración de ejemplo (o diálogo típico de la serie) - Fonética IPA

REGLAS ESTRICTAS:
1. NO uses números (1., 2.), ni viñetas (*, -), ni tablas de Markdown.
2. NO incluyas introducciones ni notas al final.
3. Cada línea debe contener exactamente los 4 campos separados por " - ".

Ejemplo exacto del resultado:
How you doin' - ¿Cómo te va? / ¿Qué tal? - Joey smirked and said: How you doin'? - /haʊ jə ˈduːɪn/
Crush - Enamoramiento / Gustar alguien - Chandler had a huge crush on her. - /krʌʃ/`;
  } else {
    // General topic
    generatedPrompt = `Actúa como un profesor experto de idiomas. Genera una lista de ${wordCount} palabras y frases esenciales sobre el tema "${topic}" en ${targetLang} para nivel ${level}, diseñadas para estudiar con flashcards.

FORMATO OBLIGATORIO:
Responde ÚNICAMENTE con texto plano, exactamente una palabra por línea, usando guiones como separadores con esta estructura:

Palabra - Traducción en español - Oración de ejemplo en el idioma objetivo - Fonética IPA

REGLAS ESTRICTAS:
1. NO uses números (1., 2.), ni viñetas (*, -), ni tablas de Markdown.
2. NO incluyas introducciones ("Aquí tienes tu lista:") ni conclusiones o notas al final.
3. La oración de ejemplo debe usar la palabra en contexto natural.
4. Cada línea debe contener exactamente los 4 campos separados por " - ".

Ejemplo exacto del resultado:
Serendipity - Hallazgo afortunado - Finding my dream job was pure serendipity. - /ˌser.ənˈdɪp.ə.ti/
Resilient - Resiliente - Children are surprisingly resilient to changes. - /rɪˈzɪl.jənt/`;
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    });
  };

  const parsedPreview = aiResponseText.trim() ? parseImportContent(aiResponseText) : null;

  const defaultSuggestedTitle =
    category === 'book'
      ? `📖 Libro: ${bookTitle}`
      : category === 'movie'
      ? `🎬 Película: ${movieTitle}`
      : category === 'series'
      ? `📺 Serie: ${seriesTitle}`
      : `${targetLang}: ${topic}`;

  const handleImportAiResponse = () => {
    if (!parsedPreview || parsedPreview.cards.length === 0) return;

    onImportCards(
      parsedPreview.cards,
      selectedDeckOption,
      selectedDeckOption === 'NEW_DECK'
        ? {
            title: newDeckTitle.trim() || defaultSuggestedTitle,
            description:
              category === 'book'
                ? `Vocabulario clave para leer el libro "${bookTitle}" (${level})`
                : category === 'movie'
                ? `Vocabulario y expresiones de la película "${movieTitle}" (${level})`
                : category === 'series'
                ? `Slang y modismos de la serie "${seriesTitle}" (${level})`
                : `Generado con IA sobre ${topic} (${level})`,
            targetLang: LANGUAGES.find((l) => l.name === targetLang)?.code || 'en-US',
            color: category === 'book' ? 'emerald' : category === 'movie' ? 'rose' : category === 'series' ? 'violet' : 'indigo',
          }
        : undefined
    );

    setAiResponseText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                Generador de Vocabulario con IA
                <span className="text-[10px] font-semibold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  ChatGPT • Claude • Gemini
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepara el vocabulario para un <strong>libro, película, serie o tema</strong> antes de consumirlo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Step 1: Category Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Paso 1: ¿Qué vas a estudiar o disfrutar?
              </span>
            </div>

            {/* Category Tabs: Topic, Book, Movie, Series */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('topic')}
                className={`p-3 rounded-2xl border text-left flex flex-col items-center sm:items-start gap-1.5 transition-all cursor-pointer ${
                  category === 'topic'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${category === 'topic' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Por Tema</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('book')}
                className={`p-3 rounded-2xl border text-left flex flex-col items-center sm:items-start gap-1.5 transition-all cursor-pointer ${
                  category === 'book'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <BookOpen className={`w-5 h-5 ${category === 'book' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Leer un Libro</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('movie')}
                className={`p-3 rounded-2xl border text-left flex flex-col items-center sm:items-start gap-1.5 transition-all cursor-pointer ${
                  category === 'movie'
                    ? 'border-rose-600 bg-rose-50/80 text-rose-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Film className={`w-5 h-5 ${category === 'movie' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Ver Película</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('series')}
                className={`p-3 rounded-2xl border text-left flex flex-col items-center sm:items-start gap-1.5 transition-all cursor-pointer ${
                  category === 'series'
                    ? 'border-violet-600 bg-violet-50/80 text-violet-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Tv className={`w-5 h-5 ${category === 'series' ? 'text-violet-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Ver Serie TV</span>
              </button>
            </div>

            {/* Common settings: Language, Level, Word Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Idioma objetivo
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nivel del idioma
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cantidad de palabras
                </label>
                <select
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10 palabras</option>
                  <option value={15}>15 palabras</option>
                  <option value={20}>20 palabras</option>
                  <option value={30}>30 palabras</option>
                  <option value={50}>50 palabras</option>
                </select>
              </div>
            </div>

            {/* Dynamic Inputs according to Category */}
            {category === 'book' && (
              <div className="space-y-3 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Título del Libro *
                    </label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="ej. Harry Potter, 1984, The Little Prince..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Autor (Opcional)
                    </label>
                    <input
                      type="text"
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                      placeholder="ej. J.K. Rowling, George Orwell..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-emerald-800 font-semibold self-center mr-1">
                    Sugerencias:
                  </span>
                  {PRESET_BOOKS.map((b) => (
                    <button
                      key={b.title}
                      type="button"
                      onClick={() => {
                        setBookTitle(b.title);
                        setBookAuthor(b.author);
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      {b.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {category === 'movie' && (
              <div className="space-y-3 p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
                <div>
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                    Título de la Película *
                  </label>
                  <input
                    type="text"
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    placeholder="ej. Interstellar, Inception, The Dark Knight, Pulp Fiction..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-rose-800 font-semibold self-center mr-1">
                    Películas populares:
                  </span>
                  {PRESET_MOVIES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMovieTitle(m)}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white border border-rose-200 text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {category === 'series' && (
              <div className="space-y-3 p-4 bg-violet-50/60 rounded-2xl border border-violet-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-violet-900 mb-1">
                      Nombre de la Serie *
                    </label>
                    <input
                      type="text"
                      value={seriesTitle}
                      onChange={(e) => setSeriesTitle(e.target.value)}
                      placeholder="ej. Friends, Breaking Bad, The Office, Stranger Things..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-violet-900 mb-1">
                      Enfoque o Temporada (Opcional)
                    </label>
                    <input
                      type="text"
                      value={seriesContext}
                      onChange={(e) => setSeriesContext(e.target.value)}
                      placeholder="ej. Temporada 1, jerga juvenil, frases cómicas..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-violet-800 font-semibold self-center mr-1">
                    Series recomendadas:
                  </span>
                  {PRESET_SERIES.map((s) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => {
                        setSeriesTitle(s.title);
                        setSeriesContext(s.context);
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white border border-violet-200 text-violet-800 hover:bg-violet-100 transition-colors cursor-pointer"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {category === 'topic' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tema de las palabras (escribe el que quieras o elige uno rápido)
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="ej. Entrevistas de trabajo, vocabulario médico, cocina..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        topic === t
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: The Generated Prompt to Copy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Paso 2: Copia este prompt</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5"
                >
                  ChatGPT <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300">•</span>
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5"
                >
                  Claude <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="relative">
              <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-44 border border-slate-800">
                {generatedPrompt}
              </pre>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`mt-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copiedPrompt
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                }`}
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado! Ahora pégalo en ChatGPT, Claude o Gemini</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Prompt para la IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 3: Paste and Import Directly */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Paso 3: Pega aquí la respuesta de la IA (Importación Rápida)
            </span>

            <textarea
              rows={4}
              value={aiResponseText}
              onChange={(e) => setAiResponseText(e.target.value)}
              placeholder={`Pega aquí el texto que te dé la IA...
ejemplo:
Wand - Varita mágica - He raised his wand to cast a spell. - /wɒnd/
Peculiar - Peculiar / Extraño - The family had a rather peculiar secret. - /pɪˈkjuː.li.ər/`}
              className="w-full p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-800 resize-none"
            />

            {/* Target Deck & Import button */}
            {parsedPreview && parsedPreview.cards.length > 0 && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ¡{parsedPreview.cards.length} palabras detectadas con éxito!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedDeckOption}
                    onChange={(e) => setSelectedDeckOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800"
                  >
                    <option value="NEW_DECK">+ Crear como Nueva Colección</option>
                    {decks.map((d) => (
                      <option key={d.id} value={d.id}>
                        Añadir a: {d.title}
                      </option>
                    ))}
                  </select>

                  {selectedDeckOption === 'NEW_DECK' && (
                    <input
                      type="text"
                      value={newDeckTitle}
                      onChange={(e) => setNewDeckTitle(e.target.value)}
                      placeholder={`Nombre sugerido: ${defaultSuggestedTitle}`}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleImportAiResponse}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Importar estas {parsedPreview.cards.length} palabras ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
