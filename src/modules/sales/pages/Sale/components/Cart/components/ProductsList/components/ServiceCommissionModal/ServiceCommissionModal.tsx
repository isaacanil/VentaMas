import type { Key } from 'react';
import { useMemo } from 'react';
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
import type {
  ServiceCommissionCollaboratorSnapshot,
  ServiceCommissionType,
} from '@/types/commissions';
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
  normalizeCommissionCollaborator,
  normalizeServiceCommissionSettings,
  resolveServiceCommissionBaseAmount,
  toFiniteCommissionNumber as toFiniteNumber,
} from '@/utils/commissions/serviceCommissions';
import { formatPriceByCurrency } from '@/utils/format';
import {
  CollaboratorListBox,
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
  const commissionType =
    currentCommission?.type ??
    selectedCollaborator?.defaultType ??
    commissionSettings.defaultType;
  const rateValue = toFiniteNumber(
    currentCommission?.rateValue ?? selectedCollaborator?.defaultRate,
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
  const selectedLabel =
    getServiceCommissionCollaboratorLabel(currentCommission);

  const persistCommission = ({
    collaborator,
    nextRateValue,
    nextType,
  }: {
    collaborator: ServiceCommissionCollaboratorSnapshot;
    nextRateValue?: number;
    nextType?: ServiceCommissionType;
  }) => {
    if (!lineId || !product) return;
    dispatch(
      updateProductFields({
        id: lineId,
        data: {
          serviceCommission: buildServiceCommissionLineSnapshot({
            collaborator,
            current: currentCommission,
            defaultRate: commissionSettings.defaultRate,
            defaultType: commissionSettings.defaultType,
            product,
            rateValue: nextRateValue,
            type: nextType,
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
    const selected = collaboratorOptions.find(
      (option) => option.value === String(key),
    );
    if (!selected) return;
    persistCommission({ collaborator: selected.collaborator });
  };

  const handleTypeChange = (key: Key | null) => {
    if (!key || !selectedCollaborator) return;
    persistCommission({
      collaborator: selectedCollaborator,
      nextType: String(key) as ServiceCommissionType,
    });
  };

  const handleRateChange = (value: number | string | null) => {
    if (!selectedCollaborator) return;
    persistCommission({
      collaborator: selectedCollaborator,
      nextRateValue: Math.max(0, toFiniteNumber(value)),
    });
  };

  return (
    <VmModal
      title="Comision del servicio"
      ariaLabel="Configurar comision del servicio"
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
        </HeaderBlock>

        <FieldsGrid>
          <Field $wide>
            <FieldLabel>Colaborador</FieldLabel>
            <CollaboratorSelect
              fullWidth
              aria-label="Colaborador de comision"
              placeholder="Codigo o nombre"
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
                    collaboratorOptions.map((option) => (
                      <VmListBox.Item
                        key={option.value}
                        id={option.value}
                        textValue={option.label}
                      >
                        {option.label}
                        <VmListBox.ItemIndicator />
                      </VmListBox.Item>
                    ))
                  )}
                </CollaboratorListBox>
              </VmSelect.Popover>
            </CollaboratorSelect>
          </Field>

          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <TypeSelect
              fullWidth
              aria-label="Tipo de comision"
              selectedKey={commissionType}
              isDisabled={!selectedCollaborator}
              onSelectionChange={handleTypeChange}
            >
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <TypeListBox aria-label="Tipos de comision">
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
              aria-label="Tasa de comision"
              minValue={0}
              step={0.01}
              value={rateValue}
              isDisabled={!selectedCollaborator}
              onChange={handleRateChange}
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
            <span>Comision estimada</span>
            <strong>
              {estimatedCommission === null
                ? 'N/A'
                : formatPriceByCurrency(estimatedCommission, documentCurrency)}
            </strong>
          </SummaryItem>
        </Summary>
      </Content>
    </VmModal>
  );
};

export default ServiceCommissionModal;
