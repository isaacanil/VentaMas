// @ts-nocheck
import { Form, Select, Checkbox, InputNumber, Button, message, Space, Typography, Divider } from 'antd';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { CalendarOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';

const { Text, Paragraph } = Typography;

const RootContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const ToggleCard = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${({ $active }) => ($active ? '#fff' : '#f8f9fa')};
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? '#1890ff' : '#e9ecef')};
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  cursor: pointer;

  &:hover {
    border-color: #1890ff;
    background: #fff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.05);
  }

  .label-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: ${({ $active }) => ($active ? '#e6f7ff' : '#ffffff')};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ $active }) => ($active ? '#1890ff' : '#8c8c8c')};
    font-size: 18px;
    border: 1px solid ${({ $active }) => ($active ? '#91d5ff' : '#d9d9d9')};
  }
`;

const ConfigPanel = styled.div`
  padding: 20px;
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  margin-top: 8px;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const OptionLabel = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  
  .period { font-weight: 600; }
  .desc { font-size: 11px; color: #8c8c8c; }
`;

const CustomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
`;

const DueDateConfig = () => {
  const {
    billing: { hasDueDate, duePeriod, useCustomConfig },
  } = useSelector(SelectSettingCart);
  const user = useSelector(selectUser);

  const [months, setMonths] = useState(duePeriod?.months || 0);
  const [weeks, setWeeks] = useState(duePeriod?.weeks || 0);
  const [days, setDays] = useState(duePeriod?.days || 0);
  const [selectedOption, setSelectedOption] = useState('1_week');

  const [loadingSaveCustomDuePeriod, setLoadingSaveCustomDuePeriod] =
    useState(false);

  useEffect(() => {
    if (duePeriod) {
      setMonths(duePeriod.months || 0);
      setWeeks(duePeriod.weeks || 0);
      setDays(duePeriod.days || 0);
    }
  }, [duePeriod]);

  const handleDueDateToggle = async (checked) => {
    try {
      await setBillingSettings(user, { hasDueDate: checked });
      message.success(checked ? 'Vencimiento habilitado' : 'Vencimiento deshabilitado');
    } catch {
      message.error('Error al actualizar la configuración');
    }
  };

  const handlePredefinedChange = async (value) => {
    try {
      setSelectedOption(value);
      await setBillingSettings(user, {
        selectedOption: value,
        useCustomConfig: false,
      });
      if (value !== 'custom') {
        const periods = {
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

  const handleUseCustomConfigChange = async (checked) => {
    try {
      await setBillingSettings(user, { useCustomConfig: checked });
      if (checked) {
        setSelectedOption(null);
      } else {
        setSelectedOption('1_week');
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
    } finally {
      setLoadingSaveCustomDuePeriod(false);
    }
  };

  const options = [
    { value: '3_days', label: '3 días', sub: '72 horas' },
    { value: '1_week', label: '1 semana', sub: '7 días' },
    { value: '2_weeks', label: '2 semanas', sub: '14 días' },
    { value: '15_days', label: '15 días', sub: 'Quincenal' },
    { value: '1_month', label: '1 mes', sub: '30 días' },
    { value: '45_days', label: '45 días', sub: 'Mes y medio' },
    { value: '2_months', label: '2 meses', sub: '60 días' },
    { value: '3_months', label: '3 meses', sub: 'Trimestral' },
    { value: '6_months', label: '6 meses', sub: 'Semestral' },
    { value: '1_year', label: '1 año', sub: 'Anual' },
  ];

  return (
    <RootContainer>
      <ToggleCard $active={hasDueDate} onClick={() => handleDueDateToggle(!hasDueDate)}>
        <div className="label-group">
          <div className="icon-wrapper">
            <CalendarOutlined />
          </div>
          <div>
            <Text strong style={{ display: 'block' }}>Habilitar fecha de vencimiento</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>Define plazos límite para el pago de facturas</Text>
          </div>
        </div>
        <Checkbox checked={hasDueDate} onChange={(e) => { e.stopPropagation(); handleDueDateToggle(e.target.checked); }} />
      </ToggleCard>

      {hasDueDate && (
        <ConfigPanel>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <Text strong>Plazo Estandar</Text>
            </div>
            <Checkbox checked={useCustomConfig} onChange={(e) => handleUseCustomConfigChange(e.target.checked)}>
              Personalizar
            </Checkbox>
          </div>

          <Select
            value={selectedOption}
            onChange={handlePredefinedChange}
            style={{ width: '100%' }}
            disabled={useCustomConfig}
            placeholder="Selecciona un período estándar"
          >
            {options.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                <OptionLabel>
                  <span className="period">{opt.label}</span>
                  <span className="desc">{opt.sub}</span>
                </OptionLabel>
              </Select.Option>
            ))}
          </Select>

          {useCustomConfig && (
            <div style={{ marginTop: '20px' }}>
              <Divider dashed style={{ margin: '0 0 16px 0' }}>Plazo Detallado</Divider>
              <CustomGrid>
                <div>
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Meses</Text>
                  <InputNumber min={0} value={months} onChange={setMonths} style={{ width: '100%' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Semanas</Text>
                  <InputNumber min={0} value={weeks} onChange={setWeeks} style={{ width: '100%' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Días</Text>
                  <InputNumber min={0} value={days} onChange={setDays} style={{ width: '100%' }} />
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
