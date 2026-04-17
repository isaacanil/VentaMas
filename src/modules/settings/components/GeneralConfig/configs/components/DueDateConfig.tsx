import {
  Select,
  Checkbox,
  InputNumber,
  Button,
  message,
  Typography,
  Divider,
  Switch,
} from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  ClockCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';

const { Text } = Typography;

const RootContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const ToggleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

  .label-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`;

const ConfigPanel = styled.div`
  padding: 16px 0;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  animation: slide-down 0.3s ease-out;

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const OptionLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;

  .period {
    font-weight: 600;
  }

  .desc {
    font-size: 11px;
    color: #8c8c8c;
    background: #f5f5f5;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 400;
  }
`;

const CustomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
`;

const getDueDateToggleMessage = (checked: boolean) =>
  checked ? 'Vencimiento habilitado' : 'Vencimiento deshabilitado';

type DueDateOptionValue =
  | 'immediate'
  | '3_days'
  | '1_week'
  | '2_weeks'
  | '15_days'
  | '1_month'
  | '45_days'
  | '2_months'
  | '3_months'
  | '6_months'
  | '1_year'
  | 'custom';

type StandardDueDateOptionValue = Exclude<
  DueDateOptionValue,
  'custom' | 'immediate'
>;

interface DueDateOption {
  value: StandardDueDateOptionValue;
  label: string;
  sub: string;
}

