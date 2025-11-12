import { fn } from 'storybook/test';

import { DatePicker } from './DatePicker';

export default {
    title: 'Components/DatePicker',
    component: DatePicker,
    parameters: {
        layout: 'centered',
        docs: {
            canvas: {
                height: '550px', // espacio suficiente para el calendario
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        mode: {
            control: { type: 'select' },
            options: ['single', 'range'],
            description: 'Modo de selección de fecha' // 'single' o 'range'
        },
        size: {
            control: { type: 'select' },
            options: ['small', 'middle', 'large'],
            description: 'Tamaño del input'
        },
        disabled: {
            control: { type: 'boolean' },
            description: 'Deshabilitar control'
        },
        allowClear: {
            control: { type: 'boolean' },
            description: 'Permitir limpiar valor'
        }
    }
};

const Template = (args) => <DatePicker {...args} />;

export const Default = {
  render: Template,
  args: {
    mode: 'single',
    placeholder: 'Seleccionar fecha',
    format: 'DD/MM/YYYY',
    allowClear: true,
    size: 'middle',
    disabled: false,
    onChange: fn()
  }
};

export const Range = {
  render: Template,
  args: {
    ...Default.args,
    mode: 'range',
    placeholder: 'Seleccionar rango de fechas',
    onChange: fn()
  }
};

export const Disabled = {
  render: Template,
  args: {
    ...Default.args,
    disabled: true,
    onChange: fn()
  }
}; 