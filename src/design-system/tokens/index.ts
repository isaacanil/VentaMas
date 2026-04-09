export { colors } from './colors';
export { semantic } from './semantic';
export { typography } from './typography';
export { spacing } from './spacing';
export { radius } from './radius';
export { shadows } from './shadows';
export { borders } from './borders';
export { scrollbar } from './scrollbar';
export { zIndex } from './zIndex';

import { colors } from './colors';
import { semantic } from './semantic';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { borders } from './borders';
import { scrollbar } from './scrollbar';
import { zIndex } from './zIndex';

export const tokens = {
  colors,
  semantic,
  typography,
  spacing,
  radius,
  shadows,
  borders,
  scrollbar,
  zIndex,
} as const;
