import { describe, it, expect } from 'vitest';
import { calculateSRS, previewNextIntervals, isCardDue } from '../srs';
import type { Card } from '../../types';

describe('SRS SM-2 Algorithm', () => {
  it('correctly calculates initial review with Good (grade 3)', () => {
    const card = {
      srsRepetitions: 0,
      srsInterval: 0,
      srsEaseFactor: 2.5,
      state: 'NEW' as const,
    };
    const now = 1000000;
    const result = calculateSRS(card, 3, now);

    expect(result.srsRepetitions).toBe(1);
    expect(result.srsInterval).toBe(1);
    expect(result.srsEaseFactor).toBe(2.5);
    expect(result.state).toBe('LEARNING');
    expect(result.dueDate).toBe(now + 24 * 60 * 60 * 1000);
  });

  it('correctly advances interval on second Good review', () => {
    const card = {
      srsRepetitions: 1,
      srsInterval: 1,
      srsEaseFactor: 2.5,
      state: 'LEARNING' as const,
    };
    const result = calculateSRS(card, 3);

    expect(result.srsRepetitions).toBe(2);
    expect(result.srsInterval).toBe(3);
    expect(result.state).toBe('REVIEW');
  });

  it('multiplies interval by EaseFactor on subsequent Good reviews', () => {
    const card = {
      srsRepetitions: 2,
      srsInterval: 3,
      srsEaseFactor: 2.5,
      state: 'REVIEW' as const,
    };
    const result = calculateSRS(card, 3);

    expect(result.srsRepetitions).toBe(3);
    expect(result.srsInterval).toBe(Math.round(3 * 2.5)); // 8 days
    expect(result.state).toBe('REVIEW');
  });

  it('transitions to MASTERED when interval reaches 21+ days', () => {
    const card = {
      srsRepetitions: 3,
      srsInterval: 10,
      srsEaseFactor: 2.5,
      state: 'REVIEW' as const,
    };
    const result = calculateSRS(card, 3);

    expect(result.srsInterval).toBe(25);
    expect(result.state).toBe('MASTERED');
  });

  it('resets interval to 1 day on Again (grade 1)', () => {
    const card = {
      srsRepetitions: 5,
      srsInterval: 30,
      srsEaseFactor: 2.4,
      state: 'MASTERED' as const,
    };
    const result = calculateSRS(card, 1);

    expect(result.srsRepetitions).toBe(0);
    expect(result.srsInterval).toBe(1);
    expect(result.srsEaseFactor).toBe(2.2);
    expect(result.state).toBe('LEARNING');
  });

  it('never drops easeFactor below 1.3', () => {
    const card = {
      srsRepetitions: 0,
      srsInterval: 1,
      srsEaseFactor: 1.35,
      state: 'LEARNING' as const,
    };
    const result = calculateSRS(card, 1);
    expect(result.srsEaseFactor).toBe(1.3);
  });

  it('gives initial 3-day interval on Easy (grade 4)', () => {
    const card = {
      srsRepetitions: 0,
      srsInterval: 0,
      srsEaseFactor: 2.5,
      state: 'NEW' as const,
    };
    const result = calculateSRS(card, 4);

    expect(result.srsRepetitions).toBe(1);
    expect(result.srsInterval).toBe(3);
    expect(result.srsEaseFactor).toBe(2.65);
  });

  it('generates human-readable preview labels for all 4 grades', () => {
    const card = {
      srsRepetitions: 2,
      srsInterval: 3,
      srsEaseFactor: 2.5,
      state: 'REVIEW' as const,
    };
    const previews = previewNextIntervals(card);

    expect(previews[1]).toBe('1 día');
    expect(previews[2]).toBe('4 días');
    expect(previews[3]).toBe('8 días');
    expect(previews[4]).toBe('10 días');
  });

  it('identifies overdue cards correctly with isCardDue', () => {
    const now = 5000000;
    const newCard: Card = {
      id: '1',
      deckId: 'd1',
      word: 'Test',
      translation: 'Prueba',
      srsRepetitions: 0,
      srsInterval: 0,
      srsEaseFactor: 2.5,
      dueDate: now + 100000,
      state: 'NEW',
      createdAt: now,
      updatedAt: now,
    };
    expect(isCardDue(newCard, now)).toBe(true); // NEW is always due

    const overdueCard: Card = {
      ...newCard,
      state: 'REVIEW',
      dueDate: now - 500,
    };
    expect(isCardDue(overdueCard, now)).toBe(true);

    const futureCard: Card = {
      ...newCard,
      state: 'REVIEW',
      dueDate: now + 50000,
    };
    expect(isCardDue(futureCard, now)).toBe(false);
  });
});
