
import React, { useState, useEffect } from 'react';
import { Form, Select, Checkbox, InputNumber, Button, message } from 'antd';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../features/auth/userSlice';
import { setBillingSettings } from '../../../../../firebase/billing/billingSetting';
import { SelectSettingCart } from '../../../../../features/cart/cartSlice';

const OptionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .period {
    font-weight: 500;
  }
  
  .description {
    color: rgba(0, 0, 0, 0.45);
    font-size: 0.9em;
  }
`;

const ConfigItem = styled.div`
  padding-left: ${(props) => (props.level || 0) * 16}px;
  margin-bottom: 8px;
`;

const ConfigGroupItem = styled.div`
  border-left: 2px solid #f0f0f0;
  padding-left: 16px;
  margin-bottom: 16px;
`;

const DueDateConfig = () => {
  const { billing: { hasDueDate, duePeriod, useCustomConfig } } = useSelector(SelectSettingCart);
  const user = useSelector(selectUser);

  const [months, setMonths] = useState(duePeriod?.months || 0);
  const [weeks, setWeeks] = useState(duePeriod?.weeks || 0);
  const [days, setDays] = useState(duePeriod?.days || 0);
  const [selectedOption, setSelectedOption] = useState('1_week');

  const [loadingSaveCustomDuePeriod, setLoadingSaveCustomDuePeriod] = useState(false);
  const [loadingUpdateSettings, setLoadingUpdateSettings] = useState(false);

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
      message.success('Configuración actualizada');
    } catch (error) {
      message.error('Error al actualizar la configuración');
    }
  };

  const handlePredefinedChange = async (value) => {
    try {
      setSelectedOption(value);
      await setBillingSettings(user, { 
        selectedOption: value, 
        useCustomConfig: false 
      });
      if (value !== 'custom') {
        const periods = {
          'immediate': { weeks: 0, days: 0, months: 0 },
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
          duePeriod: periods[value]
        });
        message.success('Configuración de vencimiento actualizada');
      }
    } catch (error) {
      message.error('Error al actualizar la configuración');
    }
  };

  const handleUseCustomConfigChange = async (checked) => {
    setLoadingUpdateSettings(true);
    try {
      await setBillingSettings(user, { useCustomConfig: checked });
      if (checked) {
        setSelectedOption(null);
      } else {
        setSelectedOption('1_week');
        await setBillingSettings(user, { selectedOption: '1_week' });
        await setBillingSettings(user, {
          duePeriod: {
            months: 0,
            weeks: 1,
            days: 0
          }
        });
      }
      message.success('Configuración actualizada');
    } catch (error) {
      message.error('Error al actualizar la configuración');
    } finally {
      setLoadingUpdateSettings(false);
    }
  };

  const handleSaveCustomDuePeriod = async () => {
    setLoadingSaveCustomDuePeriod(true);
    try {
      await setBillingSettings(user, { 
        duePeriod: {
          months,
          weeks,
          days
        },
        useCustomConfig: true
      });
      message.success('Configuración de vencimiento personalizada guardada');
    } catch (error) {
      message.error('Error al guardar la configuración');
    } finally {
      setLoadingSaveCustomDuePeriod(false);
    }
  };

  const renderOption = (period, description) => (
    <OptionContainer>
      <span className="period">{period}</span>
      <span className="description">{description}</span>
    </OptionContainer>
  );

  return (
    <ConfigGroupItem>
      <Form.Item>
        <Checkbox
          checked={hasDueDate}
          onChange={(e) => handleDueDateToggle(e.target.checked)}
        >
          Habilitar fecha de vencimiento en facturas
        </Checkbox>
      </Form.Item>

      {hasDueDate && (
        <ConfigGroupItem>
          <ConfigItem level={2}>
            <Form.Item label="Opciones de vencimiento predefinidas">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Select
                  value={selectedOption}
                  onChange={handlePredefinedChange}
                  style={{ width: '300px' }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    const label = typeof option?.label === 'object' 
                      ? option?.label?.props?.children?.[0]?.props?.children 
                      : option?.label;
                    return label?.toLowerCase().includes(input.toLowerCase());
                  }}
                  placeholder="Buscar período de vencimiento..."
                  options={[
                    { value: "3_days", label: renderOption("3 días", "72 horas") },
                    { value: "1_week", label: renderOption("1 semana", "7 días") },
                    { value: "2_weeks", label: renderOption("2 semanas", "14 días") },
                    { value: "15_days", label: renderOption("15 días", "Quincenal") },
                    { value: "1_month", label: renderOption("1 mes", "30 días") },
                    { value: "45_days", label: renderOption("45 días", "Mes y medio") },
                    { value: "2_months", label: renderOption("2 meses", "60 días") },
                    { value: "3_months", label: renderOption("3 meses", "Trimestral") },
                    { value: "6_months", label: renderOption("6 meses", "Semestral") },
                    { value: "1_year", label: renderOption("1 año", "Anual") },
                  ]}
                  disabled={useCustomConfig}
                />
                <Checkbox
                  checked={useCustomConfig}
                  onChange={(e) => handleUseCustomConfigChange(e.target.checked)}
                  style={{ marginLeft: '16px' }}
                >
                  Personalizado
                </Checkbox>
              </div>
            </Form.Item>
          </ConfigItem>
          {useCustomConfig && (
            <ConfigItem level={2}>
              <Form.Item label="Período de vencimiento personalizado">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <InputNumber
                    min={0}
                    value={months}
                    onChange={(value) => setMonths(value)}
                    placeholder="Meses"
                    style={{ width: '100px' }}
                  />
                  <span>Meses</span>
                  <InputNumber
                    min={0}
                    value={weeks}
                    onChange={(value) => setWeeks(value)}
                    placeholder="Semanas"
                    style={{ width: '100px' }}
                  />
                  <span>Semanas</span>
                  <InputNumber
                    min={0}
                    value={days}
                    onChange={(value) => setDays(value)}
                    placeholder="Días"
                    style={{ width: '100px' }}
                  />
                  <span>Días</span>
                </div>
              </Form.Item>
              <Button
                type="primary"
                onClick={handleSaveCustomDuePeriod}
                loading={loadingSaveCustomDuePeriod}
              >
                Guardar Configuración
              </Button>
            </ConfigItem>
          )}
        </ConfigGroupItem>
      )}
    </ConfigGroupItem>
  );
};

export default DueDateConfig;