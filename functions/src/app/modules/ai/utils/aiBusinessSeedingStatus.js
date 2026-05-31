import {
  AI_BUSINESS_SEEDING_ACTIONS,
  AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
  AI_BUSINESS_SEEDING_SCHEMA_VERSION,
} from './aiBusinessSeedingStructuredOutput.js';

export const buildAiBusinessSeedingStatus = ({
  appCheckMode,
  appCheckTokenPresent = false,
  authPresent = false,
  generatedAt = new Date().toISOString(),
  location,
  model,
  thinkingLevel,
  thoughtSummariesEnabled = false,
} = {}) => ({
  ok: true,
  operation: 'status',
  metadata: {
    availableActions: [...AI_BUSINESS_SEEDING_ACTIONS],
    appCheckMode,
    appCheckTokenPresent: Boolean(appCheckTokenPresent),
    authPresent: Boolean(authPresent),
    generatedAt,
    location,
    model,
    modelConfigSource: 'functions-env',
    schemaVersion: AI_BUSINESS_SEEDING_SCHEMA_VERSION,
    structuredOutput: true,
    constrainedOutput: AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
    ...(thinkingLevel ? { thinkingLevel } : {}),
    thoughtSummariesEnabled: Boolean(thoughtSummariesEnabled),
  },
});
