import { describe, it, expect } from 'vitest';
import { parseImportContent } from '../importer';

describe('Multi-Format Importer', () => {
  it('parses Plain Text with dash delimiters (-)', () => {
    const raw = `
      Apple - Manzana - I eat a fresh apple
      Dog - Perro
      House - Casa - A big house in Spain
    `;
    const res = parseImportContent(raw);

    expect(res.cards).toHaveLength(3);
    expect(res.cards[0].word).toBe('Apple');
    expect(res.cards[0].translation).toBe('Manzana');
    expect(res.cards[0].example).toBe('I eat a fresh apple');
    expect(res.cards[1].word).toBe('Dog');
    expect(res.cards[1].translation).toBe('Perro');
  });

  it('parses Plain Text with pipe delimiters (|)', () => {
    const raw = `
      Serendipity | Serendipia | Finding good things by chance
      Resilient | Resiliente | Children are resilient
    `;
    const res = parseImportContent(raw);

    expect(res.cards).toHaveLength(2);
    expect(res.cards[0].word).toBe('Serendipity');
    expect(res.cards[0].translation).toBe('Serendipia');
  });

  it('parses tab-delimited text from spreadsheets / Quizlet', () => {
    const raw = "Book\tLibro\tA good book\nPen\tPluma\tBlue pen";
    const res = parseImportContent(raw);

    expect(res.cards).toHaveLength(2);
    expect(res.cards[0].word).toBe('Book');
    expect(res.cards[0].translation).toBe('Libro');
    expect(res.cards[1].word).toBe('Pen');
  });

  it('parses CSV format with headers and quotes', () => {
    const csv = `word,translation,definition,example
"Ephemeral","Efímero","Lasting a very short time","Fame is ephemeral"
"Ubiquitous","Ubícuo","Found everywhere","Phones are ubiquitous"`;
    const res = parseImportContent(csv);

    expect(res.cards).toHaveLength(2);
    expect(res.cards[0].word).toBe('Ephemeral');
    expect(res.cards[0].translation).toBe('Efímero');
    expect(res.cards[1].word).toBe('Ubiquitous');
  });

  it('parses full JSON export schema', () => {
    const json = JSON.stringify({
      version: 1,
      deck: {
        title: 'Francés B1',
        description: 'Vocabulario esencial',
        targetLang: 'fr-FR',
        color: 'emerald',
      },
      cards: [
        {
          word: 'Bonjour',
          translation: 'Hola / Buenos días',
          partOfSpeech: 'phrase',
          phonetic: '/bɔ̃.ʒuʁ/',
        },
        {
          word: 'Merci',
          translation: 'Gracias',
          partOfSpeech: 'phrase',
        },
      ],
    });
    const res = parseImportContent(json);

    expect(res.deckMetadata?.title).toBe('Francés B1');
    expect(res.deckMetadata?.targetLang).toBe('fr-FR');
    expect(res.cards).toHaveLength(2);
    expect(res.cards[0].word).toBe('Bonjour');
    expect(res.cards[0].phonetic).toBe('/bɔ̃.ʒuʁ/');
  });

  it('handles empty content gracefully', () => {
    const res = parseImportContent('   ');
    expect(res.cards).toHaveLength(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
