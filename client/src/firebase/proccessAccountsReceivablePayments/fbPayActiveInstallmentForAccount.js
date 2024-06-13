import { db } from "../firebaseconfig";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, setDoc, Timestamp, writeBatch, getDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { defaultInstallmentPaymentsAR } from "../../schema/accountsReceivable/installmentPaymentsAR";
import { defaultPaymentsAR } from "../../schema/accountsReceivable/paymentAR";

// Función para obtener una cuenta específica por su ID
const getClientAccountById = async (user, accountId) => {
    try {
        const accountRef = doc(db, 'businesses', user.businessID, 'accountsReceivable', accountId);
        const accountDoc = await getDoc(accountRef);
        if (accountDoc.exists()) {
            return { id: accountDoc.id, ...accountDoc.data() };
        } else {
            console.log('No account found with the specified ID.');
            return null;
        }
    } catch (error) {
        console.error("Error getting client account by ID:", error);
        throw error;
    }
};

// Función para obtener la cuota más antigua de una cuenta específica que esté activa
const getOldestActiveInstallmentByArId = async (user, arId) => {
    try {
        const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
        const q = query(installmentsRef, where('arId', '==', arId), where('isActive', '==', true), orderBy('installmentDate', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];
    } catch (error) {
        console.error("Error getting oldest active installment by AR ID:", error);
        throw error;
    }
};

// Función para procesar el pago de la cuota más antigua activa
export const fbPayActiveInstallmentForAccount = async ({ user, paymentDetails }) => {
    try {
        const { clientId, totalAmount: paymentAmount, arId, paymentMethods, comments } = paymentDetails;

        if (!paymentAmount || paymentAmount <= 0) {
            console.log('Invalid payment amount.');
            return;
        }

        const account = await getClientAccountById(user, arId);

        if (!account) {
            console.log('No active account found for the client.');
            return;
        }

        const installment = await getOldestActiveInstallmentByArId(user, account.arId);

        if (!installment) {
            console.log('No active installment found for the account.');
            return;
        }

        const paymentId = nanoid();
        const paymentsRef = doc(db, "businesses", user.businessID, "accountsReceivablePayments", paymentId);
        const paymentData = {
            ...defaultPaymentsAR,
            paymentId,
            paymentMethods,
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

        let amountToApply = Math.min(paymentAmount, installment.installmentBalance ?? 0);
        let newInstallmentBalance = (installment.installmentBalance ?? 0) - amountToApply;
        let newAccountBalance = (account.arBalance ?? 0) - amountToApply;

        const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", account.arId);
        const installmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.installmentId);
        const installmentPaymentRef = doc(collection(db, "businesses", user.businessID, "accountsReceivableInstallmentPayments"));

        batch.update(installmentRef, { installmentBalance: newInstallmentBalance, isActive: newInstallmentBalance === 0 ? false : installment.isActive });

        account.arBalance = newAccountBalance;

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

        const updatedPaidInstallments = [...(account.paidInstallments || []), installment.installmentId];

        batch.update(accountsReceivableRef, { 
            arBalance: account.arBalance, 
            lastPaymentDate: Timestamp.now(),
            lastPayment: amountToApply,
            isActive: account.arBalance === 0 ? false : account?.isActive, 
            isClosed: account.arBalance === 0 ? true : account?.isClosed,
            paidInstallments: updatedPaidInstallments
        });

        await batch.commit();

        if (amountToApply < paymentAmount) {
            console.log(`Payment completed. Remaining amount: ${paymentAmount - amountToApply}`);
        } else {
            console.log('Payment completed with no remaining amount.');
        }
    } catch (error) {
        console.error("Error processing payment for oldest active installment:", error);
        throw error;
    }
};
