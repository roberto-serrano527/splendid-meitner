import type { Card, Deck, ExportData } from '../types';

/**
 * Generates an ExportData object for a deck and its cards.
 */
export function createDeckExportPayload(deck: Deck, cards: Card[]): ExportData {
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    deck: {
      title: deck.title,
      description: deck.description,
      targetLang: deck.targetLang,
      sourceLang: deck.sourceLang,
      color: deck.color,
    },
    cards: cards.map((c) => ({
      word: c.word,
      phonetic: c.phonetic,
      partOfSpeech: c.partOfSpeech,
      translation: c.translation,
      definition: c.definition,
      example: c.example,
      exampleTranslation: c.exampleTranslation,
      notes: c.notes,
      tags: c.tags,
      srsRepetitions: c.srsRepetitions,
      srsInterval: c.srsInterval,
      srsEaseFactor: c.srsEaseFactor,
      dueDate: c.dueDate,
      state: c.state,
    })),
  };
}

/**
 * Downloads a file to the user's device.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Exports deck to formatted JSON.
 */
export function exportToJsonFile(deck: Deck, cards: Card[]) {
  const payload = createDeckExportPayload(deck, cards);
  const jsonStr = JSON.stringify(payload, null, 2);
  const safeTitle = deck.title.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  triggerFileDownload(jsonStr, `${safeTitle}_vocab.json`, 'application/json');
}

/**
 * Exports deck to CSV format.
 */
export function exportToCsvFile(deck: Deck, cards: Card[]) {
  const headers = ['Palabra', 'Traducción', 'Definición', 'Ejemplo', 'Traducción Ejemplo', 'Fonética (IPA)', 'Categoría Gramatical', 'Notas'];
  
  const rows = cards.map((c) => [
    escapeCsv(c.word),
    escapeCsv(c.translation),
    escapeCsv(c.definition || ''),
    escapeCsv(c.example || ''),
    escapeCsv(c.exampleTranslation || ''),
    escapeCsv(c.phonetic || ''),
    escapeCsv(c.partOfSpeech || ''),
    escapeCsv(c.notes || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const safeTitle = deck.title.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  // Include UTF-8 BOM so Excel opens accents and special characters properly
  const bomCsv = '\uFEFF' + csvContent;
  triggerFileDownload(bomCsv, `${safeTitle}_vocab.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports deck to Plain Text format (delimitado con ' - ').
 */
export function exportToPlainTextFile(deck: Deck, cards: Card[]) {
  const lines = cards.map((c) => {
    let line = `${c.word} - ${c.translation}`;
    if (c.example) {
      line += ` - ${c.example}`;
    }
    return line;
  });

  const txtContent = lines.join('\r\n');
  const safeTitle = deck.title.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  triggerFileDownload(txtContent, `${safeTitle}_vocab.txt`, 'text/plain;charset=utf-8;');
}

function escapeCsv(value: string): string {
  if (!value) return '""';
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

/**
 * Encodes a deck export payload to a URL-safe Base64 string for instant link sharing.
 */
export function generateShareableUrl(deck: Deck, cards: Card[]): string {
  const payload = createDeckExportPayload(deck, cards);
  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return `${origin}${pathname}#import=${base64}`;
}
