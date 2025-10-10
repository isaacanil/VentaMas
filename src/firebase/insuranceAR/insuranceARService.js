import { collection, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";

import { calculateAmountPerInstallment } from "../../utils/accountsReceivable/accountsReceivable";
import { generatePaymentDates } from "../../utils/accountsReceivable/generatePaymentDates";
import { db } from "../firebaseconfig";

export async function fbAddInsuranceAR({ user, insuranceData }) {
    try {
        if (!user || !user.businessID) {
            throw new Error('Usuario no autenticado o datos de negocio no disponibles');
        }

        if (!insuranceData) {
            throw new Error('No hay datos de seguro para procesar');
        }

        const { invoiceId, insurancePaymentFrequency, insuranceTotalInstallments, amount } = insuranceData;

        const insuranceAR = {
            businessId: user.businessID,
            createdAt: Timestamp.now(),
            invoiceId,
            frequency: insurancePaymentFrequency,
            totalInstallments: insuranceTotalInstallments,
            amount: amount || 0,
            status: 'active',
            type: 'insurance',
            installmentsCompleted: 0,
        };

        const insuranceARRef = collection(db, "insuranceAR");
        const docRef = await addDoc(insuranceARRef, insuranceAR);
        
        return {
            ...insuranceAR,
            id: docRef.id
        };
    } catch (error) {
        console.error("Error al agregar seguro AR:", error);
        throw error;
    }
}

export async function fbAddInstallmentInsuranceAR({ user, insuranceAR }) {
    try {
        if (!user || !user.businessID) {
            throw new Error('Usuario no autenticado o datos de negocio no disponibles');
        }

        if (!insuranceAR || !insuranceAR.id) {
            throw new Error('No hay datos de seguro AR para procesar');
        }

        const { frequency, totalInstallments, amount, id } = insuranceAR;
        const installmentAmount = calculateAmountPerInstallment(amount, totalInstallments);
        const paymentDates = generatePaymentDates(frequency, totalInstallments);

        const installments = paymentDates.map((date, index) => ({
            insuranceARId: id,
            businessId: user.businessID,
            createdAt: Timestamp.now(),
            dueDate: Timestamp.fromMillis(date),
            installmentNumber: index + 1,
            amount: installmentAmount,
            status: 'pending',
            type: 'insurance'
        }));

        const installmentARCollection = collection(db, "installmentInsuranceAR");
        
        const promises = installments.map(installment => addDoc(installmentARCollection, installment));
        await Promise.all(promises);

        return true;
    } catch (error) {
        console.error("Error al agregar cuotas de seguro AR:", error);
        throw error;
    }
}

export async function fbCheckActiveInsuranceAR({ user, clientId }) {
    try {
        if (!user || !user.businessID || !clientId) {
            return { activeInsuranceARCount: 0 };
        }

        const insuranceARRef = collection(db, "insuranceAR");
        const q = query(
            insuranceARRef,
            where("businessId", "==", user.businessID),
            where("clientId", "==", clientId),
            where("status", "==", "active")
        );

        const querySnapshot = await getDocs(q);
        return { activeInsuranceARCount: querySnapshot.size };
    } catch (error) {
        console.error("Error al verificar seguros AR activos:", error);
        return { activeInsuranceARCount: 0 };
    }
}