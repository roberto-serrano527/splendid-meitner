import Dexie, { type Table } from 'dexie';
import type { Card, Deck, SRSGrade, StudyLog } from '../types';
import { calculateSRS } from '../lib/srs';

export class LexiCardsDatabase extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  studyLogs!: Table<StudyLog, string>;

  constructor() {
    super('LexiCardsDB');
    this.version(1).stores({
      decks: 'id, title, targetLang, createdAt',
      cards: 'id, deckId, word, state, dueDate, createdAt',
      studyLogs: 'id, cardId, deckId, timestamp',
    });
  }
}

export const db = new LexiCardsDatabase();

/**
 * Seeds initial high-quality sample vocabulary deck if database is empty.
 */
export async function initSampleDataIfNeeded(): Promise<void> {
  const deckCount = await db.decks.count();
  if (deckCount > 0) return;

  const now = Date.now();
  const sampleDeckId = 'sample-deck-english-b2';

  const sampleDeck: Deck = {
    id: sampleDeckId,
    title: 'Inglés Avanzado B2/C1 - Vocabulario Clave',
    description: 'Palabras sofisticadas y de uso frecuente con fonética, ejemplos y notas.',
    targetLang: 'en-US',
    sourceLang: 'es-ES',
    color: 'indigo',
    createdAt: now,
    updatedAt: now,
  };

  const sampleWords: Array<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>> = [
    {
      word: 'Serendipity',
      phonetic: '/ˌser.ənˈdɪp.ə.ti/',
      partOfSpeech: 'noun',
      translation: 'Serendipia / Hallazgo afortunado',
      definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
      example: 'Finding my dream job was pure serendipity.',
      exampleTranslation: 'Encontrar el trabajo de mis sueños fue pura serendipia.',
      notes: 'Palabra famosa por describir casualidades maravillosas.',
      tags: ['C1', 'avanzado'],
      srsRepetitions: 0,
      srsInterval: 0,
      srsEaseFactor: 2.5,
      dueDate: now,
      state: 'NEW',
    },
    {
      word: 'Resilient',
      phonetic: '/rɪˈzɪl.jənt/',
      partOfSpeech: 'adjective',
      translation: 'Resiliente / Capaz de recuperarse',
      definition: 'Able to withstand or recover quickly from difficult conditions.',
      example: 'Babies are surprisingly resilient to minor falls.',
      exampleTranslation: 'Los bebés son sorprendentemente resistentes a caídas menores.',
      notes: 'Muy usado en negocios y psicología.',
      tags: ['B2', 'adjetivo'],
      srsRepetitions: 1,
      srsInterval: 1,
      srsEaseFactor: 2.5,
      dueDate: now - 3600000, // Due today
      state: 'LEARNING',
    },
    {
      word: 'Reluctant',
      phonetic: '/rɪˈlʌk.tənt/',
      partOfSpeech: 'adjective',
      translation: 'Renuente / Reacio',
      definition: 'Unwilling and hesitant; disinclined.',
      example: 'He was reluctant to admit he made a mistake.',
      exampleTranslation: 'Estaba reacio a admitir que había cometido un error.',
      notes: 'Sinónimo de "hesitant". Se usa con preposición "to".',
      tags: ['B2'],
      srsRepetitions: 2,
      srsInterval: 3,
      srsEaseFactor: 2.4,
      dueDate: now - 1800000, // Due today
      state: 'REVIEW',
    },
    {
      word: 'Elucidate',
      phonetic: '/iˈluː.sɪ.deɪt/',
      partOfSpeech: 'verb',
      translation: 'Elucidar / Aclarar',
      definition: 'Make (something) clear; explain.',
      example: 'The professor used diagrams to elucidate the complex concept.',
      exampleTranslation: 'El profesor usó diagramas para aclarar el concepto complejo.',
      notes: 'Registro formal o académico.',
      tags: ['C1', 'académico'],
      srsRepetitions: 0,
      srsInterval: 0,
      srsEaseFactor: 2.5,
      dueDate: now,
      state: 'NEW',
    },
    {
      word: 'Pragmatic',
      phonetic: '/præɡˈmæt.ɪk/',
      partOfSpeech: 'adjective',
      translation: 'Pragmático / Práctico',
      definition: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
      example: 'We need a pragmatic approach to solve this urgent bug.',
      exampleTranslation: 'Necesitamos un enfoque pragmático para resolver este error urgente.',
      tags: ['B2', 'profesional'],
      srsRepetitions: 3,
      srsInterval: 7,
      srsEaseFactor: 2.6,
      dueDate: now + 86400000 * 4, // in 4 days
      state: 'REVIEW',
    },
    {
      word: 'Ubiquitous',
      phonetic: '/juːˈbɪk.wɪ.təs/',
      partOfSpeech: 'adjective',
      translation: 'Ubícuo / Omnipresente',
      definition: 'Present, appearing, or found everywhere.',
      example: 'Smartphones have become ubiquitous in modern society.',
      exampleTranslation: 'Los teléfonos inteligentes se han vuelto omnipresentes en la sociedad moderna.',
      notes: 'Raíz del latín "ubique" (en todas partes).',
      tags: ['C1'],
      srsRepetitions: 0,
      srsInterval: 0,
      srsEaseFactor: 2.5,
      dueDate: now,
      state: 'NEW',
    },
    {
      word: 'Meticulous',
      phonetic: '/məˈtɪk.jə.ləs/',
      partOfSpeech: 'adjective',
      translation: 'Meticuloso / Minucioso',
      definition: 'Showing great attention to detail; very careful and precise.',
      example: 'She did a meticulous check of all financial records.',
      exampleTranslation: 'Ella hizo una revisión minuciosa de todos los registros financieros.',
      tags: ['B2'],
      srsRepetitions: 4,
      srsInterval: 22,
      srsEaseFactor: 2.7,
      dueDate: now + 86400000 * 15,
      state: 'MASTERED',
    },
    {
      word: 'Ephemeral',
      phonetic: '/ɪˈfem.ər.əl/',
      partOfSpeech: 'adjective',
      translation: 'Efímero / Pasajero',
      definition: 'Lasting for a very short time.',
      example: 'Fame in the social media era is often ephemeral.',
      exampleTranslation: 'La fama en la era de las redes sociales suele ser efímera.',
      tags: ['C1', 'literario'],
      srsRepetitions: 0,
      srsInterval: 0,
      srsEaseFactor: 2.5,
      dueDate: now,
      state: 'NEW',
    },
  ];

  await db.transaction('rw', db.decks, db.cards, async () => {
    await db.decks.add(sampleDeck);
    for (let i = 0; i < sampleWords.length; i++) {
      const w = sampleWords[i];
      await db.cards.add({
        ...w,
        id: `sample-card-${i + 1}`,
        deckId: sampleDeckId,
        createdAt: now - i * 1000,
        updatedAt: now - i * 1000,
      });
    }
  });
}

