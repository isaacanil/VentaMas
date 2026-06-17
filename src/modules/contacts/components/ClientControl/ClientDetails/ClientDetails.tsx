import { faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { useRef, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { VmButton, VmInputGroup } from '@/components/heroui';
import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectUser } from '@/features/auth/userSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { useClientPendingBalance } from '@/firebase/accountsReceivable/useClientPendingBalance';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { useInsuranceEnabled } from '@/modules/insurance/public';
import { formatDominicanPhoneForLegacyDisplay } from '@/shared/phone/phoneNumber';
import { formatPrice } from '@/utils/format';
import type { UserIdentity } from '@/types/users';

type ClientRootState = Parameters<typeof selectClient>[0];
type UserRootState = Parameters<typeof selectUser>[0];

const EMPTY_VALUE = 'No registrado';

const toDisplayValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim() || EMPTY_VALUE;
  if (typeof value === 'number') return String(value);
  return EMPTY_VALUE;
};

const hasDisplayValue = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  return typeof value === 'number';
};

const formatPhoneDisplayValue = (value: unknown): string => {
  const displayValue = toDisplayValue(value);
  if (displayValue === EMPTY_VALUE) return displayValue;

  return formatDominicanPhoneForLegacyDisplay(displayValue);
};