const DueDateConfig = () => {
  const {
    billing: { hasDueDate, duePeriod, useCustomConfig },
  } = useSelector(SelectSettingCart);
  const user = useSelector(selectUser);

  const baseDuePeriod = {
    months: duePeriod?.months || 0,
    weeks: duePeriod?.weeks || 0,
    days: duePeriod?.days || 0,
  };
  const [customDuePeriodDraft, setCustomDuePeriodDraft] = useState<{
    months: number;
    weeks: number;
    days: number;
  } | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<DueDateOptionValue | null>('1_week');

  const [loadingSaveCustomDuePeriod, setLoadingSaveCustomDuePeriod] =
    useState(false);
  const { months, weeks, days } = customDuePeriodDraft ?? baseDuePeriod;

  const updateCustomDuePeriod = (
    field: 'months' | 'weeks' | 'days',
    value: number | null,
  ) => {
    setCustomDuePeriodDraft((currentDraft) => ({
      ...(currentDraft ?? baseDuePeriod),
      [field]: value ?? 0,
    }));
  };

  const handleDueDateToggle = async (checked: boolean) => {
    const successMessage = getDueDateToggleMessage(checked);
    try {
      await setBillingSettings(user, { hasDueDate: checked });
      message.success(successMessage);
    } catch {
      message.error('Error al actualizar la configuración');
    }
  };

  const handlePredefinedChange = async (value: DueDateOptionValue) => {
    try {
      setSelectedOption(value);
      setCustomDuePeriodDraft(null);
      await setBillingSettings(user, {
        selectedOption: value,
        useCustomConfig: false,
      });
      if (value !== 'custom') {
        const periods: Record<
          Exclude<DueDateOptionValue, 'custom'>,
          { weeks: number; days: number; months: number }
        > = {
          immediate: { weeks: 0, days: 0, months: 0 },
          '3_days': { weeks: 0, days: 3, months: 0 },
          '1_week': { weeks: 1, days: 0, months: 0 },
          '2_weeks': { weeks: 2, days: 0, months: 0 },
          '15_days': { weeks: 0, days: 15, months: 0 },
          '1_month': { weeks: 0, days: 0, months: 1 },
          '45_days': { weeks: 0, days: 45, months: 0 },
          '2_months': { weeks: 0, days: 0, months: 2 },
          '3_months': { weeks: 0, days: 0, months: 3 },
          '6_months': { weeks: 0, days: 0, months: 6 },
          '1_year': { weeks: 0, days: 0, months: 12 },
        };
        await setBillingSettings(user, {
          duePeriod: periods[value],
        });
        message.success('Período de vencimiento actualizado');
      }
    } catch {
      message.error('Error al actualizar la configuración');
    }
  };

  const handleUseCustomConfigChange = async (checked: boolean) => {
    try {
      await setBillingSettings(user, { useCustomConfig: checked });
      if (checked) {
        setSelectedOption(null);
      } else {
        setSelectedOption('1_week');
        setCustomDuePeriodDraft(null);
        await setBillingSettings(user, { selectedOption: '1_week' });
        await setBillingSettings(user, {
          duePeriod: { months: 0, weeks: 1, days: 0 },
        });
      }
      message.success('Configuración actualizada');
    } catch {
      message.error('Error al actualizar la configuración');
    }
  };

  const handleSaveCustomDuePeriod = async () => {
    setLoadingSaveCustomDuePeriod(true);
    try {
      await setBillingSettings(user, {
        duePeriod: { months, weeks, days },
        useCustomConfig: true,
      });
      message.success('Plazos personalizados guardados');
    } catch {
      message.error('Error al guardar la configuración');
    }
    setLoadingSaveCustomDuePeriod(false);
  };

  const options: DueDateOption[] = [
    { value: 'immediate', label: 'Inmediato', sub: 'Al emitir' },
    { value: '1_week', label: '1 semana', sub: '7 días' },
    { value: '15_days', label: '15 días', sub: 'Quincenal' },
    { value: '1_month', label: '1 mes', sub: '30 días' },
    { value: 'custom', label: 'Personalizado', sub: 'Definir plazo' },
  ] as any;

  return (
    <RootContainer>
      <ToggleCard>
        <div className="label-group">
          <Text strong style={{ fontSize: '15px', color: '#262626' }}>
            Fecha de vencimiento
          </Text>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Establece plazos de pago para tus facturas.
          </Text>
        </div>
        <Switch
          checked={hasDueDate}
          onChange={(checked) => handleDueDateToggle(checked)}
        />
      </ToggleCard>

      {hasDueDate && (
        <ConfigPanel>
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text strong style={{ userSelect: 'none' }}>
              Plazo de Pago
            </Text>
          </div>

          <Select
            value={useCustomConfig ? 'custom' : selectedOption}
            onChange={(val) => {
              if (val === 'custom') {
                handleUseCustomConfigChange(true);
              } else {
                handlePredefinedChange(val);
              }
            }}
            style={{
              width: '100%',
            }}
            placeholder="Selecciona un plazo"
            dropdownStyle={{ minWidth: '240px' }}
            options={options.map((opt: any) => ({
              value: opt.value,
              label: (
                <OptionLabel>
                  <span className="period">{opt.label}</span>
                  <span className="desc">{opt.sub}</span>
                </OptionLabel>
              ),
            }))}
          />

          {useCustomConfig && (
            <div style={{ marginTop: '20px' }}>
              <Divider dashed style={{ margin: '0 0 16px 0' }}>
                Configuración Personalizada
              </Divider>
              <CustomGrid>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: '11px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Meses
                  </Text>
                  <InputNumber
                    min={0}
                    value={months}
                    onChange={(value) => updateCustomDuePeriod('months', value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: '11px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Semanas
                  </Text>
                  <InputNumber
                    min={0}
                    value={weeks}
                    onChange={(value) => updateCustomDuePeriod('weeks', value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: '11px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Días
                  </Text>
                  <InputNumber
                    min={0}
                    value={days}
                    onChange={(value) => updateCustomDuePeriod('days', value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </CustomGrid>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                block
                style={{ marginTop: '20px', borderRadius: '8px' }}
                onClick={handleSaveCustomDuePeriod}
                loading={loadingSaveCustomDuePeriod}
              >
                Aplicar Plazos
              </Button>
            </div>
          )}
        </ConfigPanel>
      )}
    </RootContainer>
  );
};

export default DueDateConfig;
