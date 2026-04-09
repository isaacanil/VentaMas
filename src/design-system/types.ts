import type { tokens } from './tokens';

export type Tokens = typeof tokens;

export type ColorPrimitive = typeof tokens.colors;
export type SemanticColors = typeof tokens.semantic.color;
export type Typography = typeof tokens.typography;
export type Spacing = typeof tokens.spacing;
export type Radius = typeof tokens.radius;
export type Shadows = typeof tokens.shadows;
export type Borders = typeof tokens.borders;
export type Scrollbar = typeof tokens.scrollbar;

export type SpacingKey = keyof Spacing;
export type RadiusKey = keyof Radius;
export type ShadowKey = keyof Shadows;
export type FontSizeKey = keyof Typography['fontSize'];
export type FontWeightKey = keyof Typography['fontWeight'];
export type TypeScale = typeof tokens.typography.typeScale;
export type TypeScaleKey = keyof TypeScale;
export type ZIndex = typeof tokens.zIndex;
export type ZIndexKey = keyof ZIndex;
export type * from './contracts/types';
