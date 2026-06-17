import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

export type ValidationStatus = 'error' | 'warning' | 'success' | 'info';

export type ValidationAction = true | 'selectClient';

export type ValidationIcon =
  | 'creditCard'
  | 'exclamation'
  | 'fileText'
  | 'lock'
  | 'user'
  | 'warning';

export type ValidationItem = {
  status: ValidationStatus;
  icon: ValidationIcon;
  title: string;
  message: string;
  priority: number;
  action?: ValidationAction;
};

export type BuildARValidationsInput = {
  isGenericClient: boolean;
  isInvoiceLimitExceeded: boolean;
  isCreditLimitExceeded: boolean;
  creditLimit?: CreditLimitConfig | null;
  activeAccountsReceivableCount: number;
  clientId: string | null;
  invoiceId: string | null;
  hasAccountReceivablePermission: boolean;
  isChangeNegative: boolean;
  abilitiesLoading: boolean;
  creditLimitValue?: number | null;
};

export const buildARValidations = ({
  isGenericClient,
  isInvoiceLimitExceeded,
  isCreditLimitExceeded,
  creditLimit,
  activeAccountsReceivableCount,
  clientId,
  invoiceId,
  hasAccountReceivablePermission,
  isChangeNegative,
  abilitiesLoading,
  creditLimitValue,
}: BuildARValidationsInput): ValidationItem[] => {
  const validations: ValidationItem[] = [];

  if (
    !hasAccountReceivablePermission &&
    isChangeNegative &&
    !abilitiesLoading
  ) {
    validations.push({
      status: 'error',
      icon: 'lock',
      title: 'Acceso Restringido',
      message:
        'No se puede facturar ventas con cambio negativo sin permisos de CxC',
      priority: 0,
    });
  }

  if (isGenericClient && isChangeNegative) {
    validations.push({
      status: 'error',
      icon: 'user',
      title: 'No se puede agregar a cuenta por cobrar con cliente genérico',
      message:
        'Selecciona un cliente específico para continuar con la cuenta por cobrar',
      priority: 1,
      action: 'selectClient',
    });
  }

  if (!clientId && !invoiceId) {
    validations.push({
      status: 'error',
      icon: 'exclamation',
      title: 'Información incompleta',
      message: 'Se requiere cliente para CxC',
      priority: 2,
    });
  }

  if (
    !isGenericClient &&
    !creditLimit?.creditLimit?.status &&
    !creditLimit?.invoice?.status
  ) {
    validations.push({
      status: 'warning',
      icon: 'warning',
      title: 'Configuración pendiente',
      message: 'Define límites de crédito y facturas',
      action: true,
      priority: 3,
    });
  }

  if (isCreditLimitExceeded) {
    const newBalanceDisplay =
      creditLimitValue != null ? creditLimitValue.toFixed(2) : '0.00';
    const limitDisplay = creditLimit?.creditLimit?.value || 0;

    validations.push({
      status: 'warning',
      icon: 'creditCard',
      title: 'Límite de crédito excedido',
      message: `Nuevo balance: $${newBalanceDisplay} (límite: $${limitDisplay})`,
      action: true,
      priority: 4,
    });
  }

  if (isInvoiceLimitExceeded) {
    validations.push({
      status: 'warning',
      icon: 'fileText',
      title: 'Límite de facturas alcanzado',
      message: `${activeAccountsReceivableCount + 1} / ${creditLimit?.invoice?.value} facturas (incluyendo esta)`,
      action: true,
      priority: 5,
    });
  }

  return validations.sort((a, b) => a.priority - b.priority);
};
