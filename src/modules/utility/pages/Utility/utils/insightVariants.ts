import type { UtilityInsightType } from '@/modules/utility/pages/Utility/types';

import { designSystemV2 } from '@/theme/designSystemV2';

const { colors } = designSystemV2;

type VariantKey = UtilityInsightType | 'default';
type VariantStyle = {
  accent: string;
  surface: string;
  badge: { background: string; color: string };
};

export const VARIANT_STYLES: Record<VariantKey, VariantStyle> = {
  success: {
    accent: colors.states.success,
    surface: 'rgba(34, 197, 94, 0.08)',
    badge: {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#15803d',
    },
  },
  warning: {
    accent: '#f59e0b',
    surface: 'rgba(250, 204, 21, 0.08)',
    badge: {
      background: 'rgba(251, 191, 36, 0.18)',
      color: '#92400e',
    },
  },
  critical: {
    accent: '#ef4444',
    surface: 'rgba(248, 113, 113, 0.10)',
    badge: {
      background: 'rgba(248, 113, 113, 0.20)',
      color: '#b91c1c',
    },
  },
  info: {
    accent: colors.states.info,
    surface: 'rgba(2, 132, 199, 0.10)',
    badge: {
      background: 'rgba(2, 132, 199, 0.18)',
      color: '#075985',
    },
  },
  default: {
    accent: '#4f46e5',
    surface: 'rgba(99, 102, 241, 0.10)',
    badge: {
      background: 'rgba(99, 102, 241, 0.18)',
      color: '#4338ca',
    },
  },
};

export const getVariantStyles = (
  type: UtilityInsightType | null | undefined,
): VariantStyle => VARIANT_STYLES[type] ?? VARIANT_STYLES.default;
