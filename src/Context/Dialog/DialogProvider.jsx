import React, { useState } from 'react';

import { DialogContext, initDialog } from './contextState';

export const DialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState(initDialog);

    return (
        <DialogContext.Provider value={{ dialog, setDialog }}>
            {children}
        </DialogContext.Provider>
    );
};
