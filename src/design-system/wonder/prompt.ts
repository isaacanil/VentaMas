import { wonderDesignSystemBundle } from './bundle';

export const getWonderDesignSystemPrompt = (): string => {
  const readyComponents = wonderDesignSystemBundle.contextPack.componentRegistry
    .filter((component) => component.status === 'ready')
    .map((component) => `- ${component.id}: ${component.description}`);

  const legacyComponents = wonderDesignSystemBundle.contextPack.componentRegistry
    .filter((component) => component.status === 'legacy')
    .map((component) => `- ${component.id}: ${component.description}`);

  const recipes = wonderDesignSystemBundle.contextPack.screenRecipes.map(
    (recipe) => `- ${recipe.id}: ${recipe.description}`,
  );

  const tokenFamilies = wonderDesignSystemBundle.contextPack.tokenFamilies.map(
    (family) => `- ${family.family} (${family.prefix}): ${family.guidance}`,
  );

  return [
    `You are generating UI for ${wonderDesignSystemBundle.product}.`,
    '',
    'Follow this design system without inventing parallel primitives.',
    '',
    'Stack',
    `- Framework: ${wonderDesignSystemBundle.stack.framework}`,
    `- Styling: ${wonderDesignSystemBundle.stack.styling}`,
    `- Component library: ${wonderDesignSystemBundle.stack.componentLibrary}`,
    `- Icon system: ${wonderDesignSystemBundle.stack.iconSystem}`,
    '',
    'Guardrails',
    ...wonderDesignSystemBundle.guardrails.map((rule) => `- ${rule}`),
    '',
    'Token families',
    ...tokenFamilies,
    '',
    'Ready components',
    ...readyComponents,
    '',
    'Legacy components',
    ...(legacyComponents.length > 0
      ? legacyComponents
      : ['- None.']),
    '',
    'Supported screen recipes',
    ...recipes,
    '',
    'Source of truth files',
    ...wonderDesignSystemBundle.sourceOfTruth.files.map((file) => `- ${file}`),
    '',
    'Implementation rules',
    ...wonderDesignSystemBundle.contextPack.rules.map((rule) => `- ${rule}`),
  ].join('\n');
};
