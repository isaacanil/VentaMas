import { Select, Typography } from 'antd';
import styled from 'styled-components';

import type { BankAccount } from '@/types/accounting';
import { buildBankAccountLabel } from '@/utils/accounting/bankAccounts';
import {
  normalizeBankPaymentPolicy,
  type BankPaymentMethodCode,
  type BankPaymentPolicy,
} from '@/utils/payments/bankPaymentPolicy';

const { Text } = Typography;

const METHOD_COPY: Record<
  BankPaymentMethodCode,
  { title: string; description: string }
> = {
  card: {
    title: 'Tarjeta',
    description:
      'Asigna una cuenta fija solo si quieres que tarjeta opere siempre contra la misma cuenta.',
  },
  transfer: {
    title: 'Transferencia',
    description:
      'Asigna una cuenta fija solo si quieres que las transferencias usen siempre la misma cuenta.',
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
  const activeBankAccountsCount = activeBankAccountOptions.length;
  const activeBankAccountLabels = new Map(
    activeBankAccountOptions.map((option) => [option.value, option.label]),
  );

  const handleMethodAccountChange = (
    method: BankPaymentMethodCode,
    value: string | undefined,
  ) => {
    onChange({
      ...normalizedPolicy,
      [method]: {
        selectionMode: typeof value === 'string' ? 'default' : 'manual',
        defaultBankAccountId: typeof value === 'string' ? value : null,
      },
    });
  };

  const handleFallbackAccountChange = (value: string | undefined) => {
    onChange({
      ...normalizedPolicy,
      defaultBankAccountId: typeof value === 'string' ? value : null,
    });
  };

  return (
    <Section>
      <Header>
        <HeaderTitle>Métodos bancarios</HeaderTitle>
        <HeaderDescription>
          La prioridad vive en cada método. La cuenta de respaldo es opcional y
          solo se usa cuando un método no tenga cuenta fija.
        </HeaderDescription>
      </Header>

      <Content>
        <MethodGrid>
          {(['card', 'transfer'] as const).map((method) => {
            const methodConfig = normalizedPolicy[method];
            const selectedAccountLabel =
              methodConfig.defaultBankAccountId &&
              activeBankAccountLabels.has(methodConfig.defaultBankAccountId)
                ? activeBankAccountLabels.get(methodConfig.defaultBankAccountId)
                : null;

            return (
              <MethodCard key={method}>
                <CardHeader>
                  <CardTitle>{METHOD_COPY[method].title}</CardTitle>
                </CardHeader>
                <CardDescription>{METHOD_COPY[method].description}</CardDescription>

                <FieldBlock>
                  <FieldLabel>Cuenta fija del método</FieldLabel>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder={
                      activeBankAccountOptions.length
                        ? 'Sin cuenta fija'
                        : 'No hay cuentas activas'
                    }
                    options={activeBankAccountOptions}
                    value={methodConfig.defaultBankAccountId ?? undefined}
                    onChange={(value) => handleMethodAccountChange(method, value)}
                    disabled={!activeBankAccountOptions.length}
                  />
                  <FieldHint>
                    {selectedAccountLabel
                      ? `Esta cuenta tendrá prioridad para ${METHOD_COPY[method].title.toLowerCase()}.`
                      : normalizedPolicy.defaultBankAccountId &&
                          activeBankAccountLabels.has(
                            normalizedPolicy.defaultBankAccountId,
                          )
                        ? `Sin cuenta fija, este método caerá en la cuenta de respaldo: ${activeBankAccountLabels.get(normalizedPolicy.defaultBankAccountId)}.`
                        : activeBankAccountsCount === 1
                          ? 'Sin cuenta fija, se resolverá automáticamente con la única cuenta bancaria activa.'
                        : 'Sin cuenta fija, el flujo pedirá selección manual cuando aplique.'}
                  </FieldHint>
                </FieldBlock>
              </MethodCard>
            );
          })}
        </MethodGrid>

        <FallbackSection>
          <CardHeader>
            <CardTitle>Cuenta de respaldo</CardTitle>
          </CardHeader>
          <CardDescription>
            Opcional. Solo entra cuando un método no tenga cuenta fija.
          </CardDescription>
          <FieldBlock>
            <FieldLabel>Cuenta bancaria</FieldLabel>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={
                activeBankAccountOptions.length
                  ? 'Sin cuenta de respaldo'
                  : 'No hay cuentas activas'
              }
              options={activeBankAccountOptions}
              value={normalizedPolicy.defaultBankAccountId ?? undefined}
              onChange={handleFallbackAccountChange}
              disabled={!activeBankAccountOptions.length}
            />
            <FieldHint>
              {normalizedPolicy.defaultBankAccountId &&
              activeBankAccountLabels.has(normalizedPolicy.defaultBankAccountId)
                ? `Respaldo actual: ${activeBankAccountLabels.get(normalizedPolicy.defaultBankAccountId)}.`
                : activeBankAccountsCount === 1
                  ? 'Con una sola cuenta activa, el sistema puede resolverla automáticamente sin guardar un respaldo.'
                : 'Puedes dejarla vacía si prefieres que el usuario elija la cuenta en cada flujo.'}
            </FieldHint>
          </FieldBlock>
        </FallbackSection>
      </Content>
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
  gap: var(--ds-space-1);
  padding: var(--ds-space-4) var(--ds-space-5);
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

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4) var(--ds-space-5);
`;

const FallbackSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const MethodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-4);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const MethodCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
`;

const CardTitle = styled(Text)`
  && {
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-primary);
  }
`;

const CardDescription = styled.span`
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const FieldBlock = styled.div`
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
