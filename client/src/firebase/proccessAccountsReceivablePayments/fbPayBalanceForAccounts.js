import { collection, query, where, orderBy, getDocs, doc, setDoc, Timestamp, writeBatch, getDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from '../firebaseconfig';
import { defaultInstallmentPaymentsAR } from "../../schema/accountsReceivable/installmentPaymentsAR";
import { defaultPaymentsAR } from "../../schema/accountsReceivable/paymentAR";
import { fbAddAccountReceivablePaymentReceipt } from "../accountsReceivable/fbAddAccountReceivablePaymentReceipt";
import { fbGetInvoice } from "../invoices/fbGetInvoice";

const THRESHOLD = 1e-10;
const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

const getSortedClientAccountsAR = async (user, clientId) => {
    const accountsRef = collection(db, 'businesses', user.businessID, 'accountsReceivable');
    const q = query(accountsRef, where('clientId', '==', clientId), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getInstallmentsByArId = async (user, arId) => {
    const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
    const q = query(
        installmentsRef, 
        where('arId', '==', arId), 
        where('isActive', '==', true), 
        orderBy('installmentDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
};

const createPayment = async (user, paymentDetails) => {
    const { totalPaid, paymentMethods, comments } = paymentDetails;
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
    await setDoc(paymentsRef, paymentData);
    return paymentId;
};

const processInstallment = async (batch, user, installment, remainingAmount, paymentId, clientId, account) => {
    const amountToApply = Math.min(remainingAmount, installment.installmentBalance);
    const newInstallmentBalance = roundToTwoDecimals(installment.installmentBalance - amountToApply);
    const newAccountBalance = roundToTwoDecimals(account.arBalance - amountToApply);

    const installmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.id);
    const installmentDoc = await getDoc(installmentRef);
    if (!installmentDoc.exists()) {
        console.error(`Installment document ${installment.id} does not exist.`);
        return null;
    }

    const installmentPaymentRef = doc(collection(db, "businesses", user.businessID, "accountsReceivableInstallmentPayments"));

    batch.update(installmentRef, {
        installmentBalance: newInstallmentBalance,
        isActive: newInstallmentBalance > THRESHOLD
    });

    batch.set(installmentPaymentRef, {
        ...defaultInstallmentPaymentsAR,
        installmentPaymentId: nanoid(),
        installmentId: installment.id,
        paymentId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        paymentAmount: roundToTwoDecimals(amountToApply),
        createdBy: user.uid,
        updatedBy: user.uid,
        isActive: true,
        clientId: clientId,
        arId: account.id,
    });

    return { amountToApply, newAccountBalance, newInstallmentBalance };
};

const updateAccount = async (batch, user, account) => {
    const accountRef = doc(db, "businesses", user.businessID, "accountsReceivable", account.id)
    const accountDoc = await getDoc(accountRef);

    if (!accountDoc.exists()) {
        console.error(`Account document ${account.id} does not exist.`);
        return null;
    }

    batch.update(accountRef, {
        arBalance: account.arBalance,
        lastPaymentDate: Timestamp.now(),
        isActive: account.arBalance > THRESHOLD,
        isClosed: account.arBalance <= THRESHOLD
    });
};

export const fbPayBalanceForAccounts = async ({ user, paymentDetails }) => {
    const { clientId, paymentMethods } = paymentDetails;
    const totalPaid = parseFloat(paymentDetails.totalPaid);
    if (isNaN(totalPaid)) {
        throw new Error('Invalid totalPaid amount');
    }
    let remainingAmount = totalPaid;

    if (!user || !clientId || totalPaid <= 0 || !paymentMethods) {
        throw new Error('Invalid input parameters');
    }

    try {
        const accounts = await getSortedClientAccountsAR(user, clientId);

        const paymentId = await createPayment(user, paymentDetails);

        const batch = writeBatch(db);

        const paymentReceipt = {
            accounts: [],
            totalAmount: totalPaid,
            paymentMethod: paymentMethods,
            change: 0
        };

        for (let account of accounts) {
            if (remainingAmount <= 0) break;
            console.log(`Processing account ${account.id} - remainingAmount: ${remainingAmount}`);

            const accountInstallments = await getInstallmentsByArId(user, account.id);
            console.log(`Account ${account.id} has ${accountInstallments.length} installments, accountInstallments: `, accountInstallments);
            let accountTotalPaid = 0;
            const paidInstallments = [];

            for (let installment of accountInstallments) {
                console.log(`Processing installment ${installment.id} - remainingAmount: ${remainingAmount}`);
                if (remainingAmount <= 0) break;

                const processedInstallment = await processInstallment(batch, user, installment, remainingAmount, paymentId, clientId, account);

                if(!processedInstallment) {
                    console.error(`Error processing installment ${installment.id}`);
                    continue;
                }

                const { amountToApply, newAccountBalance, newInstallmentBalance } = processedInstallment;
                console.log(` ---- > remainingAmount: ${isNaN(remainingAmount) ? 'NaN' : remainingAmount} - amountToApply: ${amountToApply} - newAccountBalance: ${newAccountBalance} - newInstallmentBalance: ${newInstallmentBalance}`);
                remainingAmount = roundToTwoDecimals(remainingAmount - amountToApply);
                accountTotalPaid = roundToTwoDecimals(accountTotalPaid + amountToApply);
                account.arBalance = newAccountBalance;

                paidInstallments.push({
                    number: installment.installmentNumber,
                    id: installment.id,
                    amount: roundToTwoDecimals(amountToApply),
                    status: newInstallmentBalance <= THRESHOLD ? 'paid' : 'partial',
                    remainingBalance: newInstallmentBalance
                });
            }

           await updateAccount(batch, user, account);

            const invoice = await fbGetInvoice(user.businessID, account.invoiceId);
            // Actualizar la factura con los pagos realizados
            if (invoice) {
                const invoiceRef = doc(db, "businesses", user.businessID, "invoices", account.invoiceId);
                const invoiceData = invoice.data;
                console.log("invoice data: ", invoiceData)
                invoiceData.totalPaid = roundToTwoDecimals((invoiceData.totalPaid || 0) + accountTotalPaid);
                invoiceData.balanceDue = roundToTwoDecimals(invoiceData.totalAmount - invoiceData.totalPaid);
                invoiceData.status = invoiceData.balanceDue <= THRESHOLD ? true : false;

                batch.update(invoiceRef, invoiceData);
            }

            paymentReceipt.accounts.push({
                arNumber: account.numberId,
                arId: account.id,
                invoiceNumber: invoice?.data?.numberID,
                invoiceId: invoice?.data?.id,
                paidInstallments,
                remainingInstallments: account?.totalInstallments - paidInstallments.length,
                totalInstallments: account?.totalInstallments,
                totalPaid: accountTotalPaid,
                arBalance: account?.arBalance,
            });
        }

        await batch.commit();

        paymentReceipt.change = remainingAmount > 0 ? remainingAmount : 0;

        return fbAddAccountReceivablePaymentReceipt({ user, clientId, paymentReceipt });

    } catch (error) {
        console.error('Error processing payment:', error);
        throw error; // O manejar el error de otra manera
    }
};
