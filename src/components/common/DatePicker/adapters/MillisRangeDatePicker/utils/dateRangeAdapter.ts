import { DateTime } from 'luxon';

import { DATE_LOCALE } from '../../../constants/dateLocale';

export type DateRangeValue = {
  startDate: number | null;
  endDate: number | null;
};

export type RangePickerValue = [DateTime, DateTime] | null;

type CompleteDateRangeValue = {
  startDate: number;
  endDate: number;
};

export const getDefaultDates = (): CompleteDateRangeValue => {
  const today = DateTime.local().setLocale(DATE_LOCALE).startOf('day');

  return {
    startDate: today.toMillis(),
    endDate: today.endOf('day').toMillis(),
  };
};

export const getEmptyDates = (): DateRangeValue => {
  return {
    startDate: null,
    endDate: null,
  };
};

export const hasDateRangeValue = (
  dates: DateRangeValue | null | undefined,
): dates is CompleteDateRangeValue => {
  return (
    typeof dates?.startDate === 'number' &&
    typeof dates?.endDate === 'number'
  );
};

export const toRangePickerValue = (
  dates: DateRangeValue | null | undefined,
): RangePickerValue => {
  if (!hasDateRangeValue(dates)) {
    return null;
  }

  return [
    DateTime.fromMillis(dates.startDate).setLocale(DATE_LOCALE),
    DateTime.fromMillis(dates.endDate).setLocale(DATE_LOCALE),
  ];
};

export const toDateRangeValue = (dates: RangePickerValue): DateRangeValue => {
  if (!dates) {
    return getEmptyDates();
  }

  return {
    startDate: dates[0].startOf('day').toMillis(),
    endDate: dates[1].endOf('day').toMillis(),
  };
};
