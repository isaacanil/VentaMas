import { z } from 'genkit';

export const AI_BUSINESS_SEEDING_SCHEMA_VERSION = 'ai-business-seeding-v2';
export const AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT = true;

export const AI_BUSINESS_SEEDING_ACTIONS = ['chat', 'create_business'];

const businessSeedRoleSchema = z.enum([
  'admin',
  'owner',
  'manager',
  'cashier',
  'buyer',
]);

const businessSeedBusinessSchema = z.object({
  name: z.string().min(1),
  rnc: z.string().optional(),
  address: z.string().optional(),
  tel: z.string().optional(),
  email: z.string().optional(),
  businessType: z.string().optional(),
});

const businessSeedUserSchema = z.object({
  realName: z.string().optional(),
  name: z.string().min(1),
  role: businessSeedRoleSchema,
  password: z.string().optional(),
  email: z.string().optional(),
});

export const aiBusinessSeedingModelOutputSchema = z.object({
  action: z.enum(AI_BUSINESS_SEEDING_ACTIONS),
  data: z.object({
    message: z.string().optional(),
    business: businessSeedBusinessSchema.optional(),
    users: z.array(businessSeedUserSchema).optional(),
  }),
});

export const aiBusinessSeedingModelOutputOptions = {
  schema: aiBusinessSeedingModelOutputSchema,
  constrained: AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
};

const aiBusinessSeedingUsageSchema = z
  .object({
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional(),
    totalTokens: z.number().optional(),
    inputCharacters: z.number().optional(),
    outputCharacters: z.number().optional(),
    inputImages: z.number().optional(),
    outputImages: z.number().optional(),
    inputVideos: z.number().optional(),
    outputVideos: z.number().optional(),
    inputAudioFiles: z.number().optional(),
    outputAudioFiles: z.number().optional(),
    thoughtsTokens: z.number().optional(),
    cachedContentTokens: z.number().optional(),
  })
  .optional();

const aiBusinessSeedingRequestMetricsSchema = z.object({
  contextCharacters: z.number(),
  contextOriginalCharacters: z.number(),
  contextTruncated: z.boolean(),
  promptCharacters: z.number(),
  promptWithContextCharacters: z.number(),
});

export const aiBusinessSeedingAnalyzeFlowOutputSchema = z.object({
  action: z.enum(AI_BUSINESS_SEEDING_ACTIONS),
  data: z.any(),
  rawJson: z.string(),
  schemaVersion: z.string(),
  structuredOutput: z.boolean(),
  constrainedOutput: z.boolean(),
  usage: aiBusinessSeedingUsageSchema,
  requestMetrics: aiBusinessSeedingRequestMetricsSchema,
});

const USAGE_FIELDS = [
  'inputTokens',
  'outputTokens',
  'totalTokens',
  'inputCharacters',
  'outputCharacters',
  'inputImages',
  'outputImages',
  'inputVideos',
  'outputVideos',
  'inputAudioFiles',
  'outputAudioFiles',
  'thoughtsTokens',
  'cachedContentTokens',
];

const normalizeEnabledActions = (enabledActions) =>
  Array.isArray(enabledActions)
    ? enabledActions.filter((item) =>
        AI_BUSINESS_SEEDING_ACTIONS.includes(item),
      )
    : null;

const assertActionEnabled = (action, enabledActions) => {
  if (action === 'chat') return;

  const normalizedEnabledActions = normalizeEnabledActions(enabledActions);
  if (!normalizedEnabledActions) return;

  if (!normalizedEnabledActions.includes(action)) {
    throw new Error(
      `La accion "${action}" no esta habilitada para este turno.`,
    );
  }
};

const buildNormalizedOutput = ({ action, data }) => {
  const payload = { action, data };
  return {
    ...payload,
    rawJson: JSON.stringify(payload),
    schemaVersion: AI_BUSINESS_SEEDING_SCHEMA_VERSION,
    structuredOutput: true,
    constrainedOutput: AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
  };
};

