import { colors } from './colors';

export const semantic = {
  color: {
    bg: {
      page: colors.gray[50],
      surface: colors.white,
      subtle: colors.gray[100],
      muted: colors.gray[200],
      // Dropdowns, popovers, tooltips — por encima de surface
      elevated: colors.white,
      // Fila alternada en tablas de datos (zebra) — crítico en ERP con 50+ filas
      tableRowAlt: colors.gray[50],
    },

    text: {
      primary: colors.gray[900],
      secondary: colors.gray[600],
      muted: colors.gray[500],
      // Campos read-only y contenido deshabilitado
      disabled: colors.gray[400],
      inverse: colors.white,
      link: colors.blue[600],
    },

    action: {
      primary: colors.blue[600],
      primaryHover: colors.blue[700],
      primaryActive: colors.blue[800],
      primarySubtle: colors.blue[50],
      // texto/ícono encima de cada fondo de acción (M3: on-* pairing)
      onPrimary: colors.white,
      onPrimarySubtle: colors.blue[600],
    },

    interactive: {
      disabled: {
        bg: colors.gray[100],
        text: colors.gray[400],
        border: colors.gray[200],
      },
      selected: {
        bg: colors.blue[50],
        text: colors.blue[600],
        border: colors.blue[500],
      },
      hover: {
        // Opacidad relativa: funciona sobre cualquier surface (M3 state layer ~8%)
        bg: 'rgba(0,0,0,0.04)',
      },
      pressed: {
        // M3 state layer ~12% — útil en tablas/rows de ERP
        bg: 'rgba(0,0,0,0.08)',
      },
      // Estados de fila en tablas de datos — validación, selección
      table: {
        rowSelected: { bg: colors.blue[50],   border: colors.blue[300]  },
        rowError:    { bg: colors.red[50],    border: colors.red[300]   },
        rowWarning:  { bg: colors.amber[50],  border: colors.amber[300] },
      },
    },

    state: {
      success: colors.green[600],
      successSubtle: colors.green[100],
      successText: colors.green[700],
      // Texto/ícono sobre fondo `state.success` relleno (badge "Pagado")
      onSuccess: colors.white,
      danger: colors.red[600],
      dangerSubtle: colors.red[100],
      dangerText: colors.red[700],
      // Texto/ícono sobre fondo `state.danger` relleno (badge "Vencido")
      onDanger: colors.white,
      warning: colors.amber[600],
      warningSubtle: colors.amber[100],
      warningText: colors.amber[700],
      // Texto/ícono sobre fondo `state.warning` relleno (badge "Pendiente")
      onWarning: colors.gray[900],
      info: colors.cyan[600],
      infoSubtle: colors.cyan[100],
      infoText: colors.cyan[700],
      // Texto/ícono sobre fondo `state.info` relleno
      onInfo: colors.white,
    },

    border: {
      default: colors.gray[200],
      subtle: colors.gray[100],
      strong: colors.gray[300],
      focus: colors.blue[500],
    },

    overlay: {
      subtle: 'rgba(17, 24, 39, 0.1)',
      mask: 'rgba(17, 24, 39, 0.45)',
    },

    nav: {
      bg: colors.blue[600],
      text: colors.white,
      hover: 'rgba(255,255,255,0.15)',
    },
  },
} as const;
