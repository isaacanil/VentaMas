import { message } from 'antd';
import { useMemo, type Key } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  VmButton,
  VmListBox,
  VmModal,
  VmSelect,
  VmSpinner,
} from '@/components/heroui';
import { ClearOutlined, TeamOutlined } from '@/constants/icons/antd';
import {
  SelectSettingCart,
  selectCartDocumentCurrency,
  updateProductFields,
} from '@/features/cart/cartSlice';
import type {
  CartSettings,
  Product as CartProduct,
} from '@/features/cart/types';
import { selectUser } from '@/features/auth/userSlice';
import { useServiceCommissionCollaborators } from '@/firebase/commissions/useServiceCommissionCollaborators';
import type { ServiceCommissionCollaboratorSnapshot } from '@/types/commissions';
import type { SupportedDocumentCurrency } from '@/types/products';
import type { UserIdentity } from '@/types/users';
import {
  buildServiceCommissionCollaboratorOptions,
  getServiceCommissionCollaboratorOptionLabel,
  getServiceCommissionCollaboratorOptionValue,
  type ServiceCommissionCollaboratorOption,
} from '@/utils/commissions/collaboratorOptions';
import {
  buildServiceCommissionLineSnapshot,
  calculateServiceCommissionAmount,
  cleanCommissionString as toCleanString,
  getServiceCommissionCollaboratorLabel,
  isServiceCommissionCollaboratorEligible,
  normalizeCommissionCollaborator,
  normalizeServiceCommissionSettings,
  resolveServiceCommissionRuleForProduct,
  resolveServiceCommissionBaseAmount,
  toFiniteCommissionNumber as toFiniteNumber,
} from '@/utils/commissions/serviceCommissions';
import { formatPriceByCurrency } from '@/utils/format';
import {
  CollaboratorOption,
  CollaboratorOptionBadge,
  CollaboratorOptionMeta,
  CollaboratorOptionName,
  CollaboratorOptionTitle,
  CollaboratorListBox,
  CommissionNotice,
  CollaboratorSelect,
  Content,
  Field,
  FieldLabel,
  FieldsGrid,
  HeaderBlock,
  LoadingItem,
  RateField,
  RateGroup,
  RateInput,
  RateUnit,
  ServiceName,
  StatusLine,
  Summary,
  SummaryItem,
  TypeListBox,
  TypeSelect,
} from './ServiceCommissionModal.styles';

interface ServiceCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CartProduct | null;
}

const getBusinessId = (user: UserIdentity | null): string | null =>
  toCleanString(user?.businessID) ??
  toCleanString(user?.businessId) ??
  toCleanString(user?.activeBusinessId);

const getLineId = (product: CartProduct | null): string | null =>
  toCleanString(product?.cid) ?? toCleanString(product?.id);

const INELIGIBLE_COLLABORATOR_MESSAGE =
  'Este colaborador no tiene una comisión configurada. Configúralo en RRHH antes de asignarlo a una venta.';

const buildCurrentCollaborator = (
  commission: CartProduct['serviceCommission'],
): ServiceCommissionCollaboratorSnapshot | null => {
  if (!commission) return null;
  return normalizeCommissionCollaborator({
    ...commission.collaborator,
    id: commission.collaboratorId ?? commission.collaborator?.id,
    code: commission.collaboratorCode ?? commission.collaborator?.code,
    name: commission.collaboratorName ?? commission.collaborator?.name,
    hrEmployeeId:
      commission.hrEmployeeId ?? commission.collaborator?.hrEmployeeId,
    partyId: commission.partyId ?? commission.collaborator?.partyId,
    serviceCommissionRules: commission.collaborator?.serviceCommissionRules,
    defaultRate: commission.rateValue,
    defaultType: commission.type,
  });
};

