import { afterEach, describe, expect, it, vi } from 'vitest';

const originalAppCheckEnv = process.env.AI_AGENT_ENFORCE_APP_CHECK;

const loadConfigWithEnv = async (value) => {
  vi.resetModules();
  if (value === undefined) {
    delete process.env.AI_AGENT_ENFORCE_APP_CHECK;
  } else {
    process.env.AI_AGENT_ENFORCE_APP_CHECK = value;
  }
  return import('./aiCallableOptions.js');
};

afterEach(() => {
  vi.resetModules();
  if (originalAppCheckEnv === undefined) {
    delete process.env.AI_AGENT_ENFORCE_APP_CHECK;
  } else {
    process.env.AI_AGENT_ENFORCE_APP_CHECK = originalAppCheckEnv;
  }
});

describe('aiCallableOptions', () => {
  it('keeps App Check disabled by default for developer access', async () => {
    const config = await loadConfigWithEnv(undefined);

    expect(config.getAiAgentAppCheckMode()).toBe('developer-access-only');
    expect(config.buildAiAgentCallableOptions()).toEqual({
      region: 'us-central1',
      enforceAppCheck: false,
    });
  });

  it('enables limited-use App Check consumption when the env flag is true', async () => {
    const config = await loadConfigWithEnv('true');

    expect(config.getAiAgentAppCheckMode()).toBe('enforced-limited-use');
    expect(config.buildAiAgentCallableOptions({ timeoutSeconds: 180 })).toEqual(
      {
        region: 'us-central1',
        enforceAppCheck: true,
        consumeAppCheckToken: true,
        timeoutSeconds: 180,
      },
    );
  });

  it('accepts common truthy env values', async () => {
    await expect(loadConfigWithEnv('1')).resolves.toMatchObject({
      AI_AGENT_ENFORCE_APP_CHECK: true,
    });
    await expect(loadConfigWithEnv('yes')).resolves.toMatchObject({
      AI_AGENT_ENFORCE_APP_CHECK: true,
    });
    await expect(loadConfigWithEnv('on')).resolves.toMatchObject({
      AI_AGENT_ENFORCE_APP_CHECK: true,
    });
  });
});
