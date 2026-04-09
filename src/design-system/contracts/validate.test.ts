import { describe, expect, it } from 'vitest';

import { designSystemContextPack } from '@/design-system/context/context-pack';
import { validateContextPack } from '@/design-system/contracts/validate';
import { componentRegistry } from '@/design-system/registry/components';
import { screenRecipes } from '@/design-system/recipes/screen-recipes';

describe('design system context pack', () => {
  it('keeps unique component ids', () => {
    const ids = componentRegistry.map((component) => component.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps unique screen recipe ids', () => {
    const ids = screenRecipes.map((recipe) => recipe.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('validates the current registry and recipes', () => {
    expect(validateContextPack(designSystemContextPack)).toEqual([]);
  });
});