const readString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const normalizeText = (value) =>
  readString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizeBusinessType = (value) => {
  const normalized = normalizeText(value);
  return normalized.includes('farmacia') || normalized.includes('pharmacy')
    ? 'pharmacy'
    : 'general';
};

const looksLikeAddress = (value) => {
  const normalized = normalizeText(value);
  return (
    normalized.startsWith('c/') ||
    normalized.startsWith('calle ') ||
    normalized.startsWith('av ') ||
    normalized.startsWith('ave ') ||
    normalized.startsWith('avenida ') ||
    normalized.includes(' pantoja') ||
    normalized.includes(' sto.') ||
    normalized.includes(' santo domingo')
  );
};

const splitPhoneAndAddress = (tel, address) => {
  const cleanTel = readString(tel);
  const cleanAddress = readString(address);
  if (!cleanTel || cleanAddress) {
    return { tel: cleanTel || undefined, address: cleanAddress || undefined };
  }

  const parts = cleanTel
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return { tel: cleanTel || undefined, address: undefined };
  }

  const firstAddressIndex = parts.findIndex(looksLikeAddress);
  if (firstAddressIndex < 1) {
    return { tel: cleanTel || undefined, address: undefined };
  }

  return {
    tel: parts.slice(0, firstAddressIndex).join(', '),
    address: parts.slice(firstAddressIndex).join(', '),
  };
};

const normalizeBusinessData = (business) => {
  if (!business || typeof business !== 'object' || Array.isArray(business)) {
    return business;
  }

  const { tel, address } = splitPhoneAndAddress(business.tel, business.address);

  return {
    ...business,
    ...(tel ? { tel } : {}),
    ...(address ? { address } : {}),
    businessType: normalizeBusinessType(business.businessType),
  };
};

const normalizeChatData = (data) => {
  const message = typeof data?.message === 'string' ? data.message.trim() : '';
  if (!message) {
    throw new Error('La accion chat requiere data.message.');
  }

  return {
    message,
    ...(data?.business
      ? { business: normalizeBusinessData(data.business) }
      : {}),
    ...(Array.isArray(data?.users) && data.users.length
      ? { users: data.users }
      : {}),
  };
};

const normalizeCreateBusinessData = (data) => {
  const business = data?.business;
  const users = Array.isArray(data?.users) ? data.users : [];

  if (!business || typeof business !== 'object' || Array.isArray(business)) {
    throw new Error('La accion create_business requiere data.business.');
  }

  if (users.length === 0) {
    throw new Error('La accion create_business requiere al menos un usuario.');
  }

  const ownerCount = users.filter((user) => user?.role === 'owner').length;
  if (ownerCount !== 1) {
    throw new Error('La accion create_business requiere exactamente 1 owner.');
  }

  return { business: normalizeBusinessData(business), users };
};

export const normalizeAiBusinessSeedingModelOutput = (
  rawOutput,
  enabledActions,
) => {
  const parsed = aiBusinessSeedingModelOutputSchema.parse(rawOutput);
  assertActionEnabled(parsed.action, enabledActions);

  if (parsed.action === 'chat') {
    return buildNormalizedOutput({
      action: parsed.action,
      data: normalizeChatData(parsed.data),
    });
  }

  if (parsed.action === 'create_business') {
    return buildNormalizedOutput({
      action: parsed.action,
      data: normalizeCreateBusinessData(parsed.data),
    });
  }

  throw new Error(`Accion no soportada: ${parsed.action || 'vacia'}.`);
};

export const normalizeAiBusinessSeedingUsage = (usage) => {
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) {
    return undefined;
  }

  const normalized = {};
  for (const field of USAGE_FIELDS) {
    const value = usage[field];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      normalized[field] = value;
    }
  }

  return Object.keys(normalized).length ? normalized : undefined;
};
