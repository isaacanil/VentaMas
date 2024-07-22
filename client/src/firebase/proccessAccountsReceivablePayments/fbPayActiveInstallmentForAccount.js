import { collection, doc, setDoc, Timestamp, writeBatch, getDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";
import { defaultPaymentsAR } from "../../schema/accountsReceivable/paymentAR";
import { fbAddPayment } from "../accountsReceivable/payment/fbAddPayment";
import { fbAddAccountReceivablePaymentReceipt } from "../accountsReceivable/fbAddAccountReceivablePaymentReceipt";
import { fbGetInvoice } from "../invoices/fbGetInvoice";
// Function to get a specific account by its ID
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

// Function to get the oldest active installment for a specific account
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

// Function to round to two decimal places
const roundToTwo = (num) => Math.round(num * 100) / 100;



// Function to process the payment for the oldest active installment
export const fbPayActiveInstallmentForAccount = async ({ user, paymentDetails }) => {
    try {
        const { clientId, totalAmount: paymentAmount, arId, paymentMethods, comments, totalPaid } = paymentDetails;

        const paymentAmountFloat = roundToTwo(parseFloat(paymentAmount));
        const totalPaidFloat = roundToTwo(parseFloat(totalPaid));

        if (!paymentAmountFloat || paymentAmountFloat <= 0) {
            console.log('Invalid payment amount.');
            return;
        }

        if (totalPaidFloat !== paymentAmountFloat) {
            throw new Error('Total paid and total amount are not equal.');
        }

        const account = await getClientAccountById(user, arId);

        if (!account) {
            console.log('No active account found for the client.');
            return;
        }

        const installment = await getOldestActiveInstallmentByArId(user, account.id);

        if (!installment) {
            console.log('No active installment found for the account.');
            return;
        }

        const payment = await fbAddPayment(user, paymentDetails);

        const batch = writeBatch(db);

        // Handle the balance during payment
        let amountToApply = roundToTwo(Math.min(paymentAmountFloat, parseFloat(installment.installmentBalance ?? 0)));
        let newInstallmentBalance = roundToTwo(parseFloat(installment.installmentBalance ?? 0) - amountToApply);
        let newAccountBalance = roundToTwo(parseFloat(account.arBalance ?? 0) - amountToApply);

        // Adjust for any small rounding difference
        if (Math.abs(newAccountBalance) < 0.01) {
            newAccountBalance = 0;
        }
        if (Math.abs(newInstallmentBalance) < 0.01) {
            newInstallmentBalance = 0;
        }

        const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", account.id);
        const installmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.id);
        const installmentPaymentRef = doc(collection(db, "businesses", user.businessID, "accountsReceivableInstallmentPayments"));

        batch.update(installmentRef, {
            installmentBalance: newInstallmentBalance,
            isActive: newInstallmentBalance > 0
        });

        if (newInstallmentBalance <= 0) {
            const updatedPaidInstallments = [...(account.paidInstallments || []), installment.id];
            batch.update(accountsReceivableRef, {
                arBalance: newAccountBalance,
                lastPaymentDate: Timestamp.now(),
                lastPayment: amountToApply,
                isActive: newAccountBalance > 0,
                isClosed: newAccountBalance <= 0,
                paidInstallments: updatedPaidInstallments
            });
        }

        batch.set(installmentPaymentRef, {
            ...defaultPaymentsAR,
            installmentPaymentId: nanoid(),
            installmentId: installment.id,
            paymentId: payment.id,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            paymentAmount: amountToApply,
            createdBy: user.uid,
            user: {
                id: user.uid,
                displayName: user.displayName
            },
            updatedBy: user.uid,
            isActive: true,
            clientId: clientId,
            arId: account.id,
        });

        await batch.commit();

        // Check if there's a small remaining balance due to rounding
        const remainingAmount = roundToTwo(paymentAmountFloat - amountToApply);
        if (remainingAmount > 0) {
            const adjustmentBatch = writeBatch(db); // Create a new batch for the adjustment
            const adjustmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.id);
            adjustmentBatch.update(adjustmentRef, {
                installmentBalance: roundToTwo(newInstallmentBalance + remainingAmount)
            });
            await adjustmentBatch.commit();
            console.log(`Payment completed with adjustment. Remaining amount adjusted: ${remainingAmount}`);
        } else {
            console.log('Payment completed with no remaining amount.');
        }
        const invoice = await fbGetInvoice(user.businessID, account.invoiceId)
        // Create payment receipt data
        const paymentReceipt = {
            accounts: [
                {
                    arNumber: account.numberId,
                    invoiceNumber: invoice?.data?.numberID,
                    invoiceId: invoice?.data?.id,
                    arId: account.id,
                    paidInstallments: [
                        {
                            number: installment.installmentNumber,
                            id: installment.id,
                            amount: amountToApply,
                            status: 'paid'
                        }
                    ],
                    remainingInstallments: account?.totalInstallments - account?.paidInstallments?.length,
                    totalInstallments: account.totalInstallments,
                    totalPaid: amountToApply,
                    arBalance: newAccountBalance,
                }
            ],
            totalAmount: paymentAmount, // Total amount paid
            paymentMethod: paymentMethods,
            change: roundToTwo(paymentAmountFloat - amountToApply)
        };

        const receipt = await fbAddAccountReceivablePaymentReceipt({ user, clientId, paymentReceipt });

        return receipt

    } catch (error) {
        console.error("Error processing payment for oldest active installment:", error);
        throw error;
    }
};
