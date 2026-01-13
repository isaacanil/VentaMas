/**
 * Utilidades para formateo de información del sistema
 */
type UserInfo = {
  displayName?: string;
  email?: string;
  uid?: string;
  role?: string;
  businessId?: string;
  emailVerified?: boolean;
  creationTime?: string | number | Date;
  lastSignInTime?: string | number | Date;
};

type SystemStateInfo = {
  isTestMode?: boolean;
  isTemporaryMode?: boolean;
  originalBusinessId?: string | null;
  isTemporaryRoleMode?: boolean;
  originalRole?: string | null;
  reactScanLoaded?: boolean;
};

type DebugInfo = {
  debugMode?: boolean;
  systemState?: SystemStateInfo | null;
};

type TestModeInfo = {
  isTestMode?: boolean;
  systemState?: SystemStateInfo | null;
};

type SystemInfo = {
  user?: UserInfo | null;
  debugMode?: boolean;
  systemState?: SystemStateInfo | null;
  environment?: string;
  version?: string;
};

type PerformanceMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

type PerformanceTiming = {
  domContentLoadedEventEnd: number;
  navigationStart: number;
  loadEventEnd: number;
};

type PerformanceNavigation = {
  type: number | string;
  redirectCount: number;
};

type PerformanceInfo = {
  memory?: PerformanceMemory | null;
  timing?: PerformanceTiming | null;
  navigation?: PerformanceNavigation | null;
};

type BrowserInfo = {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  browser: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
};

export class SystemInfoUtils {
  /**
   * Formatea información del usuario de manera consistente
   * @param {Object} user - Objeto usuario
   * @returns {string} - Información del usuario formateada
   */
  static formatUserInfo(user: UserInfo | null | undefined) {
    if (!user) {
      return 'Usuario: No autenticado';
    }

    const info = [];
    info.push('=== INFORMACIÓN DEL USUARIO ===');

    if (user.displayName) {
      info.push(`Nombre: ${user.displayName}`);
    }

    if (user.email) {
      info.push(`Email: ${user.email}`);
    }

    if (user.uid) {
      info.push(`UID: ${user.uid}`);
    }

    if (user.role) {
      info.push(`Rol: ${user.role}`);
    }

    if (user.businessId) {
      info.push(`Business ID: ${user.businessId}`);
    }

    if (user.emailVerified !== undefined) {
      info.push(`Email Verificado: ${user.emailVerified ? 'Sí' : 'No'}`);
    }

    if (user.creationTime) {
      info.push(`Creado: ${new Date(user.creationTime).toLocaleString()}`);
    }

    if (user.lastSignInTime) {
      info.push(
        `Último acceso: ${new Date(user.lastSignInTime).toLocaleString()}`,
      );
    }

    return info.join('\n');
  }

  /**
   * Formatea información de debug de manera consistente
   * @param {Object} debugInfo - Información de debug
   * @returns {string} - Información de debug formateada
   */
  static formatDebugInfo(debugInfo: DebugInfo) {
    const { debugMode, systemState } = debugInfo;

    const info = [];
    info.push('=== INFORMACIÓN DE DEBUG ===');
    info.push(`Modo Debug: ${debugMode ? 'ACTIVADO' : 'DESACTIVADO'}`);

    if (systemState) {
      info.push('');
      info.push('Estado del Sistema:');

      if (systemState.isTestMode !== undefined) {
        info.push(
          `  - Modo Test: ${systemState.isTestMode ? 'ACTIVADO' : 'DESACTIVADO'}`,
        );
      }

      if (systemState.isTemporaryMode !== undefined) {
        info.push(
          `  - Modo Temporal: ${systemState.isTemporaryMode ? 'ACTIVADO' : 'DESACTIVADO'}`,
        );
      }

      if (systemState.originalBusinessId) {
        info.push(
          `  - Business ID Original: ${systemState.originalBusinessId}`,
        );
      }

      if (systemState.isTemporaryRoleMode !== undefined) {
        info.push(
          `  - Modo Rol Temporal: ${systemState.isTemporaryRoleMode ? 'ACTIVADO' : 'DESACTIVADO'}`,
        );
      }

      if (systemState.originalRole) {
        info.push(`  - Rol Original: ${systemState.originalRole}`);
      }

      if (systemState.reactScanLoaded !== undefined) {
        info.push(
          `  - React Scan: ${systemState.reactScanLoaded ? 'CARGADO' : 'NO CARGADO'}`,
        );
      }
    }

    return info.join('\n');
  }

