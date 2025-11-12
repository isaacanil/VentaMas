import { DateTime } from "luxon";

/**
 * Calcula las fechas de pago y la próxima fecha de pago basado en la frecuencia y número de cuotas
 * Esta es una función normal, no un hook de React
 * 
 * @param {string} frequency - Frecuencia de pago ('monthly', 'weekly', 'annual', etc)
 * @param {number} installments - Número de cuotas
 * @param {DateTime|number|null} customStartDate - Fecha de inicio opcional (DateTime, timestamp en milisegundos o null)
 * @returns {Object} Objeto con paymentDates y nextPaymentDate
 */
const calculatePaymentDates = (frequency, installments, customStartDate = null) => {
    const MAX_INSTALLMENTS = 3000;

    // Normalizar la fecha de inicio
    const getStartDate = () => {
        if (customStartDate) {
            return typeof customStartDate === 'number'
                ? DateTime.fromMillis(customStartDate).startOf('day')
                : customStartDate.startOf('day');
        }
        return DateTime.now().startOf('day');
    };

    const startDate = getStartDate();

    // Validar número de cuotas
    if (installments >= MAX_INSTALLMENTS) {
        return {
            paymentDates: [],
            nextPaymentDate: null
        };
    }

    // Determinar intervalo según frecuencia
    const getInterval = (freq) => {
        switch (freq) {
            case 'monthly':
                return { months: 1 };
            case 'weekly':
                return { weeks: 1 };
            case 'biweekly':
                return { weeks: 2 };
            case 'annual':
                return { years: 1 };
            case 'quarterly':
                return { months: 3 };
            case 'daily':
                return { days: 1 };
            default:
                return { days: 0 };
        }
    };

    const interval = getInterval(frequency);

    // Calcular todas las fechas de pago
    const dates = [];
    for (let i = 0; i < installments; i++) {
        dates.push(
            startDate
                .plus({ ...interval, [Object.keys(interval)[0]]: i + 1 })
                .toMillis()
        );
    }

    // Encontrar la próxima fecha de pago (a partir de hoy)
    const today = DateTime.now().startOf('day').toMillis();
    const nextPayment = dates.find(date => date >= today) || null;

    return {
        paymentDates: dates,
        nextPaymentDate: nextPayment
    };
};

/**
 * Formatea una fecha de timestamp a string con formato local
 * 
 * @param {number} timestamp - Timestamp en milisegundos
 * @param {string} format - Formato deseado (por defecto: 'dd/MM/yyyy')
 * @returns {string} Fecha formateada
 */
const formatPaymentDate = (timestamp, format = 'dd/MM/yyyy') => {
    if (!timestamp) return '';
    return DateTime.fromMillis(timestamp).toFormat(format);
};

/**
 * Obtiene un array de fechas formateadas a partir de timestamps
 * 
 * @param {Array<number>} dates - Array de timestamps
 * @param {string} format - Formato deseado (por defecto: 'dd/MM/yyyy')
 * @returns {Array<string>} Array de fechas formateadas
 */
const getFormattedDates = (dates, format = 'dd/MM/yyyy') => {
    if (!dates || !Array.isArray(dates)) return [];
    return dates.map(date => formatPaymentDate(date, format));
};

export {
    calculatePaymentDates,
    formatPaymentDate,
    getFormattedDates
};
