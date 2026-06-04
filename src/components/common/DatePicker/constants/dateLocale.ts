import { DateTime } from 'luxon';

export const DATE_LOCALE = 'es';

export const getLocalizedNow = () => DateTime.local().setLocale(DATE_LOCALE);