  /**
   * Formatea información del modo test de manera consistente
   * @param {Object} testInfo - Información del modo test
   * @returns {string} - Información del modo test formateada
   */
  static formatTestModeInfo(testInfo: TestModeInfo) {
    const { isTestMode, systemState } = testInfo;

    const info = [];
    info.push('=== MODO TEST ===');
    info.push(`Estado: ${isTestMode ? 'ACTIVADO' : 'DESACTIVADO'}`);

    if (isTestMode && systemState) {
      info.push('');
      info.push('Configuración activa:');

      if (systemState.isTemporaryMode) {
        info.push(`  - Modo temporal activo`);
      }

      if (systemState.originalBusinessId) {
        info.push(
          `  - Business ID guardado: ${systemState.originalBusinessId}`,
        );
      }

      if (systemState.isTemporaryRoleMode) {
        info.push(`  - Modo rol temporal activo`);
      }

      if (systemState.originalRole) {
        info.push(`  - Rol original: ${systemState.originalRole}`);
      }
    }

    if (isTestMode) {
      info.push('');
      info.push('Comandos disponibles en modo test:');
      info.push('  - testmode off: Desactivar modo test');
      info.push('  - testmode status: Ver estado actual');
    } else {
      info.push('');
      info.push('Usa "testmode on" para activar el modo test');
    }

    return info.join('\n');
  }

  /**
   * Formatea información del sistema completa
   * @param {Object} systemInfo - Información completa del sistema
   * @returns {string} - Información del sistema formateada
   */
  static formatSystemInfo(systemInfo: SystemInfo) {
    const { user, debugMode, systemState, environment, version } = systemInfo;

    const info = [];
    info.push('=== INFORMACIÓN DEL SISTEMA ===');

    // Información de versión y entorno
    if (version) {
      info.push(`Versión: ${version}`);
    }

    if (environment) {
      info.push(`Entorno: ${environment}`);
    }

    info.push('');

    // Información del usuario
    if (user) {
      const userInfo = this.formatUserInfo(user);
      info.push(userInfo);
      info.push('');
    }

    // Información de debug
    const debugInfo = this.formatDebugInfo({ debugMode, systemState });
    info.push(debugInfo);

    return info.join('\n');
  }

  /**
   * Formatea información de performance del sistema
   * @param {Object} performanceInfo - Información de performance
   * @returns {string} - Información de performance formateada
   */
  static formatPerformanceInfo(performanceInfo: PerformanceInfo) {
    const { memory, timing, navigation } = performanceInfo;

    const info = [];
    info.push('=== INFORMACIÓN DE PERFORMANCE ===');

    if (memory) {
      info.push('Memoria:');
      info.push(
        `  - Usada: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      );
      info.push(
        `  - Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      );
      info.push(
        `  - Límite: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      );
    }

    if (timing) {
      info.push('');
      info.push('Timing:');
      info.push(
        `  - Carga DOM: ${timing.domContentLoadedEventEnd - timing.navigationStart} ms`,
      );
      info.push(
        `  - Carga completa: ${timing.loadEventEnd - timing.navigationStart} ms`,
      );
    }

    if (navigation) {
      info.push('');
      info.push('Navegación:');
      info.push(`  - Tipo: ${navigation.type}`);
      info.push(`  - Redirecciones: ${navigation.redirectCount}`);
    }

    return info.join('\n');
  }

  /**
   * Obtiene información del navegador
   * @returns {Object} - Información del navegador
   */
  static getBrowserInfo(): BrowserInfo {
    const ua = navigator.userAgent;
    const info = {
      userAgent: ua,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      browser: '',
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
    };

    // Detectar navegador
    if (ua.includes('Chrome')) info.browser = 'Chrome';
    else if (ua.includes('Firefox')) info.browser = 'Firefox';
    else if (ua.includes('Safari')) info.browser = 'Safari';
    else if (ua.includes('Edge')) info.browser = 'Edge';
    else info.browser = 'Desconocido';

    return info;
  }

  /**
   * Formatea información del navegador
   * @returns {string} - Información del navegador formateada
   */
  static formatBrowserInfo() {
    const info = this.getBrowserInfo();

    const lines = [];
    lines.push('=== INFORMACIÓN DEL NAVEGADOR ===');
    lines.push(`Navegador: ${info.browser}`);
    lines.push(`Plataforma: ${info.platform}`);
    lines.push(`Idioma: ${info.language}`);
    lines.push(
      `Cookies: ${info.cookieEnabled ? 'Habilitadas' : 'Deshabilitadas'}`,
    );
    lines.push(`En línea: ${info.onLine ? 'Sí' : 'No'}`);
    lines.push(
      `Pantalla: ${info.screen.width}x${info.screen.height} (${info.screen.colorDepth} bits)`,
    );

    return lines.join('\n');
  }
}

export default SystemInfoUtils;
