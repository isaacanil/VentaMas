import type {
  AgentRequestMetrics,
  AgentRuntimeMetadata,
  AgentUsageMetadata,
} from '../types';

export const formatDuration = (durationMs?: number): string => {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs)) {
    return '';
  }
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${(durationMs / 1000).toFixed(1)} s`;
};

export const formatRuntime = (metadata?: AgentRuntimeMetadata): string => {
  const runtime = [metadata?.model, metadata?.location]
    .filter(Boolean)
    .join(' @ ');
  const duration = formatDuration(metadata?.durationMs);
  const thinking = formatThinking(metadata);
  return [
    runtime,
    thinking,
    duration,
    formatUsage(metadata?.usage),
    formatRequestMetrics(metadata?.requestMetrics),
  ]
    .filter(Boolean)
    .join(' | ');
};

export const formatThinking = (metadata?: AgentRuntimeMetadata): string => {
  if (!metadata?.thinkingLevel) return '';
  return `thinking: ${metadata.thinkingLevel.toLowerCase()}`;
};

export const formatUsage = (usage?: AgentUsageMetadata): string => {
  if (!usage) return '';

  const total =
    typeof usage.totalTokens === 'number' && Number.isFinite(usage.totalTokens)
      ? usage.totalTokens
      : undefined;
  const input =
    typeof usage.inputTokens === 'number' && Number.isFinite(usage.inputTokens)
      ? usage.inputTokens
      : undefined;
  const output =
    typeof usage.outputTokens === 'number' &&
    Number.isFinite(usage.outputTokens)
      ? usage.outputTokens
      : undefined;

  if (total !== undefined) {
    const parts = [
      input !== undefined ? `${input} in` : '',
      output !== undefined ? `${output} out` : '',
    ].filter(Boolean);
    return `tokens: ${total}${parts.length ? ` (${parts.join(' / ')})` : ''}`;
  }

  const inputCharacters =
    typeof usage.inputCharacters === 'number' &&
    Number.isFinite(usage.inputCharacters)
      ? usage.inputCharacters
      : undefined;
  const outputCharacters =
    typeof usage.outputCharacters === 'number' &&
    Number.isFinite(usage.outputCharacters)
      ? usage.outputCharacters
      : undefined;

  if (inputCharacters !== undefined || outputCharacters !== undefined) {
    return [
      inputCharacters !== undefined ? `${inputCharacters} chars in` : '',
      outputCharacters !== undefined ? `${outputCharacters} chars out` : '',
    ]
      .filter(Boolean)
      .join(' / ');
  }

  return '';
};

export const formatRequestMetrics = (metrics?: AgentRequestMetrics): string => {
  if (!metrics) return '';

  const prompt =
    typeof metrics.promptCharacters === 'number' &&
    Number.isFinite(metrics.promptCharacters)
      ? metrics.promptCharacters
      : undefined;
  const context =
    typeof metrics.contextCharacters === 'number' &&
    Number.isFinite(metrics.contextCharacters)
      ? metrics.contextCharacters
      : undefined;

  const parts = [
    prompt !== undefined ? `prompt: ${prompt} chars` : '',
    context !== undefined && context > 0 ? `ctx: ${context} chars` : '',
  ].filter(Boolean);

  if (parts.length === 0) return '';
  return metrics.contextTruncated
    ? `${parts.join(' / ')} / ctx truncado`
    : parts.join(' / ');
};

export const formatStatusDetails = (
  metadata?: AgentRuntimeMetadata,
): string => {
  if (!metadata) return '';

  const runtime = formatRuntime(metadata);
  const actionsText = Array.isArray(metadata.availableActions)
    ? metadata.availableActions.join(', ')
    : '';
  const appCheckText =
    typeof metadata.appCheckTokenPresent === 'boolean'
      ? `app check: ${metadata.appCheckTokenPresent ? 'presente' : 'ausente'}`
      : '';
  const authText =
    typeof metadata.authPresent === 'boolean'
      ? `auth: ${metadata.authPresent ? 'presente' : 'ausente'}`
      : '';
  const outputText = metadata.constrainedOutput
    ? 'output: schema-constrained'
    : metadata.structuredOutput
      ? 'output: structured'
      : '';

  return [
    runtime,
    metadata.schemaVersion,
    outputText,
    metadata.appCheckMode,
    appCheckText,
    authText,
    actionsText ? `acciones: ${actionsText}` : '',
  ]
    .filter(Boolean)
    .join(' | ');
};
