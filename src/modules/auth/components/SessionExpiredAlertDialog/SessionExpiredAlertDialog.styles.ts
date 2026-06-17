import styled from 'styled-components';

import { VmAlertDialog, VmButton } from '@/components/heroui';

export const SessionExpiredBackdrop = styled(VmAlertDialog.Backdrop)`
  z-index: var(--ds-z-modal, 9999);
  background: rgb(0 0 0 / 100%);
`;

export const SessionExpiredDialog = styled(VmAlertDialog.Dialog)`
  width: min(380px, calc(100vw - 40px));
  padding: 18px 20px 18px 22px;
  gap: 0;
  border: 0;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-elevated);
  box-shadow: var(--ds-shadow-lg);

  .alert-dialog__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 0;
  }

  .alert-dialog__icon {
    flex: 0 0 20px;
    width: 20px;
    height: 20px;
    margin-top: 1px;
  }

  .alert-dialog__heading {
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
    line-height: var(--ds-line-height-tight);
    color: var(--ds-color-text-primary);
    letter-spacing: var(--ds-letter-spacing-normal);
  }

  .alert-dialog__body {
    padding: 8px 0 0 32px;
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-normal);
    color: var(--ds-color-text-secondary);
  }

  .alert-dialog__body p {
    max-width: 270px;
    margin: 0;
  }

  .alert-dialog__footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 0 0;
  }

  @media (width <= 480px) {
    width: min(380px, calc(100vw - 28px));
    padding: 18px;

    .alert-dialog__body {
      padding-left: 32px;
    }
  }
`;

export const SessionExpiredAction = styled(VmButton)`
  min-width: 80px;
  height: 30px;
  padding-inline: 14px;
  font-weight: var(--ds-font-weight-semibold);
`;
