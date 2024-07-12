import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp, runTransaction } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from '../firebaseconfig';
import { defaultInstallmentPaymentsAR } from "../../schema/accountsReceivable/installmentPaymentsAR";
import { defaultPaymentsAR } from "../../schema/accountsReceivable/paymentAR";

const THRESHOLD = 1e-10;

const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

const getInstallmentsByArId = async (user, arId) => {
    const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
    const q = query(installmentsRef, where('arId', '==', arId), orderBy('installmentDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fbPayAllInstallmentsForAccount = async ({ user, paymentDetails }) => {
    const { totalPaid, arId, clientId, paymentMethods, comments } = paymentDetails;
    
    try {
        // Fetch all necessary data outside the transaction
        const accountInstallments = await getInstallmentsByArId(user, arId);
        const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", arId);
        const accountSnapshot = await getDoc(accountsReceivableRef);

        if (!accountSnapshot.exists()) {
            throw new Error("Account not found");
        }

        const accountData = accountSnapshot.data();

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
                clientId,
                createdUserId: user?.uid,
                updatedUserId: user?.uid,
                isActive: true
            };

            transaction.set(paymentsRef, paymentData);

            const paidInstallments = [];
            const installmentUpdates = [];
            const installmentPayments = [];

            let initialArBalance = 0;

            for (let installment of accountInstallments) {
                initialArBalance += installment.installmentBalance;

                if (remainingAmount <= THRESHOLD) break;

                const amountToApply = Math.min(remainingAmount, installment.installmentBalance);
                const newInstallmentBalance = roundToTwoDecimals(installment.installmentBalance - amountToApply);

                installmentUpdates.push({
                    ref: doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.id),
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
                        installmentId: installment.id,
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
                    paidInstallments.push(installment.id);
                }

                remainingAmount = roundToTwoDecimals(remainingAmount - amountToApply);
            }

            let newArBalance = roundToTwoDecimals(initialArBalance - totalPaid);

            if (newArBalance < 0) {
                remainingAmount = -newArBalance;
                newArBalance = 0;
            } else {
                remainingAmount = 0;
            }

            const updatedPaidInstallments = [
                ...(accountData.paidInstallments || []), 
                ...paidInstallments
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
                receiptId: nanoid(),
                paymentId,
                clientId,
                arId,
                businessId: user.businessID,
                createdAt: Timestamp.now(),
                createdBy: user.uid,
                accounts: [{
                    arNumber: accountData.numberId,
                    arId: accountData.arId,
                    paidInstallments: paidInstallments.map(id => ({
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

            // Save the receipt in Firestore
            const receiptRef = doc(db, "businesses", user.businessID, "paymentReceipts", paymentReceipt.receiptId);
            transaction.set(receiptRef, paymentReceipt);

            return paymentReceipt;
        });
    } catch (error) {
        console.error("Error processing payment for all installments:", error);
        throw error;
    }
};