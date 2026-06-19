import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnforceAppCheckEnv = process.env.RNC_LOOKUP_ENFORCE_APP_CHECK;
const originalConsumeAppCheckEnv =
  process.env.RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN;
const originalConcurrencyEnv = process.env.RNC_LOOKUP_CONCURRENCY;
const originalMaxInstancesEnv = process.env.RNC_LOOKUP_MAX_INSTANCES;
const originalTimeoutSecondsEnv = process.env.RNC_LOOKUP_TIMEOUT_SECONDS;

const loadConfigWithEnv = async ({
  concurrency,
  consumeAppCheckToken,
  enforceAppCheck,
  maxInstances,
  timeoutSeconds,
} = {}) => {
  vi.resetModules();

  if (enforceAppCheck === undefined) {
    delete process.env.RNC_LOOKUP_ENFORCE_APP_CHECK;
  } else {
    process.env.RNC_LOOKUP_ENFORCE_APP_CHECK = enforceAppCheck;
  }

  if (consumeAppCheckToken === undefined) {
    delete process.env.RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN;
  } else {
    process.env.RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN = consumeAppCheckToken;
  }

  if (concurrency === undefined) {
    delete process.env.RNC_LOOKUP_CONCURRENCY;
  } else {
    process.env.RNC_LOOKUP_CONCURRENCY = concurrency;
  }
  if (maxInstances === undefined) {
    delete process.env.RNC_LOOKUP_MAX_INSTANCES;
  } else {
    process.env.RNC_LOOKUP_MAX_INSTANCES = maxInstances;
  }

  if (timeoutSeconds === undefined) {
    delete process.env.RNC_LOOKUP_TIMEOUT_SECONDS;
  } else {
    process.env.RNC_LOOKUP_TIMEOUT_SECONDS = timeoutSeconds;
  }

  return import('./rncCallableOptions.js');
};

afterEach(() => {
  vi.resetModules();

  if (originalEnforceAppCheckEnv === undefined) {
    delete process.env.RNC_LOOKUP_ENFORCE_APP_CHECK;
  } else {
    process.env.RNC_LOOKUP_ENFORCE_APP_CHECK = originalEnforceAppCheckEnv;
  }

  if (originalConsumeAppCheckEnv === undefined) {
    delete process.env.RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN;
  } else {
    process.env.RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN =
      originalConsumeAppCheckEnv;
  }

  if (originalConcurrencyEnv === undefined) {
    delete process.env.RNC_LOOKUP_CONCURRENCY;
  } else {
    process.env.RNC_LOOKUP_CONCURRENCY = originalConcurrencyEnv;
  }

  if (originalMaxInstancesEnv === undefined) {
    delete process.env.RNC_LOOKUP_MAX_INSTANCES;
  } else {
    process.env.RNC_LOOKUP_MAX_INSTANCES = originalMaxInstancesEnv;
  }

  if (originalTimeoutSecondsEnv === undefined) {
    delete process.env.RNC_LOOKUP_TIMEOUT_SECONDS;
  } else {
    process.env.RNC_LOOKUP_TIMEOUT_SECONDS = originalTimeoutSecondsEnv;
  }
});

describe('rncCallableOptions', () => {
  it('keeps App Check disabled by default for staged rollout', async () => {
    const config = await loadConfigWithEnv();

    expect(config.getLookupRncAppCheckMode()).toBe('developer-access-only');
    expect(config.buildLookupRncCallableOptions()).toEqual({
      concurrency: 20,
      enforceAppCheck: false,
      maxInstances: 10,
      memory: '2GiB',
      timeoutSeconds: 180,
    });
  });

  it('enables App Check without limited-use tokens by default', async () => {
    const config = await loadConfigWithEnv({
      enforceAppCheck: 'true',
    });

    expect(config.getLookupRncAppCheckMode()).toBe('enforced');
    expect(config.buildLookupRncCallableOptions({ timeoutSeconds: 120 }))
      .toEqual({
        concurrency: 20,
        enforceAppCheck: true,
        maxInstances: 10,
        memory: '2GiB',
        timeoutSeconds: 120,
      });
  });

  it('enables limited-use token consumption only when both flags are true', async () => {
    const config = await loadConfigWithEnv({
      consumeAppCheckToken: 'yes',
      enforceAppCheck: '1',
    });

    expect(config.getLookupRncAppCheckMode()).toBe('enforced-limited-use');
    expect(config.buildLookupRncCallableOptions({ memory: '1GiB' })).toEqual({
      concurrency: 20,
      consumeAppCheckToken: true,
      enforceAppCheck: true,
      maxInstances: 10,
      memory: '1GiB',
      timeoutSeconds: 180,
    });
  });

  it('supports maxInstances from environment', async () => {
    const config = await loadConfigWithEnv({
      maxInstances: '5',
    });

    expect(config.buildLookupRncCallableOptions()).toMatchObject({
      maxInstances: 5,
    });
  });

  it('supports concurrency from environment within safe bounds', async () => {
    const config = await loadConfigWithEnv({
      concurrency: '12',
    });

    expect(config.buildLookupRncCallableOptions()).toMatchObject({
      concurrency: 12,
    });
  });

  it('supports timeout from environment within safe bounds', async () => {
    const config = await loadConfigWithEnv({
      timeoutSeconds: '240',
    });

    expect(config.buildLookupRncCallableOptions()).toMatchObject({
      timeoutSeconds: 240,
    });
  });

  it('falls back when numeric environment values are outside safe bounds', async () => {
    const config = await loadConfigWithEnv({
      concurrency: '-1',
      maxInstances: '10000',
      timeoutSeconds: '999',
    });

    expect(config.buildLookupRncCallableOptions()).toMatchObject({
      concurrency: 20,
      maxInstances: 10,
      timeoutSeconds: 180,
    });
  });
});
