import { getDoc, type DocumentReference } from 'firebase/firestore';
import type { UserIdentity } from '@/types/users';
import type { CashCountEmployee } from '@/utils/cashCount/types';

interface EmployeeDoc {
  user?: UserIdentity;
}

export async function getEmployeeData(
  employeeRef?: DocumentReference | null,
): Promise<CashCountEmployee | null> {
  // Comprobaci?n anticipada para un argumento nulo
  if (!employeeRef) return null;
  try {
    const employeeDoc = (await getDoc(employeeRef)).data() as EmployeeDoc | undefined;
    // Asegurarse de que el documento y el usuario existen y tienen la forma esperada
    if (!employeeDoc || !employeeDoc.user) {
      throw new Error('Documento de empleado no encontrado o mal formado');
    }
    const employeeUser = employeeDoc.user;
    return {
      id: employeeUser.id || employeeUser.uid,
      name: employeeUser.realName?.trim() ? employeeUser.realName : employeeUser.name,
    };
  } catch (error) {
    // Manejo adecuado de cualquier error que pueda ocurrir durante la recuperaci?n del documento
    console.error('Error al obtener datos del empleado:', error);
    return null;
  }
}
