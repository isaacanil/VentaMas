import { z } from 'genkit';

import { ai, businessCreatorModel } from '../config/genkit.js';
import { buildAiBusinessSeedingSystemPrompt } from '../utils/aiBusinessSeedingSystemPrompt.js';

const aiBusinessSeedingAnalyzeInputSchema = z.object({
  prompt: z.string().min(1),
  enabledActions: z.array(z.string()).optional(),
  conversationContext: z.any().optional(),
});

const aiBusinessSeedingAnalyzeOutputSchema = z.object({
  rawJson: z.string(),
});

export const aiBusinessSeedingAnalyzeFlow = ai.defineFlow(
  {
    name: 'aiBusinessSeedingAnalyzeFlow',
    inputSchema: aiBusinessSeedingAnalyzeInputSchema,
    outputSchema: aiBusinessSeedingAnalyzeOutputSchema,
  },
  async (input) => {
    const contextBlock = buildConversationContextBlock(input.conversationContext);
    const promptWithContext = contextBlock
      ? `${input.prompt}\n\n${contextBlock}`
      : input.prompt;

    const { text } = await ai.generate({
      model: businessCreatorModel,
      system: buildAiBusinessSeedingSystemPrompt(input.enabledActions),
      prompt: promptWithContext,
      config: {
        temperature: 0.2,
      },
    });

    const rawText = typeof text === 'string' ? text.trim() : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const rawJson = jsonMatch?.[0]?.trim() || '';

    if (!rawJson) {
      throw new Error('No se detectó JSON válido en la respuesta del modelo.');
    }

    return { rawJson };
  },
);

function buildConversationContextBlock(conversationContext) {
  if (
    !conversationContext ||
    typeof conversationContext !== 'object' ||
    Array.isArray(conversationContext)
  ) {
    return '';
  }

  const seen = new WeakSet();
  const safeJson = JSON.stringify(
    conversationContext,
    (key, value) => {
      if (typeof key === 'string') {
        const normalized = key.toLowerCase();
        if (normalized.includes('password') || normalized.includes('sessiontoken')) {
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

  if (!safeJson || safeJson === '{}') return '';

  const clippedJson =
    safeJson.length > 8000 ? `${safeJson.slice(0, 8000)}\n...[truncated]` : safeJson;

  return [
    'CONTEXTO_DE_CONVERSACION_JSON (usar para memoria de trabajo y correcciones):',
    clippedJson,
    'FIN_CONTEXTO_DE_CONVERSACION_JSON',
  ].join('\n');
}
