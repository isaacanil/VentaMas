import dayjs from 'dayjs';
import 'dayjs/locale/es';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(weekday);
dayjs.locale('es');

// Configurar para que la semana empiece en domingo
const locale = dayjs.Ls.es;
if (locale) {
    locale.weekStart = 0; // 0 = domingo
}

export const formatDisplayValue = (value, format = 'DD/MM/YYYY', mode = 'single') => {
    if (!value) return '';
    
    if (mode === 'range' && Array.isArray(value)) {
        if (value[0] && dayjs.isDayjs(value[0]) && value[1] && dayjs.isDayjs(value[1])) {
            return `${value[0].format(format)} - ${value[1].format(format)}`;
        } else if (value[0] && dayjs.isDayjs(value[0])) {
            return `${value[0].format(format)} - ...`;
        }
        return '';
    }
    
    return value && dayjs.isDayjs(value) && value.format ? value.format(format) : '';
};

export const renderCalendarGrid = (currentDate) => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');

    const days = [];
    let day = startOfWeek;

    while (day.isBefore(endOfWeek) || day.isSame(endOfWeek, 'day')) {
        days.push(day);
        day = day.add(1, 'day');
    }

    return days;
};

export const isPresetActive = (value, preset, mode) => {
    if (!value) return false;
    
    if (mode === 'single' && dayjs.isDayjs(value)) {
        return dayjs(value).isSame(preset.value, 'day');
    } else if (
        mode === 'range' &&
        Array.isArray(value) &&
        Array.isArray(preset.value) &&
        value[0] && value[1]
    ) {
        const [vStart, vEnd] = value;
        const [pStart, pEnd] = preset.value;
        if (pStart && pEnd) {
            return vStart.isSame(pStart, 'day') && vEnd.isSame(pEnd, 'day');
        }
    }
    
    return false;
}; 