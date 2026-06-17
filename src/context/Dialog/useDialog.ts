import { useContext } from 'react';

import { DialogContext, initDialog, type DialogState } from './contextState';

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog debe ser usado dentro de un DialogProvider');
  }
  const { dialog, setDialog } = context;
  const onClose = () => setDialog(initDialog);
  const setDialogConfirm = (data: Partial<DialogState>) =>
    setDialog({ ...dialog, ...data });
  return { dialog, setDialogConfirm, onClose };
};
