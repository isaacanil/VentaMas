import type { JSX } from 'react';

import { VmAlertDialog } from '@/components/heroui';

import {
  SessionExpiredAction,
  SessionExpiredBackdrop,
  SessionExpiredDialog,
} from './SessionExpiredAlertDialog.styles';

interface SessionExpiredAlertDialogProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const SessionExpiredAlertDialog = ({
  isOpen,
  onAccept,
}: SessionExpiredAlertDialogProps): JSX.Element => (
  <SessionExpiredBackdrop
    isOpen={isOpen}
    isDismissable={false}
    isKeyboardDismissDisabled
    onOpenChange={(open) => {
      if (!open) onAccept();
    }}
    variant="opaque"
  >
    <VmAlertDialog.Container placement="center" size="sm">
      <SessionExpiredDialog aria-label="Sesion expirada">
        <VmAlertDialog.Header>
          <VmAlertDialog.Icon status="warning" />
          <VmAlertDialog.Heading>Sesion expirada</VmAlertDialog.Heading>
        </VmAlertDialog.Header>
        <VmAlertDialog.Body>
          <p>Tu sesion ha expirado. Por favor, inicia sesion nuevamente.</p>
        </VmAlertDialog.Body>
        <VmAlertDialog.Footer>
          <SessionExpiredAction
            size="sm"
            variant="primary"
            onPress={onAccept}
          >
            Aceptar
          </SessionExpiredAction>
        </VmAlertDialog.Footer>
      </SessionExpiredDialog>
    </VmAlertDialog.Container>
  </SessionExpiredBackdrop>
);
