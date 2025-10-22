import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

export const UtilityHeader = ({
    rangeLabel,
    rangeDetailLabel,
    presetLabel,
    selectedRange,
    onPresetSelect,
}) => {
    const [draftRange, setDraftRange] = useState(null);

    useEffect(() => {
        setDraftRange(null);
    }, [selectedRange?.startDate, selectedRange?.endDate]);

    const pickerValue = useMemo(() => {
        if (draftRange) return draftRange;
        if (!selectedRange?.startDate || !selectedRange?.endDate) return null;
        return [dayjs(selectedRange.startDate), dayjs(selectedRange.endDate)];
    }, [draftRange, selectedRange]);

    const handleDateChange = useCallback(
        (value) => {
            if (!value || !Array.isArray(value)) {
                setDraftRange(null);
                onPresetSelect('today');
                return;
            }

            const [startValue, endValue] = value;

            if (!startValue && !endValue) {
                setDraftRange(null);
                onPresetSelect('today');
                return;
            }

            if (startValue && !endValue) {
                setDraftRange([startValue, null]);
                return;
            }

            if (!startValue || !endValue) {
                setDraftRange(null);
                return;
            }

            setDraftRange(null);

            const start = startValue.startOf('day').valueOf();
            const end = endValue.endOf('day').valueOf();

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
                {(rangeDetailLabel || rangeLabel || presetLabel) && (
                    <RangeInfo>
                        <SimpleTypography size="small" color="secondary">
                            Rango seleccionado
                        </SimpleTypography>
                        {presetLabel && <PresetPill>{presetLabel}</PresetPill>}
                    </RangeInfo>
                )}
                {(rangeDetailLabel || rangeLabel) && (
                    <SimpleTypography size="small" color="secondary">
                        {rangeDetailLabel ?? rangeLabel}
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

const RangeInfo = styled.div`
    display: inline-flex;
    align-items: center;
    gap: ${spacing.sm};
    flex-wrap: wrap;
`;

const PresetPill = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 ${spacing.sm};
    min-height: 24px;
    border-radius: ${radii.pill};
    background: ${colors.brand.subtle};
    color: ${colors.brand.primary};
    font-size: ${typography.caption.fontSize};
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: capitalize;
`;
