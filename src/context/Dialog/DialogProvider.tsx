import React, { useState, type ReactNode } from 'react';

import { DialogContext, initDialog, type DialogState } from './contextState';

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [dialog, setDialog] = useState<DialogState>(initDialog);
  return (
    <DialogContext.Provider value={{ dialog, setDialog }}>
      {children}
    </DialogContext.Provider>
  );
};
