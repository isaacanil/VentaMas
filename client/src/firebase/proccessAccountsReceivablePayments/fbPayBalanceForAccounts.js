import { collection, query, where, orderBy, getDocs, doc, updateDoc, setDoc, Timestamp, writeBatch } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from '../firebaseconfig';
import { defaultInstallmentPaymentsAR } from "../../schema/accountsReceivable/installmentPaymentsAR";
import { defaultPaymentsAR } from "../../schema/accountsReceivable/paymentAR";

// Función para obtener las cuentas por cobrar ordenadas por fecha de creación
const getSortedClientAccountsAR = async (user, clientId) => {
    const accountsRef = collection(db, 'businesses', user.businessID, 'accountsReceivable');
    const q = query(accountsRef, where('clientId', '==', clientId), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Función para obtener las cuotas de una cuenta específica
const getInstallmentsByArId = async (user, arId) => {
    const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
    const q = query(installmentsRef, where('arId', '==', arId), orderBy('installmentDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Función para procesar el pago del balance de cuentas por cobrar
export const fbPayBalanceForAccounts = async ({ user, paymentDetails }) => {
    const { clientId, totalPaid, paymentMethods, comments } = paymentDetails;
    let remainingAmount = totalPaid;
    const accounts = await getSortedClientAccountsAR(user, clientId);

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

    for (let account of accounts) {
        if (remainingAmount <= 0) break;

        let accountInstallments = await getInstallmentsByArId(user, account.arId);

        for (let installment of accountInstallments) {
            if (remainingAmount <= 0) break;

            let amountToApply = Math.min(remainingAmount, installment.installmentBalance);
            let newInstallmentBalance = installment.installmentBalance - amountToApply;
            let newAccountBalance = account.arBalance - amountToApply;

            const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", account.arId);
            const installmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.installmentId);
            const installmentPaymentRef = doc(collection(db, "businesses", user.businessID, "accountsReceivableInstallmentPayments"));

            // Acumular la actualización del balance de la cuota
            batch.update(installmentRef, { installmentBalance: newInstallmentBalance, isActive: newInstallmentBalance === 0 ? false : installment.isActive });

            // Acumular la actualización del balance de la cuenta
            account.arBalance = newAccountBalance;

            // Acumular el registro del pago de la cuota
            batch.set(installmentPaymentRef, {
                ...defaultInstallmentPaymentsAR,
                installmentPaymentId: nanoid(),
                installmentId: installment.installmentId,
                paymentId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                paymentAmount: amountToApply,
                createdBy: user.uid,
                updatedBy: user.uid,
                isActive: true,
                clientId: clientId,
                arId: account.arId,
            });

            remainingAmount -= amountToApply;
        }

        // Acumular la actualización de la cuenta
        batch.update(doc(db, "businesses", user.businessID, "accountsReceivable", account.arId), { 
            arBalance: account.arBalance, 
            lastPaymentDate: Timestamp.now(),
            isActive: account.arBalance === 0 ? false : account.isActive, 
            isClosed: account.arBalance === 0 ? true : account.isClosed 
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
