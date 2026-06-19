const readEnvString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const readBooleanEnv = (value) => {
  const normalized = readEnvString(value).toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const readIntegerEnv = ({ defaultValue, max, min, value }) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return defaultValue;
  if (parsed < min || parsed > max) return defaultValue;
  return parsed;
};

export const RNC_LOOKUP_ENFORCE_APP_CHECK = readBooleanEnv(
  process.env.RNC_LOOKUP_ENFORCE_APP_CHECK,
);

export const RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN =
  RNC_LOOKUP_ENFORCE_APP_CHECK &&
  readBooleanEnv(process.env.RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN);

export const RNC_LOOKUP_MEMORY = '2GiB';

export const RNC_LOOKUP_TIMEOUT_SECONDS = readIntegerEnv({
  defaultValue: 180,
  max: 300,
  min: 30,
  value: process.env.RNC_LOOKUP_TIMEOUT_SECONDS,
});

export const getLookupRncAppCheckMode = () => {
  if (!RNC_LOOKUP_ENFORCE_APP_CHECK) return 'developer-access-only';
  return RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN
    ? 'enforced-limited-use'
    : 'enforced';
};

export const RNC_LOOKUP_CONCURRENCY =
  readIntegerEnv({
    defaultValue: 20,
    max: 80,
    min: 1,
    value: process.env.RNC_LOOKUP_CONCURRENCY,
  });

export const RNC_LOOKUP_MAX_INSTANCES =
  readIntegerEnv({
    defaultValue: 10,
    max: 100,
    min: 1,
    value: process.env.RNC_LOOKUP_MAX_INSTANCES,
  });

export const buildLookupRncCallableOptions = (overrides = {}) => ({
  concurrency: RNC_LOOKUP_CONCURRENCY,
  enforceAppCheck: RNC_LOOKUP_ENFORCE_APP_CHECK,
  maxInstances: RNC_LOOKUP_MAX_INSTANCES,
  memory: RNC_LOOKUP_MEMORY,
  timeoutSeconds: RNC_LOOKUP_TIMEOUT_SECONDS,
  ...(RNC_LOOKUP_CONSUME_APP_CHECK_TOKEN
    ? { consumeAppCheckToken: true }
    : {}),
  ...overrides,
});
