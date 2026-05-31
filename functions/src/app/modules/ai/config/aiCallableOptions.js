export const AI_AGENT_REGION = 'us-central1';

const readEnvString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const readBooleanEnv = (value) => {
  const normalized = readEnvString(value).toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

export const AI_AGENT_ENFORCE_APP_CHECK = readBooleanEnv(
  process.env.AI_AGENT_ENFORCE_APP_CHECK,
);

export const getAiAgentAppCheckMode = () =>
  AI_AGENT_ENFORCE_APP_CHECK ? 'enforced-limited-use' : 'developer-access-only';

export const buildAiAgentCallableOptions = (overrides = {}) => ({
  region: AI_AGENT_REGION,
  enforceAppCheck: AI_AGENT_ENFORCE_APP_CHECK,
  ...(AI_AGENT_ENFORCE_APP_CHECK ? { consumeAppCheckToken: true } : {}),
  ...overrides,
});
