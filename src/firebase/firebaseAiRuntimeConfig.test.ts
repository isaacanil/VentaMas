import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FIREBASE_AI_LOCATION,
  DEFAULT_FIREBASE_AI_MODEL,
  cleanAiConfigString,
  readPositiveInteger,
  resolveFirebaseAiRuntimeConfigValues,
} from './firebaseAiRuntimeConfig';

describe('firebaseAiRuntimeConfig', () => {
  it('prefers Remote Config values over env values', () => {
    expect(
      resolveFirebaseAiRuntimeConfigValues({
        envLocation: 'us-central1',
        envModel: 'gemini-2.5-flash',
        remoteLocation: 'global',
        remoteModel: 'gemini-2.5-flash-lite',
      }),
    ).toEqual({
      location: 'global',
      model: 'gemini-2.5-flash-lite',
    });
  });

  it('falls back to env values when Remote Config is empty', () => {
    expect(
      resolveFirebaseAiRuntimeConfigValues({
        envLocation: 'us-central1',
        envModel: 'gemini-2.5-pro',
        remoteLocation: ' ',
        remoteModel: '',
      }),
    ).toEqual({
      location: 'us-central1',
      model: 'gemini-2.5-pro',
    });
  });

  it('uses safe defaults when neither env nor Remote Config has values', () => {
    expect(resolveFirebaseAiRuntimeConfigValues({})).toEqual({
      location: DEFAULT_FIREBASE_AI_LOCATION,
      model: DEFAULT_FIREBASE_AI_MODEL,
    });
  });

  it('normalizes strings and positive integer env values', () => {
    expect(cleanAiConfigString('  global  ')).toBe('global');
    expect(cleanAiConfigString('   ')).toBeNull();
    expect(readPositiveInteger('60000', 10)).toBe(60000);
    expect(readPositiveInteger('-1', 10)).toBe(10);
    expect(readPositiveInteger('nope', 10)).toBe(10);
  });
});
