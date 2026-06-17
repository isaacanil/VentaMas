import {
  CreditCardOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  LockOutlined,
  UserOutlined,
  WarningOutlined,
} from '@/constants/icons/antd';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { OPERATION_MODES } from '@/constants/modes';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { toggleClientModal } from '@/features/modals/modalSlice';
import { MiniClientSelector } from '@/modules/contacts/public';

import {
  ActionButton,
  ActionRow,
  AlertShell,
  Header,
  HeaderTitle,
  ItemCount,
  StatusBadge,
  StatusMarker,
  ValidationCard,
  ValidationContent,
  ValidationIcon,
  ValidationList,
  ValidationMessage,
  ValidationTitle,
} from './GenericClientAlert.styles';
import {
  buildARValidations,
  type ValidationIcon as ValidationIconName,
} from './GenericClientAlert.utils';

import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';
import type { ReactNode } from 'react';

type ClientIdentity = {
  id?: string;
  name?: string;
};

type UnifiedARAlertProps = {
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

const VALIDATION_ICONS: Record<ValidationIconName, ReactNode> = {
  creditCard: <CreditCardOutlined />,
  exclamation: <ExclamationCircleOutlined />,
  fileText: <FileTextOutlined />,
  lock: <LockOutlined />,
  user: <UserOutlined />,
  warning: <WarningOutlined />,
};

const UnifiedARAlert = ({
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
}: UnifiedARAlertProps) => {
  const dispatch = useDispatch();
  const client = useSelector(selectClient) as ClientIdentity | null;
  const [isMiniClientSelectorOpen, setIsMiniClientSelectorOpen] =
    useState(false);

  const openCreditLimitModal = () =>
    dispatch(
      toggleClientModal({
        mode: OPERATION_MODES.UPDATE.id,
        data: client,
        addClientToCart: true,
      }),
    );

  const openMiniClientSelector = () => {
    setIsMiniClientSelectorOpen(true);
  };

  const closeMiniClientSelector = () => {
    setIsMiniClientSelectorOpen(false);
  };

  const validations = buildARValidations({
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
  });

  if (validations.length === 0) {
    return null;
  }

  const primaryStatus = validations[0]?.status ?? 'info';

  return (
    <AlertShell>
      <Header>
        <StatusMarker $status={primaryStatus} />
        <HeaderTitle>Validación CxC</HeaderTitle>
        <ItemCount>
          {validations.length} {validations.length === 1 ? 'item' : 'items'}
        </ItemCount>
      </Header>

      <ValidationList>
        {validations.map((validation) => (
          <ValidationCard
            key={`${validation.priority}-${validation.status}-${validation.title}`}
            $status={validation.status}
          >
            <ValidationIcon $status={validation.status}>
              {VALIDATION_ICONS[validation.icon]}
            </ValidationIcon>

            <ValidationContent>
              <ValidationTitle>{validation.title}</ValidationTitle>
              <ValidationMessage>{validation.message}</ValidationMessage>
            </ValidationContent>

            <StatusBadge $status={validation.status}>
              {validation.status}
            </StatusBadge>
          </ValidationCard>
        ))}
      </ValidationList>

      {validations.some((v) => v.action) && (
        <ActionRow>
          {validations.some((v) => v.action === 'selectClient') && (
            <ActionButton
              type="primary"
              size="small"
              onClick={openMiniClientSelector}
              icon={<UserOutlined />}
            >
              Seleccionar Cliente
            </ActionButton>
          )}
          {validations.some((v) => v.action === true) && (
            <ActionButton
              type="primary"
              size="small"
              onClick={openCreditLimitModal}
            >
              Configurar límites
            </ActionButton>
          )}
        </ActionRow>
      )}

      <MiniClientSelector
        isOpen={isMiniClientSelectorOpen}
        onClose={closeMiniClientSelector}
      />
    </AlertShell>
  );
};

export default UnifiedARAlert;