/**
 * Record user review for a card, recalculate SM-2 interval, and log history.
 */
export async function reviewCard(cardId: string, grade: SRSGrade): Promise<Card | null> {
  const card = await db.cards.get(cardId);
  if (!card) return null;

  const now = Date.now();
  const prevInterval = card.srsInterval;
  const srs = calculateSRS(card, grade, now);

  const updatedCard: Card = {
    ...card,
    srsRepetitions: srs.srsRepetitions,
    srsInterval: srs.srsInterval,
    srsEaseFactor: srs.srsEaseFactor,
    dueDate: srs.dueDate,
    state: srs.state,
    updatedAt: now,
  };

  const studyLog: StudyLog = {
    id: `log-${now}-${Math.random().toString(36).substring(2, 7)}`,
    cardId: card.id,
    deckId: card.deckId,
    grade,
    timestamp: now,
    previousInterval: prevInterval,
    newInterval: srs.srsInterval,
  };

  await db.transaction('rw', db.cards, db.studyLogs, async () => {
    await db.cards.put(updatedCard);
    await db.studyLogs.add(studyLog);
  });

  return updatedCard;
}

/**
 * Deletes a deck and all cards and logs associated with it.
 */
export async function deleteDeckCascade(deckId: string): Promise<void> {
  await db.transaction('rw', db.decks, db.cards, db.studyLogs, async () => {
    await db.decks.delete(deckId);
    await db.cards.where('deckId').equals(deckId).delete();
    await db.studyLogs.where('deckId').equals(deckId).delete();
  });
}
