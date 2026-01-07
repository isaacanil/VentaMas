// @ts-nocheck
import { message } from 'antd';

// Funciones auxiliares seguras
export const formatCurrency = (value) => {
    return typeof value === 'number' ? `$${value.toFixed(2)}` : 'N/A';
};

// Actualizar formatDate para manejar timestamps de Firestore
export const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        // Si es timestamp de Firestore
        if (timestamp?.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
        // Si es timestamp normal
        return new Date(timestamp).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return 'N/A';
    }
};

export const calculateProgress = (data) => {
    const total = data?.ar?.totalReceivable || data?.ar?.totalAmount || 0;
    const balance =
        data?.ar?.arBalance ??
        data?.ar?.currentBalance ??
        data?.ar?.balance ??
        total;

    if (total <= 0) return 0;

    const paid = total - balance;
    const percentage = (paid / total) * 100;

    return Math.min(Math.max(percentage, 0), 100);
};

// Función para copiar al portapapeles
export const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard
        .writeText(text)
        .then(() => {
            message.success(`${label} copiado al portapapeles`);
        })
        .catch(() => {
            message.success(`${label} copiado al portapapeles`);
        });
};

// Función para abrir WhatsApp
export const openWhatsApp = (phone, clientName) => {
    if (!phone) return;
    const cleanPhone = String(phone).replace(/\D/g, '');
    const defaultMessage = `Hola ${clientName}, le contactamos sobre su cuenta pendiente.`;
    window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`,
        '_blank',
    );
};

// Función para traducir frecuencia
export const translateFrequency = (frequency) => {
    const translations = {
        monthly: 'Mensual',
        weekly: 'Semanal',
        biweekly: 'Quincenal',
        daily: 'Diario',
    };
    return translations[frequency] || frequency;
};

// Función para calcular días de retraso
export const getDaysLate = (nextPaymentDate) => {
    if (!nextPaymentDate) return 0;
    const today = new Date();
    const diffTime = today - nextPaymentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
};

// Modificar getNextPaymentInfo para verificar pagos reales
export const getNextPaymentInfo = (data) => {
    if (!data?.installments || !data?.ar) return { date: null, status: 'N/A' };

    // Ordenar instalments por fecha
    const sortedInstallments = [...data.installments].sort(
        (a, b) =>
            (a.installmentDate?.seconds || 0) - (b.installmentDate?.seconds || 0),
    );

    // Encontrar la próxima cuota pendiente
    const nextPendingInstallment = sortedInstallments.find(
        (inst) => inst.installmentBalance > 0,
    );

    // Si no hay cuotas pendientes
    if (!nextPendingInstallment) {
        return {
            date: null,
            isPaid: true,
            isLate: false,
            status: 'COMPLETADO',
            installmentNumber: null,
        };
    }

    const nextPaymentDate = new Date(
        nextPendingInstallment.installmentDate.seconds * 1000,
    );
    const today = new Date();
    const isLate = nextPaymentDate < today;

    return {
        date: nextPaymentDate,
        isPaid: false,
        isLate,
        status: isLate ? 'ATRASADO' : 'PENDIENTE',
        installmentNumber: nextPendingInstallment.installmentNumber,
        amount: nextPendingInstallment.installmentAmount,
    };
};
