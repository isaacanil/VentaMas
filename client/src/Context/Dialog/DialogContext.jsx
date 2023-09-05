import React, { createContext, useContext, useState } from 'react';

// Crear el contexto
export const DialogContext = createContext();
const initDialog = {
    isOpen: false,
    title: 'Ingresa un titulo',
    type: 'neutro',
    message: 'Ingresa un mensaje',
    onConfirm: null,
    onCancel: null,
    
};
// Crear el provider
export const DialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState(initDialog);

    return (
        <DialogContext.Provider value={{ dialog, setDialog }}>
            {children}
        </DialogContext.Provider>
    );
};

// Crear un hook personalizado para usar el diálogo
export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog debe ser usado dentro de un DialogProvider');
    }
    const { dialog, setDialog } = context;
    const onClose = () => setDialog(initDialog);
    const setDialogConfirm = (data) => setDialog({ ...dialog, ...data })
    return { dialog, setDialogConfirm, onClose};
};
