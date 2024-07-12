import { db } from "../firebaseconfig";
import { collection, query, where, orderBy, getDocs, doc, setDoc, getDoc, Timestamp, runTransaction } from "firebase/firestore";
import { nanoid } from "nanoid";
import { defaultInstallmentPaymentsAR } from "../../schema/accountsReceivable/installmentPaymentsAR";
import { defaultPaymentsAR } from "../../schema/accountsReceivable/paymentAR";
import { fbGetInvoice } from "../invoices/fbGetInvoice";

const THRESHOLD = 1e-10;

const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

const getInstallmentsByArId = async (user, arId) => {
    const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
    const q = query(installmentsRef, where('arId', '==', arId), orderBy('installmentDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fbApplyPartialPaymentToAccount = async ({ user, paymentDetails }) => {
    const { totalPaid, clientId, arId, paymentMethods, comments } = paymentDetails;

    try {
        // Fetch all necessary data outside the transaction
        const accountInstallments = await getInstallmentsByArId(user, arId);
        const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", arId);
        const accountSnapshot = await getDoc(accountsReceivableRef);

        if (!accountSnapshot.exists()) {
            throw new Error("Account not found");
        }

        const accountData = accountSnapshot.data();
        const invoice = await fbGetInvoice(user.businessID, accountData.invoiceId);

        return await runTransaction(db, async (transaction) => {
            let remainingAmount = totalPaid;
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

            transaction.set(paymentsRef, paymentData);

            const paidInstallments = new Set();
            const installmentUpdates = [];
            const installmentPayments = [];

            for (const installment of accountInstallments) {
                if (remainingAmount <= THRESHOLD) break;

                const amountToApply = Math.min(remainingAmount, installment.installmentBalance);
                const newInstallmentBalance = roundToTwoDecimals(installment.installmentBalance - amountToApply);

                installmentUpdates.push({
                    ref: doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.installmentId),
                    data: { 
                        installmentBalance: newInstallmentBalance, 
                        isActive: newInstallmentBalance > THRESHOLD
                    }
                });

                installmentPayments.push({
                    ref: doc(collection(db, "businesses", user.businessID, "accountsReceivableInstallmentPayments")),
                    data: {
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
                        clientId,
                        arId,
                    }
                });

                if (newInstallmentBalance <= THRESHOLD) {
                    paidInstallments.add(installment.id);
                }

                remainingAmount = roundToTwoDecimals(remainingAmount - amountToApply);
            }

            let newArBalance = roundToTwoDecimals(accountData.arBalance - totalPaid);

            if (newArBalance < 0) {
                remainingAmount = -newArBalance;
                newArBalance = 0;
            } else {
                remainingAmount = 0;
            }

            const updatedPaidInstallments = [
                ...(accountData.paidInstallments || []), 
                ...Array.from(paidInstallments)
            ];

            transaction.update(accountsReceivableRef, {
                arBalance: newArBalance,
                lastPaymentDate: Timestamp.now(),
                lastPayment: totalPaid,
                isActive: newArBalance > THRESHOLD,
                isClosed: newArBalance <= THRESHOLD,
                paidInstallments: updatedPaidInstallments
            });

            // Apply all updates
            installmentUpdates.forEach(update => transaction.update(update.ref, update.data));
            installmentPayments.forEach(payment => transaction.set(payment.ref, payment.data));

            const paymentReceipt = {
                accounts: [{
                    arNumber: accountData.numberId,
                    invoiceNumber: invoice.data.numberID,
                    invoiceId: invoice.data.id,
                    arId: accountData.arId,
                    paidInstallments: Array.from(paidInstallments).map(id => ({
                        number: accountInstallments.find(installment => installment.id === id).installmentNumber,
                        id,
                        amount: roundToTwoDecimals(accountInstallments.find(installment => installment.id === id).installmentBalance),
                        status: 'paid'
                    })),
                    remainingInstallments: accountData.totalInstallments - updatedPaidInstallments.length,
                    totalInstallments: accountData.totalInstallments,
                    totalPaid: totalPaid,
                    arBalance: newArBalance,
                }],
                totalAmount: totalPaid,
                paymentMethod: paymentMethods,
                change: remainingAmount
            };

            return paymentReceipt;
        });
    } catch (error) {
        console.error("Error processing partial payment for account:", error);
        throw error;
    }
};