import { Select, Switch, Typography } from 'antd';
import styled from 'styled-components';

import type { BankAccount } from '@/types/accounting';
import { buildBankAccountLabel } from '@/utils/accounting/bankAccounts';
import {
  BANK_PAYMENT_MODULE_KEYS,
  getBankPaymentModuleOverride,
  normalizeBankPaymentPolicy,
  updateBankPaymentModuleOverride,
  type BankPaymentModuleKey,
  type BankPaymentPolicy,
} from '@/utils/payments/bankPaymentPolicy';

const { Text } = Typography;

const MODULE_COPY: Record<
  BankPaymentModuleKey,
  { title: string; description: string }
> = {
  sales: {
    title: 'Ventas',
    description:
      'Cobros de facturas y ventas nuevas que entren por tarjeta o transferencia.',
  },
  expenses: {
    title: 'Gastos',
    description: 'Pagos de gastos registrados con origen bancario.',
  },
  accountsReceivable: {
    title: 'Cuentas por cobrar',
    description: 'Cobros y abonos de clientes registrados fuera de la venta.',
  },
  purchases: {
    title: 'Compras',
    description: 'Pagos a suplidores registrados desde el módulo de compras.',
  },
};

interface BankPaymentPolicySectionProps {
  bankAccounts: BankAccount[];
  policy: BankPaymentPolicy;
  onChange: (policy: BankPaymentPolicy) => void;
}