export const ClientDetails = () => {
  const dispatch = useDispatch();
  const client = useSelector<ClientRootState, ReturnType<typeof selectClient>>(
    selectClient,
  );
  const isMenuVisible = client?.name && client?.name !== 'Generic Client';
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandablePanelRef = useRef<HTMLDivElement | null>(null);
  const insuranceEnabled = useInsuranceEnabled();

  useClickOutSide(
    expandablePanelRef,
    isExpanded,
    () => setIsExpanded(false),
    'mousedown',
  );

  const { balance: pendingBalance } = useClientPendingBalance({
    user,
    clientId: client?.id ?? null,
  });
  const pendingBalanceValue = pendingBalance ?? 0;

  const handlePayment = () => {
    dispatch(
      setAccountPayment({
        isOpen: true,
        paymentDetails: {
          paymentScope: 'balance',
          paymentOption: 'installment',
          totalAmount: pendingBalanceValue,
          clientId: client.id,
        },
        extra: {
          clientName: client?.name,
          clientCode:
            (client as { numberId?: string | number })?.numberId ?? client?.id,
        },
      }),
    );
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const phoneAndAddressDetails = (
    <DetailsGrid>
      <ReadonlyField
        label="Teléfono"
        value={formatPhoneDisplayValue(client.tel)}
        icon={<FontAwesomeIcon icon={faPhone} />}
        hideLabel
      />
      {hasDisplayValue(client.tel2) ? (
        <ReadonlyField
          label="Teléfono 2"
          value={formatPhoneDisplayValue(client.tel2)}
          icon={<FontAwesomeIcon icon={faPhone} />}
          hideLabel
        />
      ) : null}
      <ReadonlyField
        label="Dirección"
        value={client.address}
        icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
        hideLabel
        wide
      />
    </DetailsGrid>
  );

  return (
    isMenuVisible && (
      <Container>
        <SummaryRow>
          <ClientIdColumn>
            <ClientId>{`#${toDisplayValue(client?.numberId)}`}</ClientId>
            {insuranceEnabled && (
              <ExpandButton onClick={toggleExpand} isExpanded={isExpanded}>
                <ExpandIcon isExpanded={isExpanded}>▼</ExpandIcon>
              </ExpandButton>
            )}
          </ClientIdColumn>
          <ReadonlyField label="Cédula/RNC" value={client.personalID} />
          <BalanceInputGroup fullWidth aria-label="Balance general del cliente">
            <BalanceContent>
              <FieldLabel>Bal general</FieldLabel>
              <FieldValue>{formatPrice(pendingBalanceValue)}</FieldValue>
            </BalanceContent>
            <VmInputGroup.Suffix>
              <BalancePayButton
                size="sm"
                variant="primary"
                onPress={handlePayment}
                isDisabled={pendingBalanceValue === 0}
              >
                Pagar
              </BalancePayButton>
            </VmInputGroup.Suffix>
          </BalanceInputGroup>
        </SummaryRow>
        {!insuranceEnabled ? phoneAndAddressDetails : null}

        {insuranceEnabled ? (
          <LazyMotion features={domAnimation}>
            <AnimatePresence>
              {isExpanded && (
                <ExpandablePanel
                  ref={expandablePanelRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PanelHeader>
                    <PanelTitle>Detalles del cliente</PanelTitle>
                    <CloseButton onClick={toggleExpand}>×</CloseButton>
                  </PanelHeader>
                  {phoneAndAddressDetails}
                </ExpandablePanel>
              )}
            </AnimatePresence>
          </LazyMotion>
        ) : null}
      </Container>
    )
  );
};

const ReadonlyField = ({
  label,
  value,
  bordered = false,
  wide = false,
  icon,
  hideLabel = false,
}: {
  label: string;
  value: unknown;
  bordered?: boolean;
  wide?: boolean;
  icon?: ReactNode;
  hideLabel?: boolean;
}) => (
  <Field
    aria-label={hideLabel ? label : undefined}
    data-bordered={bordered ? 'true' : undefined}
    data-has-icon={icon ? 'true' : undefined}
    data-wide={wide ? 'true' : undefined}
  >
    {icon ? <FieldIcon aria-hidden="true">{icon}</FieldIcon> : null}
    {!hideLabel ? <FieldLabel data-role="field-label">{label}</FieldLabel> : null}
    <FieldValue data-role="field-value">{toDisplayValue(value)}</FieldValue>
  </Field>
);

const Container = styled.div`
  position: relative;
  display: grid;
  gap: 2px;
  padding: 0 var(--ds-space-2);
  border-bottom-right-radius: var(--ds-radius-md);
  border-bottom-left-radius: var(--ds-radius-md);
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--ds-space-1);
  align-items: center;
  width: 100%;
`;

const ClientIdColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 28px;
`;

const ClientId = styled.div`
  font-weight: var(--ds-font-weight-semibold);
  line-height: 18px;
  color: var(--ds-color-text-secondary);
  white-space: nowrap;
`;

const BalanceInputGroup = styled(VmInputGroup)`
  --client-balance-radius: var(--radius, var(--ds-radius-xl));

  width: 100%;
  min-width: 0;
  height: 34px;
  min-height: 34px;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--client-balance-radius);
  background: var(--ds-color-bg-surface);

  [data-slot='input-group-suffix'],
  .input-group__suffix {
    height: 100%;
    padding: 0;
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 var(--ds-space-2);
  min-width: 0;
`;

const Field = styled.div`
  display: grid;
  min-width: 0;
  min-height: 30px;
  padding: 1px var(--ds-space-2);
  border: 1px solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;

  &[data-wide='true'] {
    grid-column: 1 / -1;
  }

  &[data-bordered='true'] {
    border-color: var(--ds-color-border-default);
    background: var(--ds-color-bg-surface);
  }

  &[data-has-icon='true'] {
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--ds-space-1);
    align-items: center;
    min-height: 20px;
    padding-top: 0;
    padding-bottom: 0;
  }
`;

const BalanceContent = styled.div`
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  padding: 1px var(--ds-space-2);
`;

const FieldLabel = styled.span`
  min-width: 0;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1.1;
  color: var(--ds-color-text-tertiary);
  white-space: nowrap;
`;

const FieldValue = styled.span`
  min-width: 0;
  overflow: hidden;
  font-size: var(--ds-font-size-sm);
  line-height: 1.15;
  color: var(--ds-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FieldIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 13px;
  line-height: 1;
  color: var(--ds-color-text-tertiary);
`;

const BalancePayButton = styled(VmButton)`
  height: 100%;
  min-height: 100%;
  border-radius: 0 var(--client-balance-radius) var(--client-balance-radius) 0;
  white-space: nowrap;
`;

const ExpandButton = styled.button<{ isExpanded?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  outline: none;
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    color: var(--ds-color-text-primary);
    background: var(--ds-color-bg-subtle);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ExpandIcon = styled.span<{ isExpanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: ${(props) => (props.isExpanded ? '-1px' : '1px')};
  font-size: 8px;
  transform: ${(props) => (props.isExpanded ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.3s;
`;

const ExpandablePanel = styled(m.div)`
  position: absolute;
  top: 100%;
  right: var(--ds-space-2);
  left: var(--ds-space-2);
  z-index: 5;
  display: grid;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-sm);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--ds-space-2);
  border-bottom: 1px solid var(--ds-color-border-default);
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: var(--ds-font-size-lg);
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    color: var(--ds-color-text-primary);
    background: var(--ds-color-bg-subtle);
  }

  &:active {
    transform: scale(0.95);
  }
`;
