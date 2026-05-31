import { describe, expect, it } from 'vitest';

import {
  AI_BUSINESS_SEEDING_OPERATIONS,
  isAiBusinessSeedingStatusOperation,
  readAiBusinessSeedingOperation,
  resolveAiBusinessSeedingOperationTarget,
} from './aiBusinessSeedingOperations.js';

describe('aiBusinessSeedingOperations', () => {
  it('defaults to analyze when operation is not provided', () => {
    expect(readAiBusinessSeedingOperation({})).toBe(
      AI_BUSINESS_SEEDING_OPERATIONS.ANALYZE,
    );
  });

  it('accepts operation aliases and normalizes casing', () => {
    expect(readAiBusinessSeedingOperation({ operation: ' STATUS ' })).toBe(
      AI_BUSINESS_SEEDING_OPERATIONS.STATUS,
    );
    expect(readAiBusinessSeedingOperation({ op: 'Diagnostics' })).toBe(
      AI_BUSINESS_SEEDING_OPERATIONS.DIAGNOSTICS,
    );
  });

  it('prefers operation over the legacy op alias', () => {
    expect(
      readAiBusinessSeedingOperation({
        op: AI_BUSINESS_SEEDING_OPERATIONS.EXECUTE,
        operation: AI_BUSINESS_SEEDING_OPERATIONS.STATUS,
      }),
    ).toBe(AI_BUSINESS_SEEDING_OPERATIONS.STATUS);
  });

  it('identifies status-like operations', () => {
    expect(isAiBusinessSeedingStatusOperation('status')).toBe(true);
    expect(isAiBusinessSeedingStatusOperation('diagnostics')).toBe(true);
    expect(isAiBusinessSeedingStatusOperation('analyze')).toBe(false);
    expect(isAiBusinessSeedingStatusOperation('execute')).toBe(false);
  });

  it('resolves dispatcher targets', () => {
    expect(resolveAiBusinessSeedingOperationTarget('diagnostics')).toBe(
      AI_BUSINESS_SEEDING_OPERATIONS.STATUS,
    );
    expect(resolveAiBusinessSeedingOperationTarget('status')).toBe(
      AI_BUSINESS_SEEDING_OPERATIONS.STATUS,
    );
    expect(resolveAiBusinessSeedingOperationTarget('analyze')).toBe(
      AI_BUSINESS_SEEDING_OPERATIONS.ANALYZE,
    );
    expect(resolveAiBusinessSeedingOperationTarget('execute')).toBe(
      AI_BUSINESS_SEEDING_OPERATIONS.EXECUTE,
    );
    expect(resolveAiBusinessSeedingOperationTarget('unknown')).toBeNull();
  });
});
