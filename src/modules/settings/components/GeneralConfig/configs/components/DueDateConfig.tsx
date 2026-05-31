import {
  Button,
  Divider,
  InputNumber,
  message,
  Select,
  Switch,
  Typography,
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';

import {
  CUSTOM_DUE_PERIOD_FIELDS,
  DUE_DATE_OPTIONS,
  getDueDateToggleMessage,
  PREDEFINED_DUE_PERIODS,
  type DueDateOptionValue,
  type DuePeriod,
  type DuePeriodField,
} from './DueDateConfig.helpers';
import {
  ApplyButtonWrapper,
  ConfigPanel,
  CustomDivider,
  CustomGrid,
  CustomPeriodSection,
  FieldLabel,
  FullWidthInputNumber,
  FullWidthSelectWrapper,
  OptionLabel,
  RootContainer,
  SectionTitle,
  ToggleCard,
} from './DueDateConfig.styles';

const { Text } = Typography;

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
  const [customDuePeriodDraft, setCustomDuePeriodDraft] =
    useState<DuePeriod | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<DueDateOptionValue | null>('1_week');
  const [loadingSaveCustomDuePeriod, setLoadingSaveCustomDuePeriod] =
    useState(false);
  const selectedPeriod = customDuePeriodDraft ?? baseDuePeriod;
  const { months, weeks, days } = selectedPeriod;

  const updateCustomDuePeriod = (
    field: DuePeriodField,
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
      message.error('Error al actualizar la configuracion');
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
        await setBillingSettings(user, {
          duePeriod: PREDEFINED_DUE_PERIODS[value],
        });
        message.success('Periodo de vencimiento actualizado');
      }
    } catch {
      message.error('Error al actualizar la configuracion');
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
      message.success('Configuracion actualizada');
    } catch {
      message.error('Error al actualizar la configuracion');
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
      message.error('Error al guardar la configuracion');
    }
    setLoadingSaveCustomDuePeriod(false);
  };

  return (
    <RootContainer>
      <ToggleCard>
        <div className="label-group">
          <Text strong>Fecha de vencimiento</Text>
          <Text type="secondary">
            Establece plazos de pago para tus facturas.
          </Text>
        </div>
        <Switch checked={hasDueDate} onChange={handleDueDateToggle} />
      </ToggleCard>

      {hasDueDate && (
        <ConfigPanel>
          <SectionTitle>
            <Text strong>Plazo de Pago</Text>
          </SectionTitle>

          <FullWidthSelectWrapper>
            <Select
              value={useCustomConfig ? 'custom' : selectedOption}
              onChange={(value) => {
                if (value === 'custom') {
                  handleUseCustomConfigChange(true);
                  return;
                }
                handlePredefinedChange(value);
              }}
              placeholder="Selecciona un plazo"
              dropdownStyle={{ minWidth: '240px' }}
              options={DUE_DATE_OPTIONS.map((option) => ({
                value: option.value,
                label: (
                  <OptionLabel>
                    <span className="period">{option.label}</span>
                    <span className="desc">{option.sub}</span>
                  </OptionLabel>
                ),
              }))}
            />
          </FullWidthSelectWrapper>

          {useCustomConfig && (
            <CustomPeriodSection>
              <CustomDivider>
                <Divider dashed>Configuracion Personalizada</Divider>
              </CustomDivider>
              <CustomGrid>
                {CUSTOM_DUE_PERIOD_FIELDS.map((field) => (
                  <FullWidthInputNumber key={field.key}>
                    <Text type="secondary">
                      <FieldLabel>{field.label}</FieldLabel>
                    </Text>
                    <InputNumber
                      min={0}
                      value={selectedPeriod[field.key]}
                      onChange={(value) =>
                        updateCustomDuePeriod(field.key, value)
                      }
                    />
                  </FullWidthInputNumber>
                ))}
              </CustomGrid>
              <ApplyButtonWrapper>
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  block
                  onClick={handleSaveCustomDuePeriod}
                  loading={loadingSaveCustomDuePeriod}
                >
                  Aplicar Plazos
                </Button>
              </ApplyButtonWrapper>
            </CustomPeriodSection>
          )}
        </ConfigPanel>
      )}
    </RootContainer>
  );
};

export default DueDateConfig;
