import type { Card, Deck, ExportData, PartOfSpeech } from '../types';

export interface ParsedImportResult {
  deckMetadata?: Partial<Deck>;
  cards: Array<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>>;
  errors: string[];
}

/**
 * Parses raw text or file content into card definitions.
 * Automatically detects whether the input is JSON, CSV, or Delimited Plain Text.
 */
export function parseImportContent(content: string): ParsedImportResult {
  const trimmed = content.trim();

  if (!trimmed) {
    return { cards: [], errors: ['El contenido está vacío.'] };
  }

  // 1. Try parsing as JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parseJsonData(parsed);
    } catch {
      // If JSON parse fails, fall through to CSV / Plain text
    }
  }

  // 2. Try parsing as CSV / Plain Text lines
  return parseTextOrCsvLines(trimmed);
}

function parseJsonData(data: unknown): ParsedImportResult {
  const errors: string[] = [];
  const cards: Array<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>> = [];
  let deckMetadata: Partial<Deck> | undefined;

  if (data && typeof data === 'object') {
    // Check if it's full ExportData schema
    const exportObj = data as Partial<ExportData>;
    if (exportObj.deck) {
      deckMetadata = {
        title: exportObj.deck.title,
        description: exportObj.deck.description,
        targetLang: exportObj.deck.targetLang,
        sourceLang: exportObj.deck.sourceLang,
        color: exportObj.deck.color,
      };
    }

    const rawCards = Array.isArray(exportObj.cards)
      ? exportObj.cards
      : Array.isArray(data)
      ? (data as unknown[])
      : [];

    for (let i = 0; i < rawCards.length; i++) {
      const item = rawCards[i] as Record<string, unknown>;
      if (!item || typeof item !== 'object') continue;

      const word = String(item.word || item.palabra || item.term || '').trim();
      const translation = String(
        item.translation || item.traduccion || item.meaning || item.definition || ''
      ).trim();

      if (!word) {
        errors.push(`Fila JSON #${i + 1}: No contiene la palabra principal.`);
        continue;
      }

      cards.push({
        word,
        translation: translation || word,
        definition: item.definition ? String(item.definition) : undefined,
        phonetic: item.phonetic ? String(item.phonetic) : undefined,
        partOfSpeech: item.partOfSpeech as PartOfSpeech | undefined,
        example: item.example ? String(item.example) : undefined,
        exampleTranslation: item.exampleTranslation ? String(item.exampleTranslation) : undefined,
        notes: item.notes ? String(item.notes) : undefined,
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        srsRepetitions: typeof item.srsRepetitions === 'number' ? item.srsRepetitions : 0,
        srsInterval: typeof item.srsInterval === 'number' ? item.srsInterval : 0,
        srsEaseFactor: typeof item.srsEaseFactor === 'number' ? item.srsEaseFactor : 2.5,
        dueDate: typeof item.dueDate === 'number' ? item.dueDate : Date.now(),
        state: item.state === 'MASTERED' || item.state === 'REVIEW' || item.state === 'LEARNING' ? item.state : 'NEW',
      });
    }
  }

  return { deckMetadata, cards, errors };
}

function parseTextOrCsvLines(text: string): ParsedImportResult {
  const errors: string[] = [];
  const cards: Array<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>> = [];

  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    return { cards: [], errors: ['No se encontraron líneas de texto para importar.'] };
  }

  // Detect header if first line looks like columns
  let startIndex = 0;
  const firstLineLower = rawLines[0].toLowerCase();
  if (
    firstLineLower.includes('word') ||
    firstLineLower.includes('palabra') ||
    firstLineLower.includes('termino')
  ) {
    startIndex = 1; // skip header line
  }

  for (let i = startIndex; i < rawLines.length; i++) {
    const line = rawLines[i];
    const columns = splitLineIntoColumns(line);

    if (columns.length === 0 || !columns[0]) {
      continue;
    }

    const word = columns[0].trim();
    const translation = (columns[1] || '').trim();
    const exampleOrDef = (columns[2] || '').trim();
    const extra = (columns[3] || '').trim();

    if (!word) continue;

    cards.push({
      word,
      translation: translation || word,
      definition: columns.length >= 4 ? exampleOrDef : undefined,
      example: columns.length >= 4 ? extra : (exampleOrDef || undefined),
      tags: [],
      srsRepetitions: 0,
      srsInterval: 0,
      srsEaseFactor: 2.5,
      dueDate: Date.now(),
      state: 'NEW',
    });
  }

  return { cards, errors };
}

/**
 * Splits a line by tab, pipe, dash, colon, or comma.
 */
function splitLineIntoColumns(line: string): string[] {
  // 1. Tab separated (Excel copy-paste)
  if (line.includes('\t')) {
    return line.split('\t').map(cleanCell);
  }

  // 2. Pipe separated (|)
  if (line.includes('|')) {
    return line.split('|').map(cleanCell);
  }

  // 3. Semicolon separated (CSV europeo / Excel)
  if (line.includes(';')) {
    return parseCsvLine(line, ';');
  }

  // 4. Dash separated (e.g. "word - translation" or "word — translation")
  if (line.includes(' - ') || line.includes(' — ')) {
    const separator = line.includes(' — ') ? ' — ' : ' - ';
    return line.split(separator).map(cleanCell);
  }

  // 5. Colon separated (e.g. "word : translation")
  if (line.includes(' : ')) {
    return line.split(' : ').map(cleanCell);
  }

  // 6. Comma separated CSV
  if (line.includes(',')) {
    return parseCsvLine(line, ',');
  }

  // Single word
  return [cleanCell(line)];
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(cleanCell(current));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(cleanCell(current));
  return result;
}

function cleanCell(cell: string): string {
  let trimmed = cell.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.substring(1, trimmed.length - 1).trim();
  }
  return trimmed;
}
