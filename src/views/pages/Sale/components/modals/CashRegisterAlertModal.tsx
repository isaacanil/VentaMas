// @ts-nocheck
import { Button, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';

import ROUTES_NAME from '@/router/routes/routesName';

interface CashRegisterAlertModalProps {
    open: boolean;
    onClose: () => void;
    status: string | boolean;
}

export const CashRegisterAlertModal = ({
    open,
    onClose,
    status,
}: CashRegisterAlertModalProps) => {
    const navigate = useNavigate();

    const handleOpenRegister = () => {
        navigate(ROUTES_NAME.CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_OPENING);
        onClose();
    };

    const isClosing = status === 'closing';

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={isClosing ? 'Cierre de caja en proceso' : 'Atención'}
            footer={isClosing ? [
                <Button key="ok" type="primary" onClick={onClose}>
                    Entendido
                </Button>
            ] : [
                <Button key="cancel" onClick={onClose}>
                    Cancelar
                </Button>,
                <Button key="open" type="primary" onClick={handleOpenRegister}>
                    Abrir Cuadre
                </Button>,
            ]}
        >
            {isClosing ? (
                <>
                    <p>Hay un cuadre de caja en proceso de cierre.</p>
                    <p>En este estado no se pueden realizar nuevas ventas hasta que el proceso finalice o se abra un nuevo cuadre.</p>
                </>
            ) : (
                <>
                    <p>No hay un cuadre de caja abierto para el usuario actual.</p>
                    <p>Por favor, abra un cuadre de caja para continuar.</p>
                </>
            )}
        </Modal>
    );
};

