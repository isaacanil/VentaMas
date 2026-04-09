import {
  Button,
  Card,
  Checkbox,
  InputNumber,
  Modal,
  Select,
  Space,
} from 'antd';
import { useState } from 'react';

import {
  PAYMENT_TERMS,
  TIME_UNITS,
  type PaymentTerm,
  type TimeUnitOption,
} from '@/modules/insurance/pages/Insurance/InsuranceConfigForm/constants';

type TimeUnit = TimeUnitOption['unit'];

interface PeriodSelectionValue {
  value: number;
  timeUnit: TimeUnit;
  displayText: string;
  isPredefined: boolean;
  days?: number;
}

interface PeriodSelectionCurrentValue {
  value?: number;
  timeUnit?: TimeUnit;
  displayText?: string;
  isPredefined?: boolean;
  days?: number;
}

interface PeriodSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: PeriodSelectionValue) => void;
  title: string;
  currentValue?: PeriodSelectionCurrentValue | null;
}

export const PeriodSelectionModal = ({
  visible,
  onClose,
  onSelect,
  title,
  currentValue,
}: PeriodSelectionModalProps) => {
  // Derivar estado inicial desde currentValue
  const getInitialState = (): {
    isCustom: boolean;
    customValue: number;
    customUnit: number;
    selectedPeriod: number | null;
  } => {
    if (!visible || !currentValue) {
      return {
        isCustom: false,
        customValue: 1,
        customUnit: 1,
        selectedPeriod: null,
      };
    }

    if (currentValue.isPredefined) {
      return {
        isCustom: false,
        customValue: 1,
        customUnit: 1,
        selectedPeriod: currentValue.days,
      };
    }

    return {
      isCustom: true,
      customValue: currentValue.value || 1,
      customUnit:
        TIME_UNITS.find((u) => u.unit === currentValue.timeUnit)?.value || 1,
      selectedPeriod: null,
    };
  };

  const initialState = getInitialState();

  const [isCustom, setIsCustom] = useState(initialState.isCustom);
  const [customValue, setCustomValue] = useState(initialState.customValue);
  const [customUnit, setCustomUnit] = useState(initialState.customUnit);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(
    initialState.selectedPeriod,
  );

  const handleClose = () => {
    // Resetear estados al cerrar
    setIsCustom(false);
    setCustomValue(1);
    setCustomUnit(1);
    setSelectedPeriod(null);
    onClose();
  };

  const handleConfirm = () => {
    if (isCustom) {
      const selectedTimeUnit =
        TIME_UNITS.find((u) => u.value === customUnit) ?? TIME_UNITS[0];
      if (!selectedTimeUnit) return;
      const label =
        customValue === 1
          ? selectedTimeUnit.label
          : selectedTimeUnit.pluralLabel;
      onSelect({
        value: customValue,
        timeUnit: selectedTimeUnit.unit,
        displayText: `${customValue} ${label}`,
        isPredefined: false,
      });
    } else {
      if (selectedPeriod === null) return;
      const predefinedPeriod: PaymentTerm | undefined = PAYMENT_TERMS.find(
        (t) => t.days === selectedPeriod,
      );
      if (!predefinedPeriod) return;
      onSelect({
        value: predefinedPeriod.value,
        timeUnit: predefinedPeriod.timeUnit,
        displayText: predefinedPeriod.label,
        days: predefinedPeriod.days,
        isPredefined: true,
      });
    }
    handleClose();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleClose}
      width={400}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleConfirm}
          disabled={isCustom ? !customValue : !selectedPeriod}
        >
          Confirmar
        </Button>,
      ]}
    >
      <Checkbox
        style={{ marginBottom: 16 }}
        checked={isCustom}
        onChange={(e) => setIsCustom(e.target.checked)}
      >
        Período personalizado
      </Checkbox>

      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        {!isCustom && (
          <Card size="small">
            <Space orientation="vertical" style={{ width: '100%' }}>
              {PAYMENT_TERMS.map(({ days, label }) => (
                <Button
                  key={days}
                  type={selectedPeriod === days ? 'primary' : 'text'}
                  onClick={() => setSelectedPeriod(days)}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  {label}
                </Button>
              ))}
            </Space>
          </Card>
        )}

        {isCustom && (
          <Card size="small">
            <Space>
              <InputNumber
                min={1}
                max={999}
                value={customValue}
                onChange={(value) => setCustomValue(value ?? 1)}
                style={{ width: 120 }}
              />
              <Select
                value={customUnit}
                onChange={(value) => setCustomUnit(value)}
                style={{ width: 120 }}
              >
                {TIME_UNITS.map((unit) => (
                  <Select.Option key={unit.value} value={unit.value}>
                    {unit.pluralLabel}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Card>
        )}
      </Space>
    </Modal>
  );
};
