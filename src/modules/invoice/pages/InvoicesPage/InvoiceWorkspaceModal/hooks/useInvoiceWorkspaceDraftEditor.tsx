import { message } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';

import { markAuthorizationUsed } from '@/firebase/authorizations/invoiceEditAuthorizations';
import { fbUpdateInvoice } from '@/firebase/invoices/fbUpdateInvoice';
import useInvoiceEditAuthorization from '@/modules/invoice/pages/InvoicesPage/hooks/useInvoiceEditAuthorization';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import {
  createWorkspaceInvoiceDraft,
  type InvoiceWorkspaceEditState,
} from '../utils/invoiceWorkspaceEdit';

interface UseInvoiceWorkspaceDraftEditorOptions {
  editState: InvoiceWorkspaceEditState;
  invoice: InvoiceData;
  isEditing?: boolean;
  onSaved: (invoice: InvoiceData) => void;
  successMessage: string;
  user: UserIdentity | null;
}

export const useInvoiceWorkspaceDraftEditor = ({
  editState,
  invoice,
  isEditing = false,
  onSaved,
  successMessage,
  user,
}: UseInvoiceWorkspaceDraftEditorOptions) => {
  const initialDraftRef = useRef(createWorkspaceInvoiceDraft(invoice));
  const [draft, setDraft] = useState<InvoiceData>(
    () => initialDraftRef.current,
  );
  const [saving, setSaving] = useState(false);
  const canEditDirectly = isEditing && editState.canEditDirectly;
  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraftRef.current),
    [draft],
  );

  const proceedToSave = useCallback(
    async (authorization?: Record<string, unknown> | null) => {
      if (!canEditDirectly || !hasChanges) return;
      if (!user) {
        message.error('No se encontró un usuario válido para actualizar.');
        return;
      }

      setSaving(true);
      try {
        await fbUpdateInvoice(user, draft);
        const authorizationId =
          typeof authorization?.id === 'string' ? authorization.id : null;

        if (authorizationId) {
          try {
            await markAuthorizationUsed(user, authorizationId, user);
          } catch (error) {
            console.warn('No se pudo marcar la autorización como usada', error);
            message.warning(
              'Factura actualizada, pero la autorización no pudo marcarse como usada.',
            );
          }
        }

        initialDraftRef.current = draft;
        onSaved(draft);
        message.success(successMessage);
      } catch (error: any) {
        message.error(error?.message || 'No se pudo actualizar la factura.');
      } finally {
        setSaving(false);
      }
    },
    [canEditDirectly, draft, hasChanges, onSaved, successMessage, user],
  );

  const {
    handleEdit: handleAuthorizedSave,
    authorizationModal,
    isProcessing: isAuthorizing,
  } = useInvoiceEditAuthorization({
    invoice,
    onAuthorized: proceedToSave,
  });

  const handleReset = () => {
    setDraft(initialDraftRef.current);
  };

  return {
    authorizationModal,
    canEditDirectly,
    draft,
    handleAuthorizedSave,
    handleReset,
    hasChanges,
    isBusy: saving || isAuthorizing,
    setDraft,
  };
};