export const BankPaymentPolicySection = ({
  bankAccounts,
  policy,
  onChange,
}: BankPaymentPolicySectionProps) => {
  const normalizedPolicy = normalizeBankPaymentPolicy(policy);
  const activeBankAccountOptions = bankAccounts
    .filter((bankAccount) => bankAccount.status === 'active')
    .map((bankAccount) => ({
      value: bankAccount.id,
      label: buildBankAccountLabel(bankAccount),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
  const activeBankAccountLabels = new Map(
    activeBankAccountOptions.map((option) => [option.value, option.label]),
  );
  const activeBankAccountIds = new Set(
    activeBankAccountOptions.map((option) => option.value),
  );
  const canSelectDifferentAccounts = activeBankAccountOptions.length > 1;
  const implicitDefaultLabel =
    activeBankAccountOptions.length === 1
      ? (activeBankAccountOptions[0]?.label ?? null)
      : null;
  const effectiveDefaultLabel =
    normalizedPolicy.defaultBankAccountId &&
    activeBankAccountLabels.has(normalizedPolicy.defaultBankAccountId)
      ? (activeBankAccountLabels.get(normalizedPolicy.defaultBankAccountId) ??
        null)
      : implicitDefaultLabel;
  const effectiveDefaultId =
    normalizedPolicy.defaultBankAccountId &&
    activeBankAccountIds.has(normalizedPolicy.defaultBankAccountId)
      ? normalizedPolicy.defaultBankAccountId
      : activeBankAccountOptions.length === 1
        ? (activeBankAccountOptions[0]?.value ?? null)
        : null;

  const handleModuleChange = (
    moduleKey: BankPaymentModuleKey,
    bankAccountId: string | null,
  ) => {
    onChange(
      updateBankPaymentModuleOverride({
        policy,
        moduleKey,
        patch: {
          enabled: true,
          bankAccountId,
        },
      }),
    );
  };

  const handleModuleEnabledChange = (
    moduleKey: BankPaymentModuleKey,
    enabled: boolean,
  ) => {
    onChange(
      updateBankPaymentModuleOverride({
        policy,
        moduleKey,
        patch: { enabled },
      }),
    );
  };

  return (
    <Section>
      <Header>
        <HeaderTitle>Uso por módulo</HeaderTitle>
      </Header>

      <ModuleList>
        {BANK_PAYMENT_MODULE_KEYS.map((moduleKey) => {
          const moduleOverride = getBankPaymentModuleOverride(
            policy,
            moduleKey,
          );
          const configuredModuleBankAccountId = moduleOverride.bankAccountId;
          const isModuleOverrideEnabled = moduleOverride.enabled;
          const hasAvailableModuleAssignment = Boolean(
            configuredModuleBankAccountId &&
            activeBankAccountIds.has(configuredModuleBankAccountId),
          );
          const explicitModuleLabel =
            configuredModuleBankAccountId &&
            activeBankAccountLabels.has(configuredModuleBankAccountId)
              ? (activeBankAccountLabels.get(configuredModuleBankAccountId) ??
                null)
              : null;

          return (
            <ModuleRow key={moduleKey}>
              <ModuleHeader>
                <ModuleCopy>
                  <ModuleTitleRow>
                    <ModuleTitle>{MODULE_COPY[moduleKey].title}</ModuleTitle>
                  </ModuleTitleRow>
                  <ModuleDescription>
                    {MODULE_COPY[moduleKey].description}
                  </ModuleDescription>
                </ModuleCopy>

                <Switch
                  checked={isModuleOverrideEnabled}
                  disabled={!activeBankAccountOptions.length}
                  onChange={(checked) =>
                    handleModuleEnabledChange(moduleKey, checked)
                  }
                />
              </ModuleHeader>

              {isModuleOverrideEnabled ? (
                <ModuleAssignment>
                  <FieldLabel>Cuenta bancaria</FieldLabel>
                  <Select
                    allowClear={hasAvailableModuleAssignment}
                    showSearch
                    optionFilterProp="label"
                    placeholder={
                      activeBankAccountOptions.length
                        ? 'Selecciona una cuenta'
                        : 'No hay cuentas activas'
                    }
                    options={activeBankAccountOptions}
                    value={
                      hasAvailableModuleAssignment
                        ? (configuredModuleBankAccountId ?? undefined)
                        : (effectiveDefaultId ?? undefined)
                    }
                    onChange={(value) =>
                      handleModuleChange(
                        moduleKey,
                        typeof value === 'string' ? value : null,
                      )
                    }
                    disabled={
                      !activeBankAccountOptions.length ||
                      !canSelectDifferentAccounts
                    }
                  />

                  {hasAvailableModuleAssignment && explicitModuleLabel ? (
                    <FieldHint>
                      Usa {explicitModuleLabel}. Borra la selección para volver
                      a la predeterminada.
                    </FieldHint>
                  ) : null}
                </ModuleAssignment>
              ) : null}

              {configuredModuleBankAccountId &&
              !hasAvailableModuleAssignment ? (
                <InlineNote $tone="warning">
                  La cuenta guardada para este módulo ya no está activa.
                </InlineNote>
              ) : null}

              {isModuleOverrideEnabled &&
              !hasAvailableModuleAssignment &&
              !effectiveDefaultLabel &&
              activeBankAccountOptions.length > 1 ? (
                <InlineNote $tone="warning">
                  Este módulo está activo, pero todavía no tiene una cuenta
                  efectiva.
                </InlineNote>
              ) : null}
            </ModuleRow>
          );
        })}
      </ModuleList>
    </Section>
  );
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  height: 52px;
  padding: 0 var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-default);
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const HeaderDescription = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const ModuleList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--ds-space-3);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--ds-space-4) var(--ds-space-5);
`;

const ModuleRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const ModuleHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const ModuleCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
  flex: 1;
`;

const ModuleTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const ModuleTitle = styled(Text)`
  && {
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-primary);
  }
`;

const ModuleDescription = styled.span`
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const ModuleAssignment = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
`;

const FieldLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const FieldHint = styled.span`
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const InlineNote = styled.div<{ $tone?: 'warning' }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3);
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'warning'
        ? 'var(--ds-color-state-warning)'
        : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-lg);
  background: ${({ $tone }) =>
    $tone === 'warning'
      ? 'var(--ds-color-state-warningSubtle)'
      : 'var(--ds-color-bg-surface)'};
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  color: ${({ $tone }) =>
    $tone === 'warning'
      ? 'var(--ds-color-state-warningText)'
      : 'var(--ds-color-text-secondary)'};
`;
