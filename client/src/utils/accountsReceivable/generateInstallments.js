import { nanoid } from 'nanoid';
import { DateTime } from 'luxon';
import usePaymentDates from '../../views/component/cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/usePaymentDates';
// Asegúrate de importar correctamente usePaymentDates

export function generateInstallments({ ar, user }) {
    const { totalInstallments, installmentAmount, paymentDate, arId, frequency } = ar;

    // Generación de fechas de pago utilizando usePaymentDates
    const { paymentDates } = usePaymentDates(frequency, totalInstallments);

    // Generación de documentos de cuotas
    return paymentDates.map((date, index) => {
        const installmentId = nanoid();
        return {
            installmentId,
            arId,
            createdAt: DateTime.now().toMillis(),
            updatedAt: DateTime.now().toMillis(),
            installmentDate: date,
            installmentAmount: installmentAmount,
            installmentBalance: installmentAmount,
            createdBy: user?.uid,
            updatedBy: user?.uid,
            activeStatus: true
        };
    });
}