const withCurrentCollaboratorOption = (
  options: ServiceCommissionCollaboratorOption[],
  collaborator: ServiceCommissionCollaboratorSnapshot | null,
): ServiceCommissionCollaboratorOption[] => {
  const value = getServiceCommissionCollaboratorOptionValue(collaborator);
  if (!value || !collaborator?.code) return options;
  const exists = options.some(
    (option) =>
      option.value === value ||
      option.collaborator.code === collaborator.code ||
      option.collaborator.id === collaborator.id,
  );
  if (exists) return options;

  return [
    {
      collaborator,
      label: getServiceCommissionCollaboratorOptionLabel(collaborator),
      source: 'catalog',
      value,
    },
    ...options,
  ];
};

const getRateLabel = ({
  currency,
  rateValue,
  type,
}: {
  currency: SupportedDocumentCurrency;
  rateValue: number;
  type: ServiceCommissionCollaboratorSnapshot['defaultType'];
}): string =>
  type === 'fixed'
    ? formatPriceByCurrency(rateValue, currency)
    : `${new Intl.NumberFormat('es-DO', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(rateValue)}%`;

const getCollaboratorOptionMeta = ({
  currency,
  option,
  product,
}: {
  currency: SupportedDocumentCurrency;
  option: ServiceCommissionCollaboratorOption;
  product: CartProduct | null;
}): { badge: string; eligible: boolean; meta: string } => {
  const collaborator = option.collaborator;
  const serviceRule = product
    ? resolveServiceCommissionRuleForProduct({ collaborator, product })
    : null;
  const eligible = isServiceCommissionCollaboratorEligible(
    collaborator,
    product,
  );

  if (serviceRule && toFiniteNumber(serviceRule.rateValue) > 0) {
    return {
      badge: 'Elegible',
      eligible,
      meta: `Regla del servicio · ${getRateLabel({
        currency,
        rateValue: serviceRule.rateValue,
        type: serviceRule.type,
      })}`,
    };
  }

  if (
    collaborator.defaultType &&
    collaborator.defaultRate != null &&
    toFiniteNumber(collaborator.defaultRate) > 0
  ) {
    return {
      badge: 'Elegible',
      eligible,
      meta: `Regla general · ${getRateLabel({
        currency,
        rateValue: collaborator.defaultRate,
        type: collaborator.defaultType,
      })}`,
    };
  }

  return {
    badge: 'Sin tasa',
    eligible: false,
    meta: product
      ? 'No tiene comisión configurada para este servicio.'
      : 'No tiene comisión configurada.',
  };
};

