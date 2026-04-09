# AI Design System Context Pack

## Goal

Turn the existing VentaMas design system into a machine-readable contract that an AI agent can consume before generating UI.

## Scope

This first pass adds four missing layers on top of tokens and theming:

1. A typed component registry with reusable component contracts.
2. Screen recipes that constrain composition by use case.
3. A context pack that groups rules, token families, registry and recipes.
4. Validation tests that fail when registry or recipe references drift.

This pass now also captures:

- Font Awesome as the default icon policy for new generated UI.
- Controlled Ant primitives as the preferred base controls.
- Dashboard layout rules from `docs/development/page-layout-guide.md`.
- `MenuApp` registration behavior and `AdvancedTable` container constraints.
- Initial system wrappers: `AppIcon` and semantic `StatusBadge`.

## Why This Shape

Tokens alone are not enough. An agent still needs:

- Which components are allowed.
- Which props and variants are valid.
- Which screen structures are preferred.
- Which checks must pass before code generation.

The new artifacts create a constrain-first flow:

1. Read the registry.
2. Choose a screen recipe.
3. Produce a structured UI plan.
4. Validate the plan.
5. Generate React only after validation.

## Files

- `src/design-system/contracts/`
- `src/design-system/registry/`
- `src/design-system/recipes/`
- `src/design-system/context/`

## Next Steps

1. Expand the registry with more real VentaMas components.
2. Replace `legacy` contracts with tokenized variants.
3. Add a linter or codemod that rejects raw colors in feature code.
4. Add icon-level helpers so Font Awesome usage is consistent across feature teams.
5. Add Storybook stories for every `ready` contract and connect them to visual regression.
6. Generate the context pack automatically from source metadata once coverage is higher.
