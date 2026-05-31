import { describe, expect, it } from 'vitest';

import {
  formatDuration,
  formatRequestMetrics,
  formatRuntime,
  formatStatusDetails,
  formatUsage,
} from './runtimeMetadata';

describe('runtimeMetadata', () => {
  it('formats durations for assistant logs', () => {
    expect(formatDuration()).toBe('');
    expect(formatDuration(Number.NaN)).toBe('');
    expect(formatDuration(850)).toBe('850 ms');
    expect(formatDuration(1450)).toBe('1.4 s');
  });

  it('formats runtime metadata for analyze logs', () => {
    expect(
      formatRuntime({
        durationMs: 1200,
        location: 'us-central1',
        model: 'gemini-2.5-flash',
        thinkingLevel: 'MEDIUM',
        usage: {
          inputTokens: 120,
          outputTokens: 40,
          totalTokens: 160,
        },
        requestMetrics: {
          promptCharacters: 80,
          contextCharacters: 450,
        },
      }),
    ).toBe(
      'gemini-2.5-flash @ us-central1 | thinking: medium | 1.2 s | tokens: 160 (120 in / 40 out) | prompt: 80 chars / ctx: 450 chars',
    );
  });

  it('formats usage metadata with token or character fallbacks', () => {
    expect(formatUsage()).toBe('');
    expect(formatUsage({ totalTokens: 75 })).toBe('tokens: 75');
    expect(formatUsage({ inputCharacters: 400, outputCharacters: 120 })).toBe(
      '400 chars in / 120 chars out',
    );
  });

  it('formats request metrics and flags truncated context', () => {
    expect(formatRequestMetrics()).toBe('');
    expect(
      formatRequestMetrics({
        promptCharacters: 80,
        contextCharacters: 0,
      }),
    ).toBe('prompt: 80 chars');
    expect(
      formatRequestMetrics({
        promptCharacters: 80,
        contextCharacters: 8100,
        contextTruncated: true,
      }),
    ).toBe('prompt: 80 chars / ctx: 8100 chars / ctx truncado');
  });

  it('formats status metadata with request signals', () => {
    expect(
      formatStatusDetails({
        appCheckMode: 'enforced-limited-use',
        appCheckTokenPresent: false,
        authPresent: true,
        availableActions: ['chat', 'create_business'],
        constrainedOutput: true,
        location: 'us-central1',
        model: 'gemini-2.5-flash',
        schemaVersion: 'ai-business-seeding-v2',
        thinkingLevel: 'MEDIUM',
      }),
    ).toBe(
      'gemini-2.5-flash @ us-central1 | thinking: medium | ai-business-seeding-v2 | output: schema-constrained | enforced-limited-use | app check: ausente | auth: presente | acciones: chat, create_business',
    );
  });
});
