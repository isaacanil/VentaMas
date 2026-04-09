import type { TaxReceiptUser } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import type { InventoryUser } from '@/utils/inventory/types';

type UserLike = UserIdentity | TaxReceiptUser | InventoryUser;

class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

const validateUser = (
  user: UserLike | null | undefined,
): UserValidationError | undefined => {
  if (!user?.businessID) {
    return new UserValidationError('User is not valid');
  }
};

export { UserValidationError, validateUser };

// Definimos una función personalizada para mostrar mensajes en la consola
function _print(message: string, type: 'info' | 'warning' | 'error' = 'info') {
  // Verificamos si estamos en modo desarrollo
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString(); // Obtenemos la fecha y hora actuales
    switch (type) {
      case 'info':
        // Development logging disabled
        break;
      case 'warning':
        console.warn(`[DEV LOG] [WARNING] [${timestamp}]: ${message}`);
        break;
      case 'error':
        console.error(`[DEV LOG] [ERROR] [${timestamp}]: ${message}`);
        break;
      default:
      // Development logging disabled
    }
  }
}