export const ServiceCommissionModal = ({
  isOpen,
  onClose,
  product,
}: ServiceCommissionModalProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const settings = useSelector(SelectSettingCart) as CartSettings;
  const documentCurrency = useSelector(
    selectCartDocumentCurrency,
  ) as SupportedDocumentCurrency;
  const businessId = getBusinessId(user);
  const lineId = getLineId(product);
  const commissionSettings = normalizeServiceCommissionSettings(
    settings?.billing?.serviceCommissions,
  );
  const { rows: collaborators, loading: collaboratorsLoading } =
    useServiceCommissionCollaborators(businessId);
  const loading = collaboratorsLoading;
  const currentCommission = product?.serviceCommission ?? null;
  const currentCollaborator = useMemo(
    () => buildCurrentCollaborator(currentCommission),
    [currentCommission],
  );
  const collaboratorOptions = useMemo(
    () =>
      withCurrentCollaboratorOption(
        buildServiceCommissionCollaboratorOptions({
          collaborators,
        }),
        currentCollaborator,
      ),
    [collaborators, currentCollaborator],
  );
  const selectedKey =
    toCleanString(currentCommission?.collaboratorId) ??
    toCleanString(currentCommission?.collaborator?.id) ??
    toCleanString(currentCommission?.collaboratorCode) ??
    toCleanString(currentCommission?.collaborator?.code) ??
    null;
  const selectedOption =
    collaboratorOptions.find((option) => option.value === selectedKey) ?? null;
  const selectedCollaborator =
    selectedOption?.collaborator ?? currentCollaborator ?? null;
  const selectedServiceRule =
    selectedCollaborator && product
      ? resolveServiceCommissionRuleForProduct({
          collaborator: selectedCollaborator,
          product,
        })
      : null;
  const currentManualCommission =
    currentCommission?.source === 'manual' || currentCommission?.source == null
      ? currentCommission
      : null;
  const commissionType =
    currentManualCommission?.type ??
    selectedServiceRule?.type ??
    currentCommission?.type ??
    selectedCollaborator?.defaultType ??
    commissionSettings.defaultType;
  const rateValue = toFiniteNumber(
    currentManualCommission?.rateValue ??
      selectedServiceRule?.rateValue ??
      currentCommission?.rateValue ??
      selectedCollaborator?.defaultRate,
    commissionSettings.defaultRate,
  );
  const baseAmount = product ? resolveServiceCommissionBaseAmount(product) : 0;
  const estimatedCommission = selectedCollaborator
    ? calculateServiceCommissionAmount({
        baseAmount,
        rateValue,
        type: commissionType,
      })
    : null;
  const estimatedCommissionIfAssigned = calculateServiceCommissionAmount({
    baseAmount,
    rateValue,
    type: commissionType,
  });
  const estimatedCommissionLabel =
    estimatedCommission === null
      ? `Selecciona colaborador para registrar ${formatPriceByCurrency(
          estimatedCommissionIfAssigned,
          documentCurrency,
        )}.`
      : formatPriceByCurrency(estimatedCommission, documentCurrency);
  const appliedRuleLabel = selectedCollaborator
    ? currentManualCommission
      ? `Manual · ${getRateLabel({
          currency: documentCurrency,
          rateValue,
          type: commissionType,
        })}`
      : selectedServiceRule
        ? `Regla del servicio · ${getRateLabel({
            currency: documentCurrency,
            rateValue: selectedServiceRule.rateValue,
            type: selectedServiceRule.type,
          })}`
        : selectedCollaborator.defaultRate != null
          ? `Regla general · ${getRateLabel({
              currency: documentCurrency,
              rateValue: selectedCollaborator.defaultRate,
              type: selectedCollaborator.defaultType,
            })}`
          : 'Sin tasa configurada'
    : 'Selecciona colaborador';
  const selectedLabel =
    getServiceCommissionCollaboratorLabel(currentCommission);
  const missingCollaboratorNotice =
    commissionSettings.requireCollaboratorOnService
      ? 'Este servicio requiere colaborador antes de facturar.'
      : 'Sin colaborador asignado: esta línea se facturará sin comisión registrada.';

  const persistCommission = ({
    collaborator,
    current = currentCommission,
  }: {
    collaborator: ServiceCommissionCollaboratorSnapshot;
    current?: CartProduct['serviceCommission'];
  }) => {
    if (!lineId || !product) return;
    dispatch(
      updateProductFields({
        id: lineId,
        data: {
          serviceCommission: buildServiceCommissionLineSnapshot({
            collaborator,
            current,
            defaultRate: commissionSettings.defaultRate,
            defaultType: commissionSettings.defaultType,
            product,
          }),
        },
      }),
    );
  };

  const clearCommission = () => {
    if (!lineId) return;
    dispatch(
      updateProductFields({
        id: lineId,
        data: { serviceCommission: null },
      }),
    );
  };

  const handleCollaboratorChange = (key: Key | null) => {
    if (!key) return;
    const selectedValue = String(key);
    if (selectedValue === selectedKey) return;
    const selected = collaboratorOptions.find(
      (option) => option.value === selectedValue,
    );
    if (!selected) return;
    if (
      !isServiceCommissionCollaboratorEligible(selected.collaborator, product)
    ) {
      void message.warning(INELIGIBLE_COLLABORATOR_MESSAGE);
      return;
    }
    persistCommission({ collaborator: selected.collaborator, current: null });
  };

  return (
    <VmModal
      title="Comisión del servicio"
      ariaLabel="Configurar comisión del servicio"
      isOpen={isOpen && Boolean(product)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="sm"
      footer={
        <>
          <VmButton
            variant="secondary"
            isDisabled={!selectedCollaborator}
            onPress={clearCommission}
          >
            <ClearOutlined />
            Quitar
          </VmButton>
          <VmButton variant="primary" onPress={onClose}>
            Listo
          </VmButton>
        </>
      }
    >
      <Content>
        <HeaderBlock>
          <ServiceName>{product?.name ?? 'Servicio'}</ServiceName>
          <StatusLine>
            <TeamOutlined />
            {selectedLabel ?? 'Sin colaborador asignado'}
          </StatusLine>
          {!selectedCollaborator ? (
            <CommissionNotice
              data-tone={
                commissionSettings.requireCollaboratorOnService
                  ? 'warning'
                  : 'neutral'
              }
            >
              {missingCollaboratorNotice}
            </CommissionNotice>
          ) : null}
        </HeaderBlock>

        <FieldsGrid>
          <Field $wide>
            <FieldLabel>Colaborador</FieldLabel>
            <CollaboratorSelect
              fullWidth
              aria-label="Colaborador de comisión"
              placeholder="Código o nombre"
              selectedKey={selectedKey}
              isDisabled={loading}
              onSelectionChange={handleCollaboratorChange}
            >
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <CollaboratorListBox aria-label="Colaboradores">
                  {loading ? (
                    <LoadingItem id="loading" textValue="Cargando">
                      <VmSpinner size="sm" />
                      Cargando colaboradores...
                    </LoadingItem>
                  ) : (
                    collaboratorOptions.map((option) => {
                      const optionMeta = getCollaboratorOptionMeta({
                        currency: documentCurrency,
                        option,
                        product,
                      });

                      return (
                        <VmListBox.Item
                          key={option.value}
                          id={option.value}
                          textValue={`${option.label} ${optionMeta.meta}`}
                          isDisabled={!optionMeta.eligible}
                        >
                          <CollaboratorOption>
                            <CollaboratorOptionTitle>
                              <CollaboratorOptionName>
                                {option.label}
                              </CollaboratorOptionName>
                              <CollaboratorOptionBadge
                                data-tone={
                                  optionMeta.eligible ? 'success' : 'warning'
                                }
                              >
                                {optionMeta.badge}
                              </CollaboratorOptionBadge>
                            </CollaboratorOptionTitle>
                            <CollaboratorOptionMeta>
                              {optionMeta.meta}
                            </CollaboratorOptionMeta>
                          </CollaboratorOption>
                          <VmListBox.ItemIndicator />
                        </VmListBox.Item>
                      );
                    })
                  )}
                </CollaboratorListBox>
              </VmSelect.Popover>
            </CollaboratorSelect>
          </Field>

          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <TypeSelect
              fullWidth
              aria-label="Tipo de comisión solo lectura"
              selectedKey={commissionType}
              isDisabled
            >
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <TypeListBox aria-label="Tipos de comisión">
                  <VmListBox.Item id="percentage" textValue="Porcentaje">
                    Porcentaje
                    <VmListBox.ItemIndicator />
                  </VmListBox.Item>
                  <VmListBox.Item id="fixed" textValue="Monto fijo">
                    Monto fijo
                    <VmListBox.ItemIndicator />
                  </VmListBox.Item>
                </TypeListBox>
              </VmSelect.Popover>
            </TypeSelect>
          </Field>

          <Field>
            <FieldLabel>Tasa</FieldLabel>
            <RateField
              fullWidth
              aria-label="Tasa de comisión solo lectura"
              minValue={0}
              step={0.01}
              value={rateValue}
              isDisabled
            >
              <RateGroup>
                <RateInput />
                <RateUnit>
                  {commissionType === 'percentage' ? '%' : 'RD$'}
                </RateUnit>
              </RateGroup>
            </RateField>
          </Field>
        </FieldsGrid>

        <Summary>
          <SummaryItem>
            <span>Base</span>
            <strong>
              {formatPriceByCurrency(baseAmount, documentCurrency)}
            </strong>
          </SummaryItem>
          <SummaryItem>
            <span>Comisión estimada</span>
            <strong>{estimatedCommissionLabel}</strong>
          </SummaryItem>
          <SummaryItem>
            <span>Regla aplicada</span>
            <strong>{appliedRuleLabel}</strong>
          </SummaryItem>
        </Summary>
      </Content>
    </VmModal>
  );
};

export default ServiceCommissionModal;
