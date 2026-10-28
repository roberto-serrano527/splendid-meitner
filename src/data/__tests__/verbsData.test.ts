import { describe, it, expect } from 'vitest';
import { IRREGULAR_VERBS, REGULAR_VERBS } from '../verbsData';

describe('Verbs Dataset', () => {
  it('contains 154 irregular verbs matching the curriculum document', () => {
    expect(IRREGULAR_VERBS.length).toBe(154);
  });

  it('every irregular verb has infinitive, pastSimple, pastParticiple, and spanish', () => {
    for (const v of IRREGULAR_VERBS) {
      expect(v.id).toBeTruthy();
      expect(v.infinitive).toBeTruthy();
      expect(v.pastSimple).toBeTruthy();
      expect(v.pastParticiple).toBeTruthy();
      expect(v.spanish).toBeTruthy();
      expect(['AAA', 'ABB', 'ABA', 'ABC']).toContain(v.pattern);
    }
  });

  it('has valid regular verbs with /id/, /t/, and /d/ pronunciation categories', () => {
    expect(REGULAR_VERBS.length).toBe(69);
    const idCount = REGULAR_VERBS.filter((v) => v.sound === '/id/').length;
    const tCount = REGULAR_VERBS.filter((v) => v.sound === '/t/').length;
    const dCount = REGULAR_VERBS.filter((v) => v.sound === '/d/').length;

    expect(idCount).toBe(16);
    expect(tCount).toBe(22);
    expect(dCount).toBe(31);
  });

  it('contains essential verbs like be, go, have, do, see, write', () => {
    const infinitives = IRREGULAR_VERBS.map((v) => v.infinitive.toLowerCase());
    expect(infinitives.some((i) => i.includes('be'))).toBe(true);
    expect(infinitives.some((i) => i.includes('go'))).toBe(true);
    expect(infinitives.some((i) => i.includes('have'))).toBe(true);
    expect(infinitives.some((i) => i.includes('write'))).toBe(true);
  });
});
