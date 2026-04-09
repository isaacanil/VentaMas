import type { ThemeConfig } from 'antd';
import { semantic } from './tokens/semantic';
import { typography } from './tokens/typography';
import { radius } from './tokens/radius';
import { shadows } from './tokens/shadows';

export const antTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: semantic.color.action.primary,
    colorSuccess: semantic.color.state.success,
    colorWarning: semantic.color.state.warning,
    colorError: semantic.color.state.danger,
    colorInfo: semantic.color.state.info,
    colorBgContainer: semantic.color.bg.surface,
    colorBgElevated: semantic.color.bg.elevated,
    colorBgLayout: semantic.color.bg.page,
    colorText: semantic.color.text.primary,
    colorTextSecondary: semantic.color.text.secondary,
    colorTextDisabled: semantic.color.text.disabled,
    colorBorder: semantic.color.border.default,
    colorBorderSecondary: semantic.color.border.subtle,
    colorLink: semantic.color.text.link,
    // Fondo de filas alternadas en Table (zebra striping)
    colorFillAlter: semantic.color.bg.tableRowAlt,

    // Typography
    fontFamily: typography.fontFamily.base,
    fontSize: 14,
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 18,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    fontSizeSM: 13,
    fontSizeLG: 16,
    lineHeight: 1.5,

    // Spacing
    sizeStep: 4,
    sizeUnit: 4,

    // Radius
    borderRadius: parseInt(radius.md),
    borderRadiusLG: parseInt(radius.lg),
    borderRadiusSM: parseInt(radius.sm),
    borderRadiusXS: 2,

    // Shadows
    boxShadow: shadows.sm,
    boxShadowSecondary: shadows.md,

    // Density — ERP usa forms y tablas densas; altura base compacta
    // default Ant: 32px. Reducimos a 28px para ganar densidad sin sacrificar usabilidad.
    controlHeight: 28,
    controlHeightSM: 22,
    controlHeightLG: 36,
  },
};
