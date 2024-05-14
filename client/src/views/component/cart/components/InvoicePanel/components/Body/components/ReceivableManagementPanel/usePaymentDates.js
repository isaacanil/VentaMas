import { DateTime } from "luxon";

const usePaymentDates = (frequency, installments, startDate = DateTime.now()) => {
    const MAX_INSTALLMENTS = 3000

    if (installments >= MAX_INSTALLMENTS) {
        return {
            paymentDates: 0,
            nextPaymentDate: 0
        }
    }

    const calculateInterval = (freq) => {
        switch (freq) {
            case 'monthly':
                return { months: 1 };
            case 'weekly':
                return { weeks: 1 };
            case 'annual':
                return { years: 1 };
            default:
                return { days: 0 }; // Fallback, aunque sería mejor manejar un error aquí
        }
    };

    const calculatePaymentDates = () => {
        let dates = [];
        let interval = calculateInterval(frequency);

        for (let i = 0; i < installments; i++) {
            dates.push(startDate.plus({ ...interval, [Object.keys(interval)[0]]: i + 1 }).toMillis());
        }

        return dates;
    };

    const getNextPaymentDate = (paymentDates) => {
        const today = DateTime.now().toMillis();
        return paymentDates.find(date => date > today) || null;
    };

    const paymentDates = calculatePaymentDates();
    const nextPaymentDate = getNextPaymentDate(paymentDates);

    return { paymentDates, nextPaymentDate };
};

export default usePaymentDates;
