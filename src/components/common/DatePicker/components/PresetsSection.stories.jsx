import dayjs from 'dayjs';
import { fn } from 'storybook/test';

import { createDefaultPresets } from '../constants/presets';

import { PresetsSection } from './PresetsSection';

export default {
    title: 'Components/DatePicker/PresetsSection',
    component: PresetsSection,
    parameters: {
        layout: 'centered',
        // autodocs
    },
    tags: ['autodocs'],
    argTypes: {
        mode: {
            control: { type: 'select' },
            options: ['single', 'range'],
            description: 'Modo del DatePicker'
        },
        isMobile: {
            control: { type: 'boolean' },
            description: 'Vista móvil'
        }
    }
};

const samplePresets = createDefaultPresets('single');

export const Default = {
    args: {
        presets: samplePresets,
        value: null,
        mode: 'single',
        isMobile: false,
        onPresetClick: fn(),
        showPresetsDropdown: false,
        setShowPresetsDropdown: fn(),
        presetsDropdownRef: { current: null }
    }
};

export const WithSelectedPreset = {
    args: {
        ...Default.args,
        value: dayjs().startOf('day') // "Hoy" seleccionado
    }
};

export const RangeMode = {
    args: {
        ...Default.args,
        presets: createDefaultPresets('range'),
        mode: 'range',
        value: [dayjs().startOf('day'), dayjs().endOf('day')] // "Hoy" en modo range
    }
};

export const Mobile = {
    args: {
        ...Default.args,
        isMobile: true
    }
};

export const WithDropdownOpen = {
    args: {
        ...Default.args,
        showPresetsDropdown: true
    }
};

export const FewPresets = {
    args: {
        ...Default.args,
        presets: samplePresets.slice(0, 3) // Solo 3 presets, sin dropdown
    }
}; 