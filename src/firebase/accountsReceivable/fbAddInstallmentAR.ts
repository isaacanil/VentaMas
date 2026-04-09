import { Timestamp, collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { generateInstallments } from '@/utils/accountsReceivable/generateInstallments';
import { toMillis } from '@/utils/date/toMillis';
import type { UserIdentity } from '@/types/users';
import type {
  AccountsReceivableDoc,
  AccountsReceivableInstallment,
  TimestampLike,
} from '@/utils/accountsReceivable/types';
import { flowTrace } from '@/utils/flowTrace';

const toRequiredMillis = (value: TimestampLike | undefined): number => {
  const millis = toMillis(value ?? null);
  if (millis === undefined) {
    throw new Error('Formato de fecha no soportado');
  }
  return millis;
};

const prepareInstallmentForFirebase = (
  installments: AccountsReceivableInstallment[],
): AccountsReceivableInstallment[] => {
  return installments.map((installment) => ({
    ...installment,
    createdAt: Timestamp.fromMillis(
      toRequiredMillis(installment.createdAt as TimestampLike),
    ),
    updatedAt: Timestamp.fromMillis(
      toRequiredMillis(installment.updatedAt as TimestampLike),
    ),
    installmentDate: Timestamp.fromMillis(
      toRequiredMillis(installment.installmentDate as TimestampLike),
    ),
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
    if ((ar as AccountsReceivableDoc & { installmentsCreatedInBackend?: boolean })
      ?.installmentsCreatedInBackend) {
      return;
    }
    // Verificación inicial de los parámetros
    if (!user?.businessID) {
      throw new Error('User business ID is missing');
    }
    if (!ar) {
      throw new Error('Accounts receivable data is missing');
    }

    await flowTrace('AR_INSTALLMENTS_REQUEST', {
      businessId: user.businessID,
      arId: ar.id,
      totalInstallments: ar.totalInstallments,
    });

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
    await flowTrace('AR_INSTALLMENTS_SUCCESS', {
      businessId: user.businessID,
      arId: ar.id,
      count: installmentsData.length,
    });
  } catch (error) {
    console.error('Error adding installments for accounts receivable:', error);
    await flowTrace('AR_INSTALLMENTS_ERROR', {
      arId: ar?.id,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
