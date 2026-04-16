# Wonder design system setup

This repo now exposes a Wonder-oriented bundle on top of the real VentaMas design system.

Source of truth:

- `src/design-system/index.ts`
- `src/design-system/ant-theme.ts`
- `src/design-system/tokens/index.ts`
- `src/design-system/context/context-pack.ts`
- `src/design-system/registry/components.ts`
- `src/design-system/recipes/screen-recipes.ts`

Wonder entrypoints:

- `src/design-system/wonder/bundle.ts`
- `src/design-system/wonder/prompt.ts`

## What to use in Wonder

Use `wonderDesignSystemBundle` when Wonder can ingest structured context.

Use `getWonderDesignSystemPrompt()` when Wonder expects a natural-language system prompt or design brief.

Both entrypoints preserve the same design-system rules:

- semantic tokens and `--ds-*` CSS variables only
- registered components only
- screen recipes from the existing registry
- Ant Design behavior plus VentaMas theming
- Font Awesome as the icon system

## Example usage

```ts
import {
  wonderDesignSystemBundle,
  getWonderDesignSystemPrompt,
} from '@/design-system';

const wonderContext = wonderDesignSystemBundle;
const wonderPrompt = getWonderDesignSystemPrompt();
```

## Recommended Wonder configuration

1. Load `wonderDesignSystemBundle` as structured project context.
2. Use `getWonderDesignSystemPrompt()` as the design-system instruction layer.
3. Keep `src/design-system` as the only visual source of truth.
4. Treat `legacy` registry entries as migration candidates, not preferred building blocks.
5. Reuse a documented screen recipe before inventing a new layout pattern.

## Current limitation

The Wonder MCP server is authenticated in Codex, but this thread runtime does not currently expose Wonder tools directly. If Wonder needs to be configured through MCP actions instead of manual/project import, open a new Codex thread after restart and reuse this bundle as the payload.
