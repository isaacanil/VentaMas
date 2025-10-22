import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';
import { designSystemV2 } from '../../../../theme/designSystemV2';
import { DatePicker } from '../../../../components/common/DatePicker/DatePicker';
import { getDateRange } from '../../../../utils/date/getDateRange';

const { colors, spacing, radii, shadows, typography } = designSystemV2;

const PRESET_KEYS = [
    'today',
    'yesterday',
    'thisWeek',
    'lastWeek',
    'thisMonth',
    'lastMonth',
    'thisYear',
    'lastYear',
];

const detectPresetKey = (start, end) => {
    for (const key of PRESET_KEYS) {
        const range = getDateRange(key);
        if (range.startDate === start && range.endDate === end) {
            return key;
        }
    }
    return null;
};

export const UtilityHeader = ({ rangeLabel, selectedRange, onPresetSelect }) => {
    const pickerValue = useMemo(() => {
        if (!selectedRange?.startDate || !selectedRange?.endDate) return null;
        return [dayjs(selectedRange.startDate), dayjs(selectedRange.endDate)];
    }, [selectedRange]);

    const handleDateChange = useCallback(
        (value) => {
            if (!value || !Array.isArray(value) || !value[0] || !value[1]) {
                onPresetSelect('today');
                return;
            }

            const start = value[0].startOf('day').valueOf();
            const end = value[1].endOf('day').valueOf();

            const detectedPreset = detectPresetKey(start, end);
            if (detectedPreset) {
                onPresetSelect(detectedPreset);
                return;
            }

            onPresetSelect('custom', { startDate: start, endDate: end });
        },
        [onPresetSelect]
    );

    return (
        <Header>
            <TitleGroup>
                <SimpleTypography as="h2" size="large" weight="bold">
                    Utilidad y desempeño
                </SimpleTypography>
                <SimpleTypography size="medium" color="secondary">
                    Visualiza tus ventas, costos, impuestos y resultado neto en el rango seleccionado.
                </SimpleTypography>
                {rangeLabel && (
                    <SimpleTypography size="small" color="secondary">
                        Rango seleccionado: {rangeLabel}
                    </SimpleTypography>
                )}
            </TitleGroup>

            <Filters>
                <PickerCard>
                    <ControlLabel>Rango de fechas</ControlLabel>
                    <DatePicker
                        mode="range"
                        value={pickerValue}
                        onChange={handleDateChange}
                        placeholder="Selecciona el rango"
                        allowClear
                        style={{ width: '100%' }}
                    />
                </PickerCard>
            </Filters>
        </Header>
    );
};

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${spacing.lg};
    flex-wrap: wrap;
`;

const TitleGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xs};
`;

const Filters = styled.div`
    display: flex;
    gap: ${spacing.md};
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
`;

const PickerCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xs};
    min-width: 260px;
    padding: ${spacing.md};
    background: ${colors.background.surface};
    border-radius: ${radii.md};
    border: 1px solid ${colors.stroke.soft};
    box-shadow: ${shadows.sm};
`;

const ControlLabel = styled.span`
    font-size: ${typography.caption.fontSize};
    line-height: ${typography.caption.lineHeight};
    font-weight: ${typography.caption.fontWeight};
    color: ${colors.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;
