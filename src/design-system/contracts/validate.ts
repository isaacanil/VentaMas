import type {
  ComponentContract,
  DesignSystemContextPack,
  ScreenRecipe,
  UiSchemaNode,
} from './types';

const collectComponentIds = (nodes: readonly UiSchemaNode[]): string[] => {
  const componentIds: string[] = [];

  const visit = (node: UiSchemaNode) => {
    componentIds.push(node.componentId);
    node.children?.forEach(visit);
  };

  nodes.forEach(visit);

  return componentIds;
};

export const validateComponentRegistry = (
  registry: readonly ComponentContract[],
): string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();

  registry.forEach((component) => {
    if (ids.has(component.id)) {
      errors.push(`Duplicate component id "${component.id}".`);
    }
    ids.add(component.id);

    component.designTokens?.forEach((token) => {
      if (!token.cssVar.startsWith('--ds-')) {
        errors.push(
          `Component "${component.id}" references invalid css var "${token.cssVar}".`,
        );
      }
      if (!token.path.trim()) {
        errors.push(`Component "${component.id}" has an empty token path.`);
      }
    });

    component.variants?.forEach((variant) => {
      const prop = component.props.find((entry) => entry.name === variant.prop);

      if (!prop) {
        errors.push(
          `Component "${component.id}" variant "${variant.name}" points to missing prop "${variant.prop}".`,
        );
      }
    });
  });

  return errors;
};

export const validateScreenRecipes = (
  registry: readonly ComponentContract[],
  recipes: readonly ScreenRecipe[],
): string[] => {
  const errors: string[] = [];
  const knownComponents = new Set(registry.map((component) => component.id));
  const recipeIds = new Set<string>();

  recipes.forEach((recipe) => {
    if (recipeIds.has(recipe.id)) {
      errors.push(`Duplicate recipe id "${recipe.id}".`);
    }
    recipeIds.add(recipe.id);

    recipe.requiredComponents.forEach((componentId) => {
      if (!knownComponents.has(componentId)) {
        errors.push(
          `Recipe "${recipe.id}" requires unknown component "${componentId}".`,
        );
      }
    });

    recipe.optionalComponents?.forEach((componentId) => {
      if (!knownComponents.has(componentId)) {
        errors.push(
          `Recipe "${recipe.id}" declares unknown optional component "${componentId}".`,
        );
      }
    });

    recipe.forbiddenComponents?.forEach((componentId) => {
      if (!knownComponents.has(componentId)) {
        errors.push(
          `Recipe "${recipe.id}" forbids unknown component "${componentId}".`,
        );
      }
    });

    recipe.slots.forEach((slot) => {
      slot.allowedComponents.forEach((componentId) => {
        if (!knownComponents.has(componentId)) {
          errors.push(
            `Recipe "${recipe.id}" slot "${slot.key}" references unknown component "${componentId}".`,
          );
        }
      });
    });

    const exampleComponentIds = collectComponentIds(recipe.examplePlan.tree);

    recipe.requiredComponents.forEach((componentId) => {
      if (!exampleComponentIds.includes(componentId)) {
        errors.push(
          `Recipe "${recipe.id}" example plan does not include required component "${componentId}".`,
        );
      }
    });
  });

  return errors;
};

export const validateContextPack = (
  contextPack: DesignSystemContextPack,
): string[] => [
  ...validateComponentRegistry(contextPack.componentRegistry),
  ...validateScreenRecipes(
    contextPack.componentRegistry,
    contextPack.screenRecipes,
  ),
];
