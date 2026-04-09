import { DateTime } from 'luxon';
import { fn } from 'storybook/test';

import { CalendarSection } from './CalendarSection';

export default {
  title: 'Components/DatePicker/CalendarSection',
  component: CalendarSection,
  parameters: {
    layout: 'centered',
    // autodocs
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['single', 'range'],
      description: 'Modo del DatePicker',
    },
  },
};

const today = DateTime.local();

export const Default = {
  args: {
    currentDate: today,
    onNavigateMonth: fn(),
    onDateClick: fn(),
    onDateHover: fn(),
    value: null,
    mode: 'single',
    currentRangeStart: null,
    currentRangeEnd: null,
    hoverDate: null,
  },
};

export const WithSelectedDate = {
  args: {
    ...Default.args,
    value: today.startOf('day'),
  },
};

export const RangeMode = {
  args: {
    ...Default.args,
    mode: 'range',
    value: [today.startOf('day'), today.plus({ days: 7 }).endOf('day')],
    currentRangeStart: today.startOf('day'),
    currentRangeEnd: today.plus({ days: 7 }).endOf('day'),
  },
};

export const RangeInProgress = {
  args: {
    ...Default.args,
    mode: 'range',
    value: [today.startOf('day'), null],
    currentRangeStart: today.startOf('day'),
    currentRangeEnd: null,
    hoverDate: today.plus({ days: 5 }),
  },
};

export const PreviousMonth = {
  args: {
    ...Default.args,
    currentDate: today.minus({ months: 1 }),
    value: today.minus({ months: 1 }).set({ day: 15 }),
  },
};

export const NextMonth = {
  args: {
    ...Default.args,
    currentDate: today.plus({ months: 1 }),
    value: today.plus({ months: 1 }).set({ day: 10 }),
  },
};
