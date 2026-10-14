import type { Card, CardState, SRSGrade } from '../types';

export interface SRSCalculationResult {
  srsRepetitions: number;
  srsInterval: number;
  srsEaseFactor: number;
  dueDate: number;
  state: CardState;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates new SRS parameters based on the SuperMemo-2 (SM-2) algorithm.
 *
 * @param card The current card to evaluate
 * @param grade User rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
 * @param now Current timestamp (default: Date.now())
 */
export function calculateSRS(
  card: Pick<Card, 'srsRepetitions' | 'srsInterval' | 'srsEaseFactor' | 'state'>,
  grade: SRSGrade,
  now: number = Date.now()
): SRSCalculationResult {
  let repetitions = card.srsRepetitions || 0;
  let interval = card.srsInterval || 0;
  let easeFactor = card.srsEaseFactor || 2.5;

  if (grade === 1) {
    // Again / Lapse
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (grade === 2) {
    // Hard
    repetitions = Math.max(1, repetitions);
    interval = interval <= 1 ? 1 : Math.round(interval * 1.2);
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (grade === 3) {
    // Good
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else if (grade === 4) {
    // Easy
    if (repetitions === 0) {
      interval = 3;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    repetitions += 1;
    easeFactor += 0.15;
  }

  // Ensure minimum interval is 1 day
  interval = Math.max(1, interval);

  // Determine state based on interval and repetitions
  let state: CardState = 'LEARNING';
  if (interval >= 21) {
    state = 'MASTERED';
  } else if (repetitions >= 2) {
    state = 'REVIEW';
  } else {
    state = 'LEARNING';
  }

  // Calculate next due date
  const dueDate = now + interval * ONE_DAY_MS;

  return {
    srsRepetitions: repetitions,
    srsInterval: interval,
    srsEaseFactor: Number(easeFactor.toFixed(2)),
    dueDate,
    state,
  };
}

/**
 * Returns human-readable next interval previews for each rating button.
 * e.g., { 1: "1 día", 2: "2 días", 3: "5 días", 4: "10 días" }
 */
export function previewNextIntervals(
  card: Pick<Card, 'srsRepetitions' | 'srsInterval' | 'srsEaseFactor' | 'state'>
): Record<SRSGrade, string> {
  const grades: SRSGrade[] = [1, 2, 3, 4];
  const previews: Record<SRSGrade, string> = {
    1: '',
    2: '',
    3: '',
    4: '',
  };

  grades.forEach((g) => {
    const res = calculateSRS(card, g);
    if (res.srsInterval === 1) {
      previews[g] = '1 día';
    } else if (res.srsInterval < 30) {
      previews[g] = `${res.srsInterval} días`;
    } else if (res.srsInterval < 365) {
      const months = Math.round(res.srsInterval / 30);
      previews[g] = months === 1 ? '1 mes' : `${months} meses`;
    } else {
      const years = (res.srsInterval / 365).toFixed(1);
      previews[g] = `${years} años`;
    }
  });

  return previews;
}

/**
 * Checks if a card is due for review today.
 */
export function isCardDue(card: Card, now: number = Date.now()): boolean {
  if (card.state === 'NEW') return true;
  return card.dueDate <= now;
}
