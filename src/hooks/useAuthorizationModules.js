import { useSelector } from 'react-redux';

import { SelectSettingCart } from '../features/cart/cartSlice';

/**
 * Hook para verificar qué módulos de autorización están activos
 * @returns {Object} Estado de los módulos de autorización
 */
export const useAuthorizationModules = () => {
  const settings = useSelector(SelectSettingCart) || {};

  const authorizationFlowEnabled = !!settings?.billing?.authorizationFlowEnabled;

  const rawModules = settings?.billing?.enabledAuthorizationModules || {};
  const normalizedModules = {
    invoices: rawModules.invoices ?? true,
    accountsReceivable: rawModules.accountsReceivable ?? rawModules.cashRegister ?? true,
  };

  const enabledModules = {
    ...normalizedModules,
    cashRegister: normalizedModules.accountsReceivable,
  };

  /**
   * Verifica si un módulo específico está activo
   * @param {string} moduleName - Nombre del módulo ('invoices' o 'accountsReceivable')
   * @returns {boolean} True si el módulo está activo
   */
  const normalizeModuleKey = (moduleName) => {
    if (moduleName === 'cashRegister') return 'accountsReceivable';
    return moduleName;
  };

  const isModuleEnabled = (moduleName) => {
    if (!authorizationFlowEnabled) return false;
    const key = normalizeModuleKey(moduleName);
    return normalizedModules[key] !== false;
  };

  /**
   * Verifica si se debe usar PIN para un módulo específico
   * @param {string} moduleName - Nombre del módulo
   * @returns {boolean} True si debe usar PIN
   */
  const shouldUsePinForModule = (moduleName) => {
    return authorizationFlowEnabled && isModuleEnabled(moduleName);
  };

  /**
   * Verifica si hay al menos un módulo activo
   * @returns {boolean} True si hay al menos un módulo activo
   */
  const hasActiveModules = () => {
    return Object.values(normalizedModules).some(v => v === true);
  };

  return {
    // Estado general
    authorizationFlowEnabled,
    enabledModules,
    
    // Funciones de verificación
    isModuleEnabled,
    shouldUsePinForModule,
    hasActiveModules,
    
    // Acceso directo a módulos específicos
    isInvoicesModuleEnabled: isModuleEnabled('invoices'),
    isCashRegisterModuleEnabled: isModuleEnabled('accountsReceivable'),
  };
};
