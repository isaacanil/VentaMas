import { Timestamp, collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { generateInstallments } from '../../utils/accountsReceivable/generateInstallments';

function prepareInstallmentForFirebase(installments) {
    return installments.map((installment) => ({
        ...installment,
        createdAt: Timestamp.fromMillis(installment.createdAt),
        updatedAt: Timestamp.fromMillis(installment.updatedAt),
        installmentDate: Timestamp.fromMillis(installment.installmentDate)
    }));
}

export async function fbAddInstallmentAR({ user, ar }) {
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
        const baseInstallmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');

        // Uso de un batch para escribir múltiples documentos
        const batch = writeBatch(db);
        installmentsData.forEach(installment => {
            const installmentRef = doc(baseInstallmentsRef, installment.installmentId);
            batch.set(installmentRef, installment);
        });

        // Confirmación de la operación batch
        await batch.commit();
        console.log('Installments added successfully for accounts receivable');

    } catch (error) {
        console.error('Error adding installments for accounts receivable:', error);
        throw error;
    }
}
