import { Timestamp, collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { generateInstallments } from '@/utils/accountsReceivable/generateInstallments';
import type { UserIdentity } from '@/types/users';
import type {
  AccountsReceivableDoc,
  AccountsReceivableInstallment,
  TimestampLike,
} from '@/utils/accountsReceivable/types';

const toMillis = (value?: TimestampLike): number => {
  if (!value) {
    throw new Error('Formato de fecha no soportado');
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const asNum = Number(value);
    const parsed = Number.isNaN(asNum) ? new Date(value).getTime() : asNum;
    if (Number.isNaN(parsed)) throw new Error('Formato de fecha no soportado');
    return parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
  }
  throw new Error('Formato de fecha no soportado');
};

const prepareInstallmentForFirebase = (
  installments: AccountsReceivableInstallment[],
): AccountsReceivableInstallment[] => {
  return installments.map((installment) => ({
    ...installment,
    createdAt: Timestamp.fromMillis(toMillis(installment.createdAt)),
    updatedAt: Timestamp.fromMillis(toMillis(installment.updatedAt)),
    installmentDate: Timestamp.fromMillis(toMillis(installment.installmentDate)),
  }));
};

interface FbAddInstallmentARParams {
  user?: UserIdentity | null;
  ar?: AccountsReceivableDoc;
}

export async function fbAddInstallmentAR({
  user,
  ar,
}: FbAddInstallmentARParams): Promise<void> {
  try {
    // Verificación inicial de los parámetros
    if (!user?.businessID) {
      throw new Error('User business ID is missing');
    }
    if (!ar) {
      throw new Error('Accounts receivable data is missing');
    }

    // Generación de documentos de cuotas
    const installments = generateInstallments({ user, ar });
    const installmentsData = prepareInstallmentForFirebase(installments);

    // Referencia base para las cuotas
    const baseInstallmentsRef = collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivableInstallments',
    );

    // Uso de un batch para escribir múltiples documentos
    const batch = writeBatch(db);
    installmentsData.forEach((installment) => {
      const installmentRef = doc(baseInstallmentsRef, installment.id);
      batch.set(installmentRef, installment);
    });

    // Confirmación de la operación batch
    await batch.commit();
  } catch (error) {
    console.error('Error adding installments for accounts receivable:', error);
    throw error;
  }
}
