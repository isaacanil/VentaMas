import { nanoid } from 'nanoid';
import { DateTime } from 'luxon';
import usePaymentDates from '../../views/component/cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/usePaymentDates';

const roundToTwo = (num) => {
    return Math.round(num * 100) / 100;
};

export function generateInstallments({ ar, user }) {
    const { totalInstallments, totalReceivable, arId, frequency } = ar;

    // Generación de fechas de pago utilizando usePaymentDates
    const { paymentDates } = usePaymentDates(frequency, totalInstallments);

    // Cálculo del monto de cada cuota
    const precisePart = totalReceivable / totalInstallments;
    const roundedPart = roundToTwo(precisePart);
    const roundedTotal = roundToTwo(roundedPart * totalInstallments);

    const difference = roundToTwo(totalReceivable - roundedTotal);
    const installments = [];

    paymentDates.forEach((date, index) => {
        let installmentAmount = roundedPart;
        if (index === totalInstallments - 1) {
            installmentAmount = roundToTwo(roundedPart + difference);
        }

        installments.push({
            installmentId: nanoid(),
            arId,
            createdAt: DateTime.now().toMillis(),
            updatedAt: DateTime.now().toMillis(),
            installmentDate: date,
            installmentAmount: installmentAmount,
            installmentBalance: installmentAmount,
            createdBy: user?.uid,
            updatedBy: user?.uid,
            isActive: true
        });
    });

    return installments;
}
