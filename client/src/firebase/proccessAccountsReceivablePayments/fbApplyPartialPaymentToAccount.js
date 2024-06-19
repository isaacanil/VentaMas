import { db } from "../firebaseconfig";
import { collection, query, where, orderBy, getDocs, doc, setDoc, Timestamp, writeBatch, getDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { defaultInstallmentPaymentsAR } from "../../schema/accountsReceivable/installmentPaymentsAR";
import { defaultPaymentsAR } from "../../schema/accountsReceivable/paymentAR";

const THRESHOLD = 1e-10;

const getInstallmentsByArId = async (user, arId) => {
    const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
    const q = query(installmentsRef, where('arId', '==', arId), orderBy('installmentDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const roundToTwoDecimals = (num) => {
    return Math.round(num * 100) / 100;
};

export const fbApplyPartialPaymentToAccount = async ({ user, paymentDetails }) => {
    try {
        const { totalPaid, clientId, arId, paymentMethods, comments } = paymentDetails;
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
            createdUserId: user?.uid,
            updatedUserId: user?.uid,
            isActive: true
        };
        console.log('Creating payment:', paymentMethods);
        await setDoc(paymentsRef, paymentData);

        const batch = writeBatch(db);

        // Obtener todas las cuotas de la cuenta por cobrar específica
        let accountInstallments = await getInstallmentsByArId(user, arId);

        let paidInstallments = new Set();

        for (let installment of accountInstallments) {
            if (remainingAmount <= 0) break;

            let amountToApply = Math.min(remainingAmount, installment.installmentBalance);
            let newInstallmentBalance = roundToTwoDecimals(installment.installmentBalance - amountToApply);

            const installmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.installmentId);
            const installmentPaymentRef = doc(collection(db, "businesses", user.businessID, "accountsReceivableInstallmentPayments"));

            // Acumular la actualización del balance de la cuota
            batch.update(installmentRef, { 
                installmentBalance: newInstallmentBalance, 
                isActive: newInstallmentBalance === 0 ? false : installment.isActive 
            });

            // Acumular el registro del pago de la cuota
            batch.set(installmentPaymentRef, {
                ...defaultInstallmentPaymentsAR,
                installmentPaymentId: nanoid(),
                installmentId: installment.installmentId,
                paymentId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                paymentAmount: roundToTwoDecimals(amountToApply),
                createdBy: user.uid,
                updatedBy: user.uid,
                isActive: true,
                clientId: clientId,
                arId: arId,
            });

            if (newInstallmentBalance === 0) {
                paidInstallments.add(installment.id);
            }

            remainingAmount = roundToTwoDecimals(remainingAmount - amountToApply);
        }

        // Actualizar el balance de la cuenta por cobrar
        const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", arId);
        const account = await getDoc(accountsReceivableRef);
        if (account.exists()) {
            let currentArBalance = account.data().arBalance;
            let newArBalance = roundToTwoDecimals(currentArBalance - totalPaid);

            if (newArBalance < 0) {
                remainingAmount = -newArBalance;
                newArBalance = 0;
            } else {
                remainingAmount = 0;
            }

            const updatedPaidInstallments = Array.from(new Set([
                ...(account.data().paidInstallments || []), 
                ...Array.from(paidInstallments)
            ]));

            batch.update(accountsReceivableRef, {
                arBalance: newArBalance,
                lastPaymentDate: Timestamp.now(),
                lastPayment: totalPaid,
                isActive: newArBalance === 0 ? false : account.data().isActive,
                isClosed: newArBalance === 0 ? true : account.data().isClosed,
                paidInstallments: updatedPaidInstallments
            });
        }

        // Ejecutar todas las actualizaciones en un solo batch
        await batch.commit();

        if (remainingAmount > 0) {
            console.log(`Payment completed. Remaining amount to return: ${remainingAmount}`);
            // Aquí puedes agregar la lógica para devolver la cantidad restante al usuario
        } else {
            console.log('Payment completed with no remaining amount.');
        }
    } catch (error) {
        console.error("Error processing partial payment for account:", error);
        throw error;
    }
};
