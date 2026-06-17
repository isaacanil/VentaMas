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
const FOLLOW_FALLBACK_VALUE = '__fallback__';

const METHOD_COPY: Record<
  BankPaymentMethodCode,
  { title: string }
> = {
  card: {
    title: 'Tarjeta',
  },
  transfer: {
    title: 'Transferencia',
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
  const fallbackAccountLabel =
    normalizedPolicy.defaultBankAccountId &&
    activeBankAccountLabels.has(normalizedPolicy.defaultBankAccountId)
      ? activeBankAccountLabels.get(normalizedPolicy.defaultBankAccountId)
      : null;
  const fallbackOptionLabel = fallbackAccountLabel
    ? `Sigue cuenta por defecto (${fallbackAccountLabel})`
    : activeBankAccountsCount === 1
      ? 'Sigue cuenta por defecto (única cuenta activa)'
      : 'Sigue cuenta por defecto';
  const methodAccountOptions = activeBankAccountOptions.length
    ? [
        {
          value: FOLLOW_FALLBACK_VALUE,
          label: fallbackOptionLabel,
        },
        ...activeBankAccountOptions,
      ]
    : [];

  const handleMethodAccountChange = (
    method: BankPaymentMethodCode,
    value: string | undefined,
  ) => {
    onChange({
      ...normalizedPolicy,
      [method]: {
        selectionMode:
          typeof value === 'string' && value !== FOLLOW_FALLBACK_VALUE
            ? 'default'
            : 'manual',
        defaultBankAccountId:
          typeof value === 'string' && value !== FOLLOW_FALLBACK_VALUE
            ? value
            : null,
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
        <HeaderTitle>Métodos de pago y liquidación</HeaderTitle>
        <HeaderDescription>
          Configura dónde se recibirá el dinero de cada canal de venta.
        </HeaderDescription>
      </Header>

      <Content>
        <FallbackSection>
          <SectionEyebrow>Configuración global</SectionEyebrow>
          <SectionHeader>
            <CardTitle>Cuenta por defecto</CardTitle>
            <FallbackBadge>Respaldo</FallbackBadge>
          </SectionHeader>
          <SectionDescription>
            Se usará para todos los métodos que no tengan una cuenta específica
            asignada.
          </SectionDescription>
          <FieldBlock>
            <FieldLabel>Cuenta bancaria</FieldLabel>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={
                activeBankAccountOptions.length
                  ? 'Selecciona una cuenta por defecto'
                  : 'No hay cuentas activas'
              }
              options={activeBankAccountOptions}
              value={normalizedPolicy.defaultBankAccountId ?? undefined}
              onChange={handleFallbackAccountChange}
              disabled={!activeBankAccountOptions.length}
            />
          </FieldBlock>
        </FallbackSection>

        <MethodSection>
          <SectionEyebrow>Excepciones por método</SectionEyebrow>
          <SectionDescription>
            Asigna una cuenta distinta solo cuando ese canal liquide diferente.
          </SectionDescription>
        </MethodSection>

        <MethodGrid>
          {(['card', 'transfer'] as const).map((method) => {
            const methodConfig = normalizedPolicy[method];
            const usesSpecificAccount =
              Boolean(methodConfig.defaultBankAccountId) &&
              activeBankAccountLabels.has(methodConfig.defaultBankAccountId);

            return (
              <MethodCard key={method}>
                <SectionHeader>
                  <CardTitle>{METHOD_COPY[method].title}</CardTitle>
                  <MethodState $isSpecific={usesSpecificAccount}>
                    {usesSpecificAccount ? 'Cuenta específica' : 'Usa respaldo'}
                  </MethodState>
                </SectionHeader>

                <FieldBlock>
                  <FieldLabel>Destino</FieldLabel>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder={
                      activeBankAccountOptions.length
                        ? 'Selecciona una configuración'
                        : 'No hay cuentas activas'
                    }
                    options={methodAccountOptions}
                    value={
                      activeBankAccountOptions.length
                        ? (methodConfig.defaultBankAccountId ??
                          FOLLOW_FALLBACK_VALUE)
                        : undefined
                    }
                    onChange={(value) => handleMethodAccountChange(method, value)}
                    disabled={!activeBankAccountOptions.length}
                  />
                </FieldBlock>
              </MethodCard>
            );
          })}
        </MethodGrid>
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
  border: 1px solid var(--ds-color-border-strong);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
`;

const MethodSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
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
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const SectionHeader = styled.div`
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

const SectionEyebrow = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ds-color-text-secondary);
`;

const SectionDescription = styled.span`
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

const FallbackBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-state-info-subtle);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-state-info-text);
`;

const MethodState = styled.span<{ $isSpecific: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-pill);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: ${(props) =>
    props.$isSpecific
      ? 'var(--ds-color-state-info-text)'
      : 'var(--ds-color-text-secondary)'};
  background: ${(props) =>
    props.$isSpecific
      ? 'var(--ds-color-state-info-subtle)'
      : 'var(--ds-color-bg-subtle)'};
`;
