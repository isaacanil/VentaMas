import { fn } from 'storybook/test';

import { DatePickerInput } from './DatePickerInput';

export default {
  title: 'Components/DatePicker/DatePickerInput',
  component: DatePickerInput,
  parameters: {
    layout: 'centered',
    // descripción a través de autodocs
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
      description: 'Tamaño del input',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Estado deshabilitado del input',
    },
    allowClear: {
      control: { type: 'boolean' },
      description: 'Permite limpiar el valor',
    },
    hasValue: {
      control: { type: 'boolean' },
      description: 'Indica si el input tiene valor',
    },
  },
};

export const Default = {
  args: {
    placeholder: 'Seleccionar fecha',
    size: 'middle',
    disabled: false,
    allowClear: true,
    hasValue: false,
    value: '',
    onClick: fn(),
    onClear: fn(),
  },
};

export const WithValue = {
  args: {
    ...Default.args,
    value: '15/01/2025',
    hasValue: true,
  },
};

export const WithRangeValue = {
  args: {
    ...Default.args,
    value: '15/01/2025 - 20/01/2025',
    hasValue: true,
  },
};

export const Disabled = {
  args: {
    ...Default.args,
    disabled: true,
    value: '15/01/2025',
    hasValue: true,
  },
};

export const Small = {
  args: {
    ...Default.args,
    size: 'small',
    value: '15/01/2025',
    hasValue: true,
  },
};

export const Large = {
  args: {
    ...Default.args,
    size: 'large',
    value: '15/01/2025',
    hasValue: true,
  },
};

export const WithoutClear = {
  args: {
    ...Default.args,
    allowClear: false,
    value: '15/01/2025',
    hasValue: true,
  },
};
