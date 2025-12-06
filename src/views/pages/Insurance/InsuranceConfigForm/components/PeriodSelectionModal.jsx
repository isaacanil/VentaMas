import {
  Button,
  Card,
  Checkbox,
  InputNumber,
  Modal,
  Select,
  Space,
} from 'antd';
import { useEffect, useState } from 'react';

import { PAYMENT_TERMS, TIME_UNITS } from '../constants';

export const PeriodSelectionModal = ({
  visible,
  onClose,
  onSelect,
  title,
  currentValue,
}) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState(1);
  const [customUnit, setCustomUnit] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  useEffect(() => {
    if (!visible) {
      setIsCustom(false);
      setCustomValue(1);
      setCustomUnit(1);
      setSelectedPeriod(null);
    } else if (currentValue) {
      if (currentValue.isPredefined) {
        setIsCustom(false);
        setSelectedPeriod(currentValue.days);
      } else {
        setIsCustom(true);
        setCustomValue(currentValue.value || 1);
        setCustomUnit(
          TIME_UNITS.find((u) => u.unit === currentValue.timeUnit)?.value || 1,
        );
      }
    }
  }, [visible, currentValue]);

  const handleConfirm = () => {
    if (isCustom) {
      const selectedTimeUnit = TIME_UNITS.find((u) => u.value === customUnit);
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
      const predefinedPeriod = PAYMENT_TERMS.find(
        (t) => t.days === selectedPeriod,
      );
      onSelect({
        value: predefinedPeriod.value,
        timeUnit: predefinedPeriod.timeUnit,
        displayText: predefinedPeriod.label,
        days: predefinedPeriod.days,
        isPredefined: true,
      });
    }
    onClose();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={400}
      footer={[
        <Button key="cancel" onClick={onClose}>
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

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {!isCustom && (
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
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
                onChange={(value) => setCustomValue(value)}
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
