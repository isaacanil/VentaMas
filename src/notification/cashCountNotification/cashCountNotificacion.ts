import { setUserNotification } from '@/features/UserNotification/UserNotificationSlice';
import { CONFIRMATION_TASK_TYPE } from '@/components/modals/UserNotification/components/ConfirmationDialog/HandleConfirmationAction';
import type { AnyAction, Dispatch } from '@reduxjs/toolkit';

// Clase base para los diferentes comportamientos de cuadre de caja
class CashCountStrategy {
  protected dispatch: Dispatch<AnyAction>;
  constructor(dispatch: Dispatch<AnyAction>) {
    this.dispatch = dispatch;
  }

  // Método base para ser sobrescrito por subclases
  handleConfirm(): void {
    // Implementación base vacía - debe ser sobrescrita
  }
}

// Estrategia para cuando no hay cuadre abierto
class NoOpenCashCountStrategy extends CashCountStrategy {
  handleConfirm(): void {
    this.dispatch(
      setUserNotification({
        isOpen: true,
        title: 'No hay un cuadre de caja abierto',
        description:
          'Parece que no hay un cuadre de caja en progreso en este momento. ¿Te gustaría iniciar uno nuevo?',
        onConfirm:
          CONFIRMATION_TASK_TYPE.CASH_RECONCILIATION.REDIRECT_CR_OPENING,
      }),
    );
    return;
  }
}

// Estrategia para cuando hay cuadre en proceso de cierre
class ClosingCashCountStrategy extends CashCountStrategy {
  handleConfirm(): void {
    this.dispatch(
      setUserNotification({
        isOpen: true,
        title: 'Cuadre de caja en curso',
        description:
          'Actualmente hay un cuadre de caja en proceso de cierre. No puedes facturar hasta que este proceso se complete o se cancele.',
        onConfirm: null,
      }),
    );
    return;
  }
}

// Función para obtener la estrategia correspondiente según el estado de cuadre
export type CashCountStatus = 'closed' | 'closing' | 'open' | 'none';

export function getCashCountStrategy(
  checkCashCountStatus: CashCountStatus | null | undefined,
  dispatch: Dispatch<AnyAction>,
): CashCountStrategy {
  switch (checkCashCountStatus) {
    case 'closed':
      return new NoOpenCashCountStrategy(dispatch);
    case 'closing':
      return new ClosingCashCountStrategy(dispatch);
    case 'open':
      return new CashCountStrategy(dispatch);
    case 'none':
      return new NoOpenCashCountStrategy(dispatch);
    default:
      return new NoOpenCashCountStrategy(dispatch);
  }
}
