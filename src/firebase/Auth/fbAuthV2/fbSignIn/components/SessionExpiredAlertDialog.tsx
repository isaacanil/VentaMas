import { AlertDialog } from '@heroui/react';
import type { JSX } from 'react';

import {
  SessionExpiredAction,
  SessionExpiredBackdrop,
  SessionExpiredDialog,
} from './styles';

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
    <AlertDialog.Container placement="center" size="sm">
      <SessionExpiredDialog aria-label="Sesion expirada">
        <AlertDialog.Header>
          <AlertDialog.Icon status="warning" />
          <AlertDialog.Heading>Sesion expirada</AlertDialog.Heading>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <p>Tu sesion ha expirado. Por favor, inicia sesion nuevamente.</p>
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <SessionExpiredAction
            size="sm"
            variant="primary"
            onPress={onAccept}
          >
            Aceptar
          </SessionExpiredAction>
        </AlertDialog.Footer>
      </SessionExpiredDialog>
    </AlertDialog.Container>
  </SessionExpiredBackdrop>
);
