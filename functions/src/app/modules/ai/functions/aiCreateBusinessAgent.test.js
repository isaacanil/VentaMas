import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertAiBusinessSeedingDeveloperAccessMock,
  buildSuggestedBusinessDraftMock,
  createBusinessWithAiFlowRunMock,
} = vi.hoisted(() => ({
  assertAiBusinessSeedingDeveloperAccessMock: vi.fn(),
  buildSuggestedBusinessDraftMock: vi.fn(),
  createBusinessWithAiFlowRunMock: vi.fn(),
}));

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
  onCall: (...args) => args.at(-1),
}));

vi.mock('../config/aiCallableOptions.js', () => ({
  buildAiAgentCallableOptions: (options) => options,
}));

vi.mock('../flows/businessCreator.flow.js', () => ({
  createBusinessWithAiFlow: {
    run: createBusinessWithAiFlowRunMock,
  },
}));

vi.mock('../utils/businessDraft.util.js', () => ({
  buildSuggestedBusinessDraft: buildSuggestedBusinessDraftMock,
}));

vi.mock('./aiBusinessSeedingAccess.js', () => ({
  assertAiBusinessSeedingDeveloperAccess:
    assertAiBusinessSeedingDeveloperAccessMock,
}));

const { aiCreateBusinessAgent } = await import('./aiCreateBusinessAgent.js');

describe('aiCreateBusinessAgent access boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertAiBusinessSeedingDeveloperAccessMock.mockResolvedValue({
      uid: 'dev-user',
    });
    createBusinessWithAiFlowRunMock.mockResolvedValue({
      result: {
        guidance: {
          summary: 'Lista para registrar',
        },
      },
    });
    buildSuggestedBusinessDraftMock.mockReturnValue({
      name: 'Demo',
      aiMetadata: {
        source: 'aiCreateBusinessAgent',
      },
    });
  });

  it('checks developer access before running the legacy AI draft flow', async () => {
    const request = {
      app: { token: 'limited-use' },
      auth: { uid: 'dev-user' },
      data: {
        draftInput: {
          idea: 'Farmacia de barrio',
          name: 'Demo',
        },
      },
    };

    const result = await aiCreateBusinessAgent(request);

    expect(assertAiBusinessSeedingDeveloperAccessMock).toHaveBeenCalledWith(
      request,
    );
    expect(createBusinessWithAiFlowRunMock).toHaveBeenCalledWith(
      request.data.draftInput,
      {
        context: {
          auth: request.auth,
          app: request.app,
        },
      },
    );
    expect(buildSuggestedBusinessDraftMock).toHaveBeenCalledWith({
      input: request.data.draftInput,
      aiDraft: {
        guidance: {
          summary: 'Lista para registrar',
        },
      },
    });
    expect(result).toEqual({
      ok: true,
      mode: 'draft',
      aiDraft: {
        guidance: {
          summary: 'Lista para registrar',
        },
      },
      suggestedBusiness: {
        name: 'Demo',
        aiMetadata: {
          source: 'aiCreateBusinessAgent',
        },
      },
    });
  });

  it('does not run the AI flow when developer access is denied', async () => {
    const accessError = Object.assign(new Error('Dev access required'), {
      code: 'permission-denied',
    });
    assertAiBusinessSeedingDeveloperAccessMock.mockRejectedValue(accessError);

    await expect(
      aiCreateBusinessAgent({
        auth: { uid: 'owner-user' },
        data: {
          draftInput: {
            idea: 'Restaurante',
          },
        },
      }),
    ).rejects.toBe(accessError);

    expect(createBusinessWithAiFlowRunMock).not.toHaveBeenCalled();
    expect(buildSuggestedBusinessDraftMock).not.toHaveBeenCalled();
  });
});
