/**
 * notificationTheme.js
 * Sistema de tema profesional para el Centro de Notificaciones
 * Este objeto contiene todas las variables de estilo necesarias para mantener
 * una apariencia coherente en el Centro de Notificaciones.
 */

// Colores base del sistema
const baseColors = {
  // Colores primarios
  primary: {
    main: '#1A73E8',
    light: '#4A95F0',
    dark: '#0D5FC2',
    contrast: '#FFFFFF',
  },

  // Colores de estado/alerta
  status: {
    success: '#4CAF50',
    warning: '#FFA500',
    error: '#FF4646',
    info: '#2196F3',
  },

  // Escala de grises
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Colores de fondo
  background: {
    paper: '#FFFFFF',
    default: '#F5F7FA',
    card: '#FFFFFF',
    tooltip: '#616161',
  },

  // Colores para texto
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.60)',
    disabled: 'rgba(0, 0, 0, 0.38)',
    hint: 'rgba(0, 0, 0, 0.38)',
    contrast: '#FFFFFF',
    link: '#1A73E8',
  },

  // Colores para bordes
  border: {
    light: '#EEEEEE',
    main: '#E0E0E0',
    dark: '#BDBDBD',
  },

  // Colores para sombras
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Dimensiones y espaciado
const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  xxl: '3rem', // 48px
};

// Radios de borde
const borderRadius = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '500px',
  circle: '50%',
};

// Tipografía
const typography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

  // Tamaños de fuente
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    xxl: '1.5rem', // 24px
  },

  // Pesos de fuente
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Altura de línea
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Sombras
const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
  md: '0 4px 6px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.12), 0 4px 6px rgba(0, 0, 0, 0.08)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.12), 0 10px 10px rgba(0, 0, 0, 0.08)',
};

// Transiciones
const transitions = {
  quick: 'all 0.2s ease',
  normal: 'all 0.3s ease',
  slow: 'all 0.5s ease',
};

// Z-index
const zIndex = {
  tooltip: 1500,
  modal: 1400,
  dropdown: 1300,
  header: 1200,
  overlay: 1100,
  base: 1,
};

// Paneles específicos
const panels = {
  // Panel de comprobantes fiscales
  fiscalReceipt: {
    icon: '📄',
    borderColor: baseColors.status.warning,
    progressColor: baseColors.status.warning,
    textColor: baseColors.status.warning,
  },

  // Panel de cuentas por cobrar
  accountsReceivable: {
    icon: '📅',
    borderColor: baseColors.status.error,
    progressColor: baseColors.status.error,
    textColor: baseColors.status.error,
    dueSoon: {
      bg: '#FFF6E9',
      text: baseColors.status.warning,
    },
    overdue: {
      bg: '#FFEBEB',
      text: baseColors.status.error,
    },
  },

  // Panel de inventario
  inventory: {
    icon: '📦',
    borderColor: baseColors.status.error,
    status: {
      crítico: {
        bg: '#FFEBEB',
        text: baseColors.status.error,
      },
      bajo: {
        bg: '#FFF6E9',
        text: baseColors.status.warning,
      },
    },
  },

  // Panel de ventas
  sales: {
    icon: '📈',
    borderColor: baseColors.status.success,
    progressColor: baseColors.status.success,
    textColor: baseColors.status.success,
  },

  // Panel de sistema
  system: {
    icon: '🔄',
    borderColor: baseColors.primary.main,
    buttonBg: baseColors.primary.main,
    buttonHover: baseColors.primary.dark,
    badgeBg: '#E8F0FE',
    badgeColor: baseColors.primary.main,
  },
};

// Tema completo para el Centro de Notificaciones
const notificationTheme = {
  colors: baseColors,
  spacing,
  borderRadius,
  typography,
  shadows,
  transitions,
  zIndex,
  panels,

  // Función de ayuda para obtener un tema de panel específico
  getPanelTheme: (panelType) => {
    return panels[panelType] || {};
  },
};

export default notificationTheme;
