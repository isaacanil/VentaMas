import type { ChangeEventHandler, ReactNode } from 'react';
import styled from 'styled-components';

import {
  VmAlert,
  VmButton,
  VmInput,
  type VmButtonProps,
} from '@/components/heroui';

type AdminBusinessActionFooterProps = {
  canSubmit: boolean;
  formId: string;
  isSubmitting: boolean;
  onCancel: () => void;
  stackOnMobile?: boolean;
  submitLabel: ReactNode;
  submitVariant?: VmButtonProps['variant'];
};

type AdminBusinessSummaryProps = {
  businessId?: string;
  businessName?: string | null;
  statusLabel: ReactNode;
  statusTitle: string;
};

type AdminBusinessConfirmationFieldProps = {
  businessId?: string;
  children?: ReactNode;
  confirmationInvalid: boolean;
  inputMonospace?: boolean;
  isSubmitting: boolean;
  labelTone?: 'primary' | 'secondary';
  onChange: ChangeEventHandler<HTMLInputElement>;
  submitAttempted: boolean;
  value: string;
};

export const AdminBusinessActionFooter = ({
  canSubmit,
  formId,
  isSubmitting,
  onCancel,
  stackOnMobile = false,
  submitLabel,
  submitVariant = 'primary',
}: AdminBusinessActionFooterProps) => (
  <AdminBusinessActions $stackOnMobile={stackOnMobile}>
    <VmButton variant="secondary" isDisabled={isSubmitting} onPress={onCancel}>
      Cancelar
    </VmButton>
    <VmButton
      type="submit"
      form={formId}
      variant={submitVariant}
      isDisabled={!canSubmit}
      isPending={isSubmitting}
    >
      {submitLabel}
    </VmButton>
  </AdminBusinessActions>
);

export const AdminBusinessSummary = ({
  businessId,
  businessName,
  statusLabel,
  statusTitle,
}: AdminBusinessSummaryProps) => (
  <SummaryGrid>
    <SummaryItem>
      <SummaryLabel>Negocio</SummaryLabel>
      <SummaryValue>{businessName || 'Negocio sin nombre'}</SummaryValue>
    </SummaryItem>
    <SummaryItem>
      <SummaryLabel>ID</SummaryLabel>
      <SummaryValue>{businessId || '-'}</SummaryValue>
    </SummaryItem>
    <SummaryItem>
      <SummaryLabel>{statusTitle}</SummaryLabel>
      <SummaryValue>{statusLabel}</SummaryValue>
    </SummaryItem>
  </SummaryGrid>
);

export const AdminBusinessConfirmationField = ({
  businessId,
  children,
  confirmationInvalid,
  inputMonospace = false,
  isSubmitting,
  labelTone = 'secondary',
  onChange,
  submitAttempted,
  value,
}: AdminBusinessConfirmationFieldProps) => (
  <AdminBusinessField>
    <AdminBusinessFieldLabel $tone={labelTone}>
      Confirmar ID del negocio
    </AdminBusinessFieldLabel>
    <AdminBusinessConfirmInput
      aria-label="Confirmar ID del negocio"
      value={value}
      disabled={isSubmitting}
      placeholder={businessId || 'ID del negocio'}
      $isMonospace={inputMonospace}
      onChange={onChange}
    />
    {submitAttempted && !value ? (
      <AdminBusinessErrorText>
        Confirma el ID del negocio.
      </AdminBusinessErrorText>
    ) : null}
    {(submitAttempted || confirmationInvalid) &&
    value &&
    confirmationInvalid ? (
      <AdminBusinessErrorText>
        El ID escrito no coincide con el negocio.
      </AdminBusinessErrorText>
    ) : null}
    {children}
  </AdminBusinessField>
);

export const AdminBusinessModalContent = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

export const AdminBusinessNotice = styled(VmAlert)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--ds-space-3);
  align-items: flex-start;
  padding: var(--ds-space-3);
`;

export const AdminBusinessNoticeIcon = styled(VmAlert.Indicator)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 2px;
`;

export const AdminBusinessNoticeDescription = styled(VmAlert.Description)`
  margin: var(--ds-space-1) 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

export const AdminBusinessField = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

export const AdminBusinessFieldLabel = styled.label<{
  $tone?: 'primary' | 'secondary';
}>`
  color: ${({ $tone = 'secondary' }) =>
    $tone === 'primary'
      ? 'var(--ds-color-text-primary)'
      : 'var(--ds-color-text-secondary)'};
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

export const AdminBusinessErrorText = styled.p`
  margin: 0;
  color: var(--ds-color-state-danger);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const SummaryGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
  padding: var(--ds-space-3);
  border-right: 1px solid var(--ds-color-border-default);

  &:last-child {
    border-right: 0;
  }

  @media (max-width: 680px) {
    border-right: 0;
    border-bottom: 1px solid var(--ds-color-border-default);

    &:last-child {
      border-bottom: 0;
    }
  }
`;

const SummaryLabel = styled.dt`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const SummaryValue = styled.dd`
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AdminBusinessConfirmInput = styled(VmInput)<{ $isMonospace: boolean }>`
  width: 100%;
  ${({ $isMonospace }) =>
    $isMonospace ? 'font-family: var(--ds-font-family-mono);' : ''}
`;

const AdminBusinessActions = styled.div<{ $stackOnMobile: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @media (max-width: 520px) {
    ${({ $stackOnMobile }) =>
      $stackOnMobile
        ? `
    width: 100%;

    > button {
      flex: 1 1 100%;
    }
  `
        : ''}
  }
`;
