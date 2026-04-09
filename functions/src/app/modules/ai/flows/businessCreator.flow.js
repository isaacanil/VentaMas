import { z } from 'genkit';

import { ai, businessCreatorModel } from '../config/genkit.js';
import { buildBusinessCreatorPrompt } from '../utils/businessCreatorPrompt.js';

export const businessCreatorInputSchema = z.object({
  idea: z.string().min(3),
  name: z.string().optional(),
  businessType: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  rnc: z.string().optional(),
  email: z.string().optional(),
  tel: z.string().optional(),
  address: z.string().optional(),
});

export const businessCreatorOutputSchema = z.object({
  formSuggestions: z.object({
    name: z.string(),
    businessType: z.enum(['general', 'pharmacy']),
    country: z.string(),
    province: z.string(),
  }),
  guidance: z.object({
    summary: z.string(),
    launchChecklist: z.array(z.string()).min(3).max(10),
    riskWarnings: z.array(z.string()).min(2).max(8),
  }),
});

export const createBusinessWithAiFlow = ai.defineFlow(
  {
    name: 'createBusinessWithAiFlow',
    inputSchema: businessCreatorInputSchema,
    outputSchema: businessCreatorOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: businessCreatorModel,
      system: [
        'Eres un asistente para prellenar formularios de creación de negocios en VentaMas.',
        'Solo sugiere campos útiles para el formulario actual: name, businessType, country y province.',
        'businessType debe ser exclusivamente "general" o "pharmacy".',
        'No inventes datos legales o de contacto (RNC, email, teléfono, dirección).',
        'La guía debe ser concreta y operativa para un pequeño negocio.',
      ].join(' '),
      prompt: buildBusinessCreatorPrompt(input),
      output: { schema: businessCreatorOutputSchema },
    });

    if (!output) {
      throw new Error('El modelo no devolvió una propuesta estructurada.');
    }

    return output;
  },
);
