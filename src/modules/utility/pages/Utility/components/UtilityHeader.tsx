import { DateTime } from 'luxon';
import { useCallback, useMemo, useState, type JSX } from 'react';
import styled from 'styled-components';

import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import { designSystemV2 } from '@/theme/designSystemV2';
import { getDateRange } from '@/utils/date/getDateRange';
import { SimpleTypography } from '@/components/ui/Typografy/SimpleTypography';
import type {
  UtilityDateRange,
  UtilityPresetKey,
} from '@/modules/utility/pages/Utility/types';

const { colors, spacing, radii, shadows, typography } = designSystemV2;

const PRESET_KEYS: UtilityPresetKey[] = [
  'today',
  'yesterday',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'lastYear',
];

const detectPresetKey = (
  start: number,
  end: number,
): UtilityPresetKey | null => {
  for (const key of PRESET_KEYS) {
    const range = getDateRange(key);
    if (range.startDate === start && range.endDate === end) {
      return key;
    }
  }
  return null;
};

type DatePickerRangeValue = [DateTime | null, DateTime | null];

type DatePickerValue = DatePickerRangeValue | null;

interface UtilityHeaderProps {
  rangeLabel: string;
  rangeDetailLabel: string;
  presetLabel: string;
  selectedRange: UtilityDateRange;
  onPresetSelect: (key: UtilityPresetKey, range?: UtilityDateRange) => void;
}

export const UtilityHeader = ({
  rangeLabel,
  rangeDetailLabel,
  presetLabel,
  selectedRange,
  onPresetSelect,
}: UtilityHeaderProps): JSX.Element => {
  const rangeTrigger = `${selectedRange?.startDate}-${selectedRange?.endDate}`;
  const [{ trigger: draftTrigger, value: draftValue }, setDraftState] =
    useState<{ trigger: string; value: DatePickerValue }>(() => ({
      trigger: rangeTrigger,
      value: null,
    }));

  const draftRange = draftTrigger === rangeTrigger ? draftValue : null;

  const setDraftRange = useCallback(
    (value: DatePickerValue) => setDraftState({ trigger: rangeTrigger, value }),
    [rangeTrigger],
  );

  const pickerValue = useMemo(() => {
    if (draftRange) return draftRange;
    if (!selectedRange?.startDate || !selectedRange?.endDate) return null;
    return [
      DateTime.fromMillis(selectedRange.startDate),
      DateTime.fromMillis(selectedRange.endDate),
    ];
  }, [draftRange, selectedRange]);

  const handleDateChange = useCallback(
    (value: DatePickerValue) => {
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

      const start = startValue.startOf('day').toMillis();
      const end = endValue.endOf('day').toMillis();

      const detectedPreset = detectPresetKey(start, end);
      if (detectedPreset) {
        onPresetSelect(detectedPreset);
        return;
      }

      onPresetSelect('custom', { startDate: start, endDate: end });
    },
    [onPresetSelect, setDraftRange],
  );

  return (
    <Header>
      <TitleGroup>
        <SimpleTypography as="h2" size="large" weight="bold">
          Utilidad y desempeño
        </SimpleTypography>
        <SimpleTypography size="medium" color="secondary">
          Visualiza tus ventas, costos, impuestos y resultado neto en el rango
          seleccionado.
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
            className="utility-range-picker"
            style={{ width: '100%' }}
          />
        </PickerCard>
      </Filters>
    </Header>
  );
};

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.lg};
  align-items: flex-start;
  justify-content: space-between;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.md};
  align-items: center;
  justify-content: flex-end;
`;

const PickerCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
  min-width: 260px;
  padding: ${spacing.md};
  background: ${colors.background.surface};
  border: 1px solid ${colors.stroke.soft};
  border-radius: ${radii.md};
  box-shadow: ${shadows.sm};
`;

const ControlLabel = styled.span`
  font-size: ${typography.caption.fontSize};
  font-weight: ${typography.caption.fontWeight};
  line-height: ${typography.caption.lineHeight};
  color: ${colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const RangeInfo = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${spacing.sm};
  align-items: center;
`;

const PresetPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 ${spacing.sm};
  font-size: ${typography.caption.fontSize};
  font-weight: 600;
  color: ${colors.brand.primary};
  text-transform: capitalize;
  letter-spacing: 0.02em;
  background: ${colors.brand.subtle};
  border-radius: ${radii.pill};
`;
