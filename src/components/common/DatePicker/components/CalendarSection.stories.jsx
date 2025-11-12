import dayjs from 'dayjs';
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

const today = dayjs();

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
    value: [today.startOf('day'), today.add(7, 'day').endOf('day')],
    currentRangeStart: today.startOf('day'),
    currentRangeEnd: today.add(7, 'day').endOf('day'),
  },
};

export const RangeInProgress = {
  args: {
    ...Default.args,
    mode: 'range',
    value: [today.startOf('day'), null],
    currentRangeStart: today.startOf('day'),
    currentRangeEnd: null,
    hoverDate: today.add(5, 'day'),
  },
};

export const PreviousMonth = {
  args: {
    ...Default.args,
    currentDate: today.subtract(1, 'month'),
    value: today.subtract(1, 'month').date(15),
  },
};

export const NextMonth = {
  args: {
    ...Default.args,
    currentDate: today.add(1, 'month'),
    value: today.add(1, 'month').date(10),
  },
};
