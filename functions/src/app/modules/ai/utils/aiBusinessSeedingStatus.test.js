import { describe, expect, it } from 'vitest';

import {
  AI_BUSINESS_SEEDING_ACTIONS,
  AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
  AI_BUSINESS_SEEDING_SCHEMA_VERSION,
} from './aiBusinessSeedingStructuredOutput.js';
import { buildAiBusinessSeedingStatus } from './aiBusinessSeedingStatus.js';

describe('buildAiBusinessSeedingStatus', () => {
  it('builds a safe diagnostics payload without calling the model', () => {
    expect(
      buildAiBusinessSeedingStatus({
        appCheckMode: 'developer-access-only',
        appCheckTokenPresent: true,
        authPresent: true,
        generatedAt: '2026-05-29T00:00:00.000Z',
        location: 'us-central1',
        model: 'gemini-2.5-flash',
        thinkingLevel: 'MEDIUM',
      }),
    ).toEqual({
      ok: true,
      operation: 'status',
      metadata: {
        availableActions: AI_BUSINESS_SEEDING_ACTIONS,
        appCheckMode: 'developer-access-only',
        appCheckTokenPresent: true,
        authPresent: true,
        generatedAt: '2026-05-29T00:00:00.000Z',
        location: 'us-central1',
        model: 'gemini-2.5-flash',
        modelConfigSource: 'functions-env',
        schemaVersion: AI_BUSINESS_SEEDING_SCHEMA_VERSION,
        structuredOutput: true,
        constrainedOutput: AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
        thinkingLevel: 'MEDIUM',
        thoughtSummariesEnabled: false,
      },
    });
  });

  it('defaults request signal booleans to false and returns a defensive actions copy', () => {
    const status = buildAiBusinessSeedingStatus({
      appCheckMode: 'enforced-limited-use',
      generatedAt: '2026-05-29T00:00:00.000Z',
      location: 'global',
      model: 'gemini-2.5-flash',
    });

    expect(status.metadata.appCheckTokenPresent).toBe(false);
    expect(status.metadata.authPresent).toBe(false);
    expect(status.metadata.thoughtSummariesEnabled).toBe(false);
    expect(status.metadata.availableActions).toEqual(
      AI_BUSINESS_SEEDING_ACTIONS,
    );
    expect(status.metadata.availableActions).not.toBe(
      AI_BUSINESS_SEEDING_ACTIONS,
    );
  });
});
