import { beforeEach, describe, expect, it, vi } from 'vitest';

const assertAiBusinessSeedingDeveloperAccessMock = vi.hoisted(() => vi.fn());

vi.mock('../config/aiCallableOptions.js', () => ({
  getAiAgentAppCheckMode: () => 'developer-access-only',
}));

vi.mock('../config/genkit.js', () => ({
  businessCreatorModelName: 'gemini-3-flash-preview',
  businessCreatorThinkingLevel: 'MEDIUM',
  businessCreatorThoughtSummariesEnabled: true,
  businessCreatorVertexLocation: 'global',
}));

vi.mock('./aiBusinessSeedingAccess.js', () => ({
  assertAiBusinessSeedingDeveloperAccess:
    assertAiBusinessSeedingDeveloperAccessMock,
}));

const { handleAiBusinessSeedingAgentStatus } = await import(
  './aiBusinessSeedingAgentStatus.js'
);

describe('handleAiBusinessSeedingAgentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertAiBusinessSeedingDeveloperAccessMock.mockResolvedValue({
      uid: 'dev-user',
    });
  });

  it('checks developer access and returns status diagnostics', async () => {
    const request = {
      app: { token: 'limited-use' },
      auth: { uid: 'dev-user' },
    };

    const status = await handleAiBusinessSeedingAgentStatus(request);

    expect(assertAiBusinessSeedingDeveloperAccessMock).toHaveBeenCalledWith(
      request,
    );
    expect(status).toMatchObject({
      ok: true,
      operation: 'status',
      metadata: {
        appCheckMode: 'developer-access-only',
        appCheckTokenPresent: true,
        authPresent: true,
        location: 'global',
        model: 'gemini-3-flash-preview',
        thinkingLevel: 'MEDIUM',
        thoughtSummariesEnabled: true,
      },
    });
  });
});
