import { describe, expect, it } from 'vitest';

import {
  aiBusinessSeedingModelOutputOptions,
  aiBusinessSeedingModelOutputSchema,
  AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
  AI_BUSINESS_SEEDING_SCHEMA_VERSION,
  normalizeAiBusinessSeedingUsage,
  normalizeAiBusinessSeedingModelOutput,
} from './aiBusinessSeedingStructuredOutput.js';

describe('aiBusinessSeedingModelOutputOptions', () => {
  it('requests schema-constrained structured output from Genkit', () => {
    expect(aiBusinessSeedingModelOutputOptions).toMatchObject({
      schema: aiBusinessSeedingModelOutputSchema,
      constrained: AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
    });
  });
});

describe('normalizeAiBusinessSeedingModelOutput', () => {
  it('normalizes chat output into the assistant v2 contract', () => {
    const result = normalizeAiBusinessSeedingModelOutput({
      action: 'chat',
      data: { message: 'Necesito saber quien sera el owner.' },
    });

    expect(result).toMatchObject({
      action: 'chat',
      data: { message: 'Necesito saber quien sera el owner.' },
      schemaVersion: AI_BUSINESS_SEEDING_SCHEMA_VERSION,
      structuredOutput: true,
      constrainedOutput: AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
    });
    expect(JSON.parse(result.rawJson)).toEqual({
      action: 'chat',
      data: { message: 'Necesito saber quien sera el owner.' },
    });
  });

  it('normalizes create_business output when it has exactly one owner', () => {
    const result = normalizeAiBusinessSeedingModelOutput({
      action: 'create_business',
      data: {
        business: {
          name: 'Colmado La Fe',
          businessType: 'general',
        },
        users: [
          {
            realName: 'Maria Perez',
            name: 'maria.perez',
            role: 'owner',
          },
          {
            realName: 'Jose Perez',
            name: 'jose.perez',
            role: 'cashier',
          },
        ],
      },
    });

    expect(result).toMatchObject({
      action: 'create_business',
      data: {
        business: { name: 'Colmado La Fe' },
        users: [
          { name: 'maria.perez', role: 'owner' },
          { name: 'jose.perez', role: 'cashier' },
        ],
      },
      schemaVersion: AI_BUSINESS_SEEDING_SCHEMA_VERSION,
      structuredOutput: true,
      constrainedOutput: AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
    });
  });

  it('rejects create_business output without exactly one owner', () => {
    expect(() =>
      normalizeAiBusinessSeedingModelOutput({
        action: 'create_business',
        data: {
          business: { name: 'Colmado La Fe' },
          users: [
            { name: 'maria.perez', role: 'admin' },
            { name: 'jose.perez', role: 'cashier' },
          ],
        },
      }),
    ).toThrow(/exactamente 1 owner/);
  });

  it('rejects chat output without a useful message', () => {
    expect(() =>
      normalizeAiBusinessSeedingModelOutput({
        action: 'chat',
        data: { message: '   ' },
      }),
    ).toThrow(/data.message/);
  });

  it('rejects create_business output with invalid roles', () => {
    expect(() =>
      normalizeAiBusinessSeedingModelOutput({
        action: 'create_business',
        data: {
          business: { name: 'Colmado La Fe' },
          users: [{ name: 'maria.perez', role: 'superadmin' }],
        },
      }),
    ).toThrow();
  });

  it('rejects actions that are disabled for the current turn', () => {
    expect(() =>
      normalizeAiBusinessSeedingModelOutput(
        {
          action: 'create_business',
          data: {
            business: { name: 'Colmado La Fe' },
            users: [{ name: 'maria.perez', role: 'owner' }],
          },
        },
        ['chat'],
      ),
    ).toThrow(/no esta habilitada/);
  });

  it('allows chat fallback even when operational actions are disabled', () => {
    expect(
      normalizeAiBusinessSeedingModelOutput(
        {
          action: 'chat',
          data: { message: 'No hay acciones operativas habilitadas.' },
        },
        [],
      ),
    ).toMatchObject({
      action: 'chat',
      data: { message: 'No hay acciones operativas habilitadas.' },
    });
  });

  it('allows chat fallback when only create_business is explicitly enabled', () => {
    expect(
      normalizeAiBusinessSeedingModelOutput(
        {
          action: 'chat',
          data: { message: 'Necesito confirmar quien sera el owner.' },
        },
        ['create_business'],
      ),
    ).toMatchObject({
      action: 'chat',
      data: { message: 'Necesito confirmar quien sera el owner.' },
    });
  });

  it('rejects operational actions when the enabled action list is explicitly empty', () => {
    expect(() =>
      normalizeAiBusinessSeedingModelOutput(
        {
          action: 'create_business',
          data: {
            business: { name: 'Colmado La Fe' },
            users: [{ name: 'maria.perez', role: 'owner' }],
          },
        },
        [],
      ),
    ).toThrow(/no esta habilitada/);
  });
});

describe('normalizeAiBusinessSeedingUsage', () => {
  it('keeps finite non-negative usage metrics from Genkit', () => {
    expect(
      normalizeAiBusinessSeedingUsage({
        inputTokens: 125,
        outputTokens: 45,
        totalTokens: 170,
        thoughtsTokens: 10,
        outputCharacters: Number.NaN,
        cachedContentTokens: -1,
        customField: 999,
      }),
    ).toEqual({
      inputTokens: 125,
      outputTokens: 45,
      totalTokens: 170,
      thoughtsTokens: 10,
    });
  });

  it('omits usage metadata when no supported metrics are present', () => {
    expect(normalizeAiBusinessSeedingUsage(null)).toBeUndefined();
    expect(
      normalizeAiBusinessSeedingUsage({ customField: 999 }),
    ).toBeUndefined();
  });
});
