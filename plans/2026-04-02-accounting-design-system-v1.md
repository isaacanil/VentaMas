# Accounting Design System V1

## Scope

Base visual para:

- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig`
- `src/modules/accounting/pages/AccountingWorkspace`

Se define primero en contabilidad porque:

Se define primero en contabilidad porque:

- es una zona nueva con baja deuda visual heredada;
- concentra flujos densos y operativos;
- sirvio como piloto antes de expandirse al resto de `settings`;
- ahora tambien sirve como base para alinear `/contabilidad` con `settings/accounting`.

## Principles

- Semántica antes que apariencia: los componentes consumen `--ds-*`, no hex ni paletas primitivas.
- Densidad útil: layouts compactos, pero sin colapsar targets interactivos.
- Jerarquía sobria: superficies, bordes y tipografía hacen el trabajo; no se depende de elevación decorativa.
- Estado explícito: `hover`, `selected`, `disabled`, `warning`, `success` y `focus-visible` deben existir de forma consistente.
- Reutilización local primero: los patrones repetidos de contabilidad se consolidan localmente antes de moverlos al design system global.

## Core Tokens

- `color.bg.page|surface|subtle|muted`
- `color.text.primary|secondary|muted|inverse|link`
- `color.border.default|subtle|strong|focus`
- `color.interactive.hover|pressed|selected|disabled`
- `color.state.success|warning|danger|info` y sus variantes `Subtle` y `Text`
- `font-size`, `font-weight`, `line-height`, `space`, `radius`

## Local Primitives

Archivo base:
`src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/system/accountingPrimitives.ts`

Primitives v1:

- `accountingPanelSurfaceStyles`
- `accountingPanelHeaderStyles`
- `accountingHeaderCopyStyles`
- `accountingTitleStyles`
- `accountingDescriptionStyles`
- `accountingStatValueStyles`
- `accountingStatLabelStyles`
- `accountingCompactControlStyles`
- `accountingFocusRingStyles`
- `accountingEmptyStateStyles`
- `accountingLayout`

## Surface Patterns

Patrones ya consolidados en esta fase:

- `workspace shell` con header, tabs, toolbar y body
- `list + inspector`
- `explorer + inspector`
- `mobile drawers` para contexto secundario y detalle
- `summary strip` / metric row sobria

## Interaction Rules

- Todo botón custom o fila seleccionable debe tener `:focus-visible`.
- Los controles compactos usan un tamaño mínimo visual de `32px`.
- Las filas seleccionables mantienen contraste por `selected bg + selected border`, no por sombra.
- Los estados de éxito y advertencia se usan para estado operativo, no para estructura base del layout.

## Expansion Rules

- Si un patrón se repite en 3 o más componentes de contabilidad, se consolida en `components/system`.
- Si un token local termina siendo útil fuera de contabilidad, entonces se promueve a `src/design-system`.
- No mezclar `designSystemV2` y `--ds-*` dentro de la misma pantalla nueva.
- No introducir tamaños mágicos nuevos si ya existe un token o primitive equivalente.
- Si `/contabilidad` y `settings/accounting` convergen en el mismo patrón operativo, tratarlo como base reusable del dominio contable y no como excepción local.
