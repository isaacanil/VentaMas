import { z } from 'genkit';

import {
  ai,
  businessCreatorModel,
  businessCreatorThinkingConfig,
} from '../config/genkit.js';
import { buildAiBusinessSeedingConversationContext } from '../utils/aiBusinessSeedingConversationContext.js';
import {
  aiBusinessSeedingAnalyzeFlowOutputSchema,
  aiBusinessSeedingModelOutputOptions,
  normalizeAiBusinessSeedingUsage,
  normalizeAiBusinessSeedingModelOutput,
} from '../utils/aiBusinessSeedingStructuredOutput.js';
import { buildAiBusinessSeedingSystemPrompt } from '../utils/aiBusinessSeedingSystemPrompt.js';

const aiBusinessSeedingAnalyzeInputSchema = z.object({
  prompt: z.string().min(1),
  enabledActions: z.array(z.string()).optional(),
  conversationContext: z.any().optional(),
});

export const aiBusinessSeedingAnalyzeFlow = ai.defineFlow(
  {
    name: 'aiBusinessSeedingAnalyzeFlow',
    inputSchema: aiBusinessSeedingAnalyzeInputSchema,
    outputSchema: aiBusinessSeedingAnalyzeFlowOutputSchema,
  },
  async (input) => {
    const { text: contextBlock, metrics: contextMetrics } =
      buildAiBusinessSeedingConversationContext(input.conversationContext);
    const promptWithContext = contextBlock
      ? `${input.prompt}\n\n${contextBlock}`
      : input.prompt;

    const response = await ai.generate({
      model: businessCreatorModel,
      system: buildAiBusinessSeedingSystemPrompt(input.enabledActions),
      prompt: promptWithContext,
      config: {
        temperature: 0.2,
        ...(businessCreatorThinkingConfig
          ? { thinkingConfig: businessCreatorThinkingConfig }
          : {}),
      },
      output: aiBusinessSeedingModelOutputOptions,
    });
    const { output } = response;

    if (!output) {
      throw new Error('El modelo no devolvio una accion estructurada.');
    }

    return {
      ...normalizeAiBusinessSeedingModelOutput(output, input.enabledActions),
      usage: normalizeAiBusinessSeedingUsage(response.usage),
      requestMetrics: {
        ...contextMetrics,
        promptCharacters: input.prompt.length,
        promptWithContextCharacters: promptWithContext.length,
      },
    };
  },
);
