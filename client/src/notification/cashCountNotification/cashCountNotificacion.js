import { setUserNotification } from "../../features/UserNotification/UserNotificationSlice";
import { CONFIRMATION_TASK_TYPE } from "../../views/component/modals/UserNotification/components/ConfirmationDialog/HandleConfirmationAction";

// Clase base para los diferentes comportamientos de cuadre de caja
class CashCountStrategy {
    constructor(dispatch) {
        this.dispatch = dispatch;
    }

    handleConfirm() {
        // Implementación base, puede ser vacía o lanzar una excepción
    }
}

// Estrategia para cuando no hay cuadre abierto
class NoOpenCashCountStrategy extends CashCountStrategy {
    handleConfirm() {
        this.dispatch(setUserNotification({
            isOpen: true,
            title: 'No hay un cuadre de caja abierto',
            description: 'Parece que no hay un cuadre de caja en progreso en este momento. ¿Te gustaría iniciar uno nuevo?',
            onConfirm: CONFIRMATION_TASK_TYPE.CASH_RECONCILIATION.REDIRECT_CR_OPENING,
        }));
        return;
    }
}

// Estrategia para cuando hay cuadre en proceso de cierre
class ClosingCashCountStrategy extends CashCountStrategy {
    handleConfirm() {
        this.dispatch(setUserNotification({
            isOpen: true,
            title: 'Cuadre de caja en curso',
            description: 'Actualmente hay un cuadre de caja en proceso de cierre. No puedes facturar hasta que este proceso se complete o se cancele.',
            onConfirm: null
        }));
        return;
    }
}

// Función para obtener la estrategia correspondiente según el estado de cuadre
export function getCashCountStrategy(checkCashCountStatus, dispatch) {
    switch (checkCashCountStatus) {
        case 'closed':
            return new NoOpenCashCountStrategy(dispatch);
        case 'closing':
            return new ClosingCashCountStrategy(dispatch);
        default:
            return new CashCountStrategy(dispatch);
    }
}  