import { useMemo } from 'react';
import { getDateRange } from '../../../../../utils/date/getDateRange';

export const useMenuOptions = () => {
    return useMemo(() => {    
        const menuOptions = [
            { label: 'Hoy', ...getDateRange('today'), category: 'General' },
            { label: 'Ayer', ...getDateRange('yesterday'), category: 'General' },
            { label: 'Esta semana', ...getDateRange('thisWeek'), category: 'Semana' },
            { label: 'La semana pasada', ...getDateRange('lastWeek'), category: 'Semana' },
            { label: 'Este mes', ...getDateRange('thisMonth'), category: 'Mes' },
            { label: 'El mes pasado',...getDateRange('lastMonth'), category: 'Mes' },
            { label: 'Este año', ...getDateRange('thisYear'), category: 'Año' },
            { label: 'El año pasado', ...getDateRange('lastYear'), category: 'Año' },
            { label: 'Primer trimestre', ...getDateRange('firstQuarter'), category: 'Trimestre' },
            { label: 'Segundo trimestre', ...getDateRange('secondQuarter'), category: 'Trimestre' },
            { label: 'Tercer trimestre', ...getDateRange('thirdQuarter'), category: 'Trimestre' },
            { label: 'Cuarto trimestre', ...getDateRange('fourthQuarter'), category: 'Trimestre' },
        ]
        return { menuOptions };
    }, []);
};