import { useState } from 'react';
import {
  Checkbox,
  Divider,
  InputNumber,
  Modal,
  Select,
  Tooltip,
  Typography,
} from 'antd';
import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import {
  ACCOUNTING_CURRENCY_CODES,
  getCurrencyOptionLabel,
} from '@/utils/accounting/currencies';

import type {
  AccountingManualRatesByCurrency,
  SupportedDocumentCurrency,
} from '../utils/accountingConfig';

const { Text } = Typography;

interface AddExchangeRateModalProps {
  availableCurrencies: SupportedDocumentCurrency[];
  enabledForeignCurrencies: SupportedDocumentCurrency[];
  functionalCurrency: SupportedDocumentCurrency;
  hasUnsavedChanges: boolean;
  manualRatesByCurrency: AccountingManualRatesByCurrency;
  open: boolean;
  saving: boolean;
  selectedCurrencies: SupportedDocumentCurrency[];
  onBuyRateChange: (
    currency: SupportedDocumentCurrency,
    value: number | null,
  ) => void;
  onCancel: () => void;
  onConfirm: () => void;
  onRemoveCurrency: (currency: SupportedDocumentCurrency) => void;
  onFunctionalCurrencyChange: (currency: SupportedDocumentCurrency) => void;
  onSave: () => void;
  onSelectionChange: (values: SupportedDocumentCurrency[]) => void;
  onSellRateChange: (
    currency: SupportedDocumentCurrency,
    value: number | null,
  ) => void;
}

export const AddExchangeRateModal = ({
  availableCurrencies,
  enabledForeignCurrencies,
  functionalCurrency,
  hasUnsavedChanges,
  manualRatesByCurrency,
  open,
  saving,
  selectedCurrencies,
  onBuyRateChange,
  onCancel,
  onConfirm,
  onFunctionalCurrencyChange,
  onRemoveCurrency,
  onSave,
  onSelectionChange,
  onSellRateChange,
}: AddExchangeRateModalProps) => {
  const [localFunctional, setLocalFunctional] =
    useState<SupportedDocumentCurrency>(functionalCurrency);
  const hasCurrencies = availableCurrencies.length > 0;

  const handleOk = () => {
    if (localFunctional !== functionalCurrency) {
      onFunctionalCurrencyChange(localFunctional);
    }
    onConfirm();
    onSave();
  };

  return (
    <Modal
      title="Editar monedas y tasas"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okButtonProps={{ loading: saving }}
      okText="Guardar cambios"
      cancelText="Cancelar"
      destroyOnClose
      width={720}
    >
      <Content>
        <BaseCurrencyBox>
          <GroupTitle>Moneda base</GroupTitle>
          <GroupDescription>
            Moneda funcional para registrar conversiones.
          </GroupDescription>
          <FieldWidth>
            <Select
              value={localFunctional}
              options={ACCOUNTING_CURRENCY_CODES.map((currency) => ({
                label: getCurrencyOptionLabel(currency),
                value: currency,
              }))}
              style={{ width: '100%' }}
              onChange={(value) =>
                setLocalFunctional(value as SupportedDocumentCurrency)
              }
            />
          </FieldWidth>
        </BaseCurrencyBox>

        {enabledForeignCurrencies.length > 0 && (
          <>
            <Divider style={{ margin: 0 }} />

            <FieldGroup>
              <GroupTitle>Tasas activas</GroupTitle>
              <GroupDescription>
                Ajusta las tasas manuales de compra y venta de cada moneda.
              </GroupDescription>

              {enabledForeignCurrencies.map((currency) => {
                const rates = manualRatesByCurrency[currency];
                return (
                  <CurrencyRateRow key={currency}>
                    <CurrencyHeader>
                      <CurrencyCode>{currency} → {localFunctional}</CurrencyCode>
                      <RemoveButton
                        type="button"
                        title={`Desactivar ${currency}`}
                        onClick={() => onRemoveCurrency(currency)}
                      >
                        <CloseOutlined />
                      </RemoveButton>
                    </CurrencyHeader>

                    <RateGrid>
                      <RateField>
                        <RateLabelRow>
                          <FieldLabel>Compra</FieldLabel>
                          <Tooltip
                            title={`Tasa usada al registrar compras en ${currency}.`}
                          >
                            <InfoCircleOutlined
                              style={{
                                fontSize: 12,
                                color: 'var(--ds-color-text-secondary)',
                              }}
                            />
                          </Tooltip>
                        </RateLabelRow>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={0.01}
                          precision={4}
                          placeholder="Ej. 62.3500"
                          value={rates?.buyRate ?? undefined}
                          onChange={(value) =>
                            onBuyRateChange(
                              currency,
                              typeof value === 'number' ? value : null,
                            )
                          }
                        />
                      </RateField>

                      <RateField>
                        <RateLabelRow>
                          <FieldLabel>Venta</FieldLabel>
                          <Tooltip
                            title={`Tasa usada al facturar en ${currency}.`}
                          >
                            <InfoCircleOutlined
                              style={{
                                fontSize: 12,
                                color: 'var(--ds-color-text-secondary)',
                              }}
                            />
                          </Tooltip>
                        </RateLabelRow>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={0.01}
                          precision={4}
                          placeholder="Ej. 62.9500"
                          value={rates?.sellRate ?? undefined}
                          onChange={(value) =>
                            onSellRateChange(
                              currency,
                              typeof value === 'number' ? value : null,
                            )
                          }
                        />
                      </RateField>
                    </RateGrid>
                  </CurrencyRateRow>
                );
              })}
            </FieldGroup>
          </>
        )}

        <Divider style={{ margin: 0 }} />

        {hasCurrencies ? (
          <FieldGroup>
            <GroupTitle>Monedas documentales</GroupTitle>
            <GroupDescription>
              Selecciona las monedas que quieres activar con tasa manual.
            </GroupDescription>
            <CheckboxCardGroup>
              <Checkbox.Group
                value={selectedCurrencies}
                onChange={(values) =>
                  onSelectionChange(values as SupportedDocumentCurrency[])
                }
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {availableCurrencies.map((currency) => (
                  <Checkbox key={currency} value={currency}>
                    {getCurrencyOptionLabel(currency)}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </CheckboxCardGroup>
          </FieldGroup>
        ) : (
          <InlineNote>Todas las monedas disponibles ya están activas.</InlineNote>
        )}
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
`;

const GroupTitle = styled.h4`
  margin: 0;
  font-size: var(--ds-type-scale-section-title-size);
  font-weight: var(--ds-type-scale-section-title-weight);
  line-height: var(--ds-type-scale-section-title-line-height);
  color: var(--ds-color-text-primary);
`;

const GroupDescription = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const FieldWidth = styled.div`
  width: 100%;
  max-width: 280px;
`;

const CurrencyRateRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
`;

const CurrencyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  font-size: 11px;
  color: var(--ds-color-text-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  line-height: 1;

  &:hover {
    color: var(--ds-color-state-danger-text);
    background: var(--ds-color-state-danger-subtle);
  }
`;

const CurrencyCode = styled.span`
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const RateGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-2);

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const RateField = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const RateLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
`;

const FieldLabel = styled(Text)`
  && {
    font-size: var(--ds-type-scale-label-size);
    line-height: var(--ds-type-scale-label-line-height);
    color: var(--ds-color-text-primary);
  }
`;

const CheckboxCardGroup = styled.div`
  padding: var(--ds-space-2) var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
`;

const BaseCurrencyBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: 1px solid var(--ds-color-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-muted);
`;

const InlineNote = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-caption-size);
  color: var(--ds-color-text-muted);
`;
