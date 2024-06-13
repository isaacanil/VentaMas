import { collection, query, where, orderBy, getDocs, doc, updateDoc, setDoc, Timestamp, writeBatch, getDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from '../firebaseconfig';
import { defaultInstallmentPaymentsAR } from "../../schema/accountsReceivable/installmentPaymentsAR";
import { defaultPaymentsAR } from "../../schema/accountsReceivable/paymentAR";

// Función para obtener las cuotas de una cuenta específica
const getInstallmentsByArId = async (user, arId) => {
    const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
    const q = query(installmentsRef, where('arId', '==', arId), orderBy('installmentDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Función para pagar todas las cuotas de una cuenta por cobrar específica
export const fbPayAllInstallmentsForAccount = async ({ user, paymentDetails }) => {
    const { totalPaid, arId, clientId, paymentMethods, comments } = paymentDetails;
    console.log('Paying all installments for account:', arId, 'Client Id:', clientId, 'Total paid:', totalPaid, 'Payment methods:', paymentMethods, 'Comments:', comments);
    let remainingAmount = totalPaid;

    // Crear un nuevo pago
    const paymentId = nanoid();
    const paymentsRef = doc(db, "businesses", user.businessID, "accountsReceivablePayments", paymentId);
    const paymentData = {
        ...defaultPaymentsAR,
        paymentId,
        paymentMethods,
        totalPaid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        comments,
        clientId,
        createdUserId: user?.uid,
        updatedUserId: user?.uid,
        isActive: true
    };
    console.log('Creating payment:', paymentMethods);
    await setDoc(paymentsRef, paymentData);

    const batch = writeBatch(db);

    // Obtener todas las cuotas de la cuenta por cobrar específica
    let accountInstallments = await getInstallmentsByArId(user, arId);

    let paidInstallments = [];

    // Actualizar el balance de la cuenta
    let newArBalance = accountInstallments.reduce((acc, installment) => acc + installment.installmentBalance, 0);

    for (let installment of accountInstallments) {
        if (remainingAmount <= 0) break;

        let amountToApply = Math.min(remainingAmount, installment.installmentBalance);
        let newInstallmentBalance = installment.installmentBalance - amountToApply;

        const installmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.installmentId);
        const installmentPaymentRef = doc(collection(db, "businesses", user.businessID, "accountsReceivableInstallmentPayments"));

        // Acumular la actualización del balance de la cuota
        batch.update(installmentRef, { installmentBalance: newInstallmentBalance, isActive: newInstallmentBalance === 0 ? false : installment.isActive });

        // Acumular el registro del pago de la cuota
        batch.set(installmentPaymentRef, {
            ...defaultInstallmentPaymentsAR,
            installmentPaymentId: nanoid(),
            paymentId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            paymentAmount: amountToApply,
            createdBy: user.uid,
            updatedBy: user.uid,
            isActive: true,
            arId: arId,
        });

        if (newInstallmentBalance === 0) {
            paidInstallments.push(installment.id);
        }

        remainingAmount -= amountToApply;
    }

    // Actualizar el balance de la cuenta por cobrar
    newArBalance -= totalPaid;
    const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", arId);
    const account = await getDoc(accountsReceivableRef);
    if (account.exists()) {
        const updatedPaidInstallments = [
            ...(account.data().paidInstallments || []), 
            ...paidInstallments
        ];
        batch.update(accountsReceivableRef, {
            arBalance: newArBalance,
            lastPaymentDate: Timestamp.now(),
            lastPayment: totalPaid,
            isActive: newArBalance === 0 ? false : true,
            isClosed: newArBalance === 0 ? true : false,
            paidInstallments: updatedPaidInstallments
        });
    }

    // Ejecutar todas las actualizaciones en un solo batch
    await batch.commit();

    if (remainingAmount > 0) {
        console.log(`Payment completed. Remaining amount: ${remainingAmount}`);
    } else {
        console.log('Payment completed with no remaining amount.');
    }
};
