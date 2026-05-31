export const AI_BUSINESS_SEEDING_CONTEXT_CHARACTER_LIMIT = 8000;

export const buildAiBusinessSeedingConversationContext = (
  conversationContext,
) => {
  if (
    !conversationContext ||
    typeof conversationContext !== 'object' ||
    Array.isArray(conversationContext)
  ) {
    return {
      text: '',
      metrics: {
        contextCharacters: 0,
        contextOriginalCharacters: 0,
        contextTruncated: false,
      },
    };
  }

  const seen = new WeakSet();
  const safeJson = JSON.stringify(
    conversationContext,
    (key, value) => {
      if (typeof key === 'string') {
        const normalized = key.toLowerCase();
        if (
          normalized.includes('password') ||
          normalized.includes('sessiontoken')
        ) {
          return '[redacted]';
        }
      }

      if (typeof value === 'string' && value.length > 500) {
        return `${value.slice(0, 500)}...[truncated]`;
      }

      if (value && typeof value === 'object') {
        if (seen.has(value)) return '[circular]';
        seen.add(value);
      }

      return value;
    },
    2,
  );

  if (!safeJson || safeJson === '{}') {
    return {
      text: '',
      metrics: {
        contextCharacters: 0,
        contextOriginalCharacters: 0,
        contextTruncated: false,
      },
    };
  }

  const contextTruncated =
    safeJson.length > AI_BUSINESS_SEEDING_CONTEXT_CHARACTER_LIMIT;
  const clippedJson = contextTruncated
    ? `${safeJson.slice(0, AI_BUSINESS_SEEDING_CONTEXT_CHARACTER_LIMIT)}\n...[truncated]`
    : safeJson;

  const text = [
    'CONTEXTO_DE_CONVERSACION_JSON (usar para memoria de trabajo y correcciones):',
    clippedJson,
    'FIN_CONTEXTO_DE_CONVERSACION_JSON',
  ].join('\n');

  return {
    text,
    metrics: {
      contextCharacters: text.length,
      contextOriginalCharacters: safeJson.length,
      contextTruncated,
    },
  };
};
