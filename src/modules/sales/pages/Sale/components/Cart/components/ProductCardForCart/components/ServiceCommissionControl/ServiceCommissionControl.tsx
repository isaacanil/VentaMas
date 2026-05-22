import { InputNumber, Select, Tooltip } from 'antd';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { TeamOutlined } from '@/constants/icons/antd';
import {
  selectCartDocumentCurrency,
  updateProductFields,
} from '@/features/cart/cartSlice';
import type { Product } from '@/features/cart/types';
import { useBusinessUsers } from '@/firebase/users/useBusinessUsers';
import type {
  ServiceCommissionCollaboratorSnapshot,
  ServiceCommissionsBillingSettings,
  ServiceCommissionType,
} from '@/types/commissions';
import type { SupportedDocumentCurrency } from '@/types/products';
import {
  buildServiceCommissionLineSnapshot,
  calculateServiceCommissionAmount,
  normalizeCommissionCollaborator,
  resolveServiceCommissionBaseAmount,
} from '@/utils/commissions/serviceCommissions';
import { formatPriceByCurrency } from '@/utils/format';

type BusinessUser = Record<string, unknown> & {
  id?: string;
  uid?: string;
  number?: number;
};

interface ServiceCommissionControlProps {
  item: Product;
  settings: Required<ServiceCommissionsBillingSettings>;
}

const Panel = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-bg-subtle);
`;

const Header = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: space-between;
  min-width: 0;
`;

const Label = styled.span`
  display: inline-flex;
  gap: var(--ds-space-1);
  align-items: center;
  min-width: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const Estimate = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  white-space: nowrap;
`;

const Controls = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 1fr) 112px 120px;
  gap: var(--ds-space-2);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const COMMISSION_TYPE_OPTIONS: Array<{
  label: string;
  value: ServiceCommissionType;
}> = [
  { label: '%', value: 'percentage' },
  { label: 'Fijo', value: 'fixed' },
];

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const getUserKey = (user: BusinessUser): string | null =>
  toCleanString(user.id) ?? toCleanString(user.uid) ?? toCleanString(user.number);

export const ServiceCommissionControl = ({
  item,
  settings,
}: ServiceCommissionControlProps) => {
  const dispatch = useDispatch();
  const { users, loading } = useBusinessUsers() as {
    users: BusinessUser[];
    loading: boolean;
  };
  const documentCurrency = useSelector(
    selectCartDocumentCurrency,
  ) as SupportedDocumentCurrency;
  const lineId = item.cid || item.id;
  const currentCommission = item.serviceCommission ?? null;
  const selectedCollaboratorKey =
    toCleanString(currentCommission?.collaboratorId) ??
    toCleanString(currentCommission?.collaborator?.id) ??
    toCleanString(currentCommission?.collaboratorCode) ??
    undefined;
  const commissionType = currentCommission?.type ?? settings.defaultType;
  const rateValue = Number(
    currentCommission?.rateValue ?? settings.defaultRate ?? 0,
  );
  const baseAmount = resolveServiceCommissionBaseAmount(item);
  const estimatedCommission = calculateServiceCommissionAmount({
    baseAmount,
    rateValue,
    type: commissionType,
  });

  const collaboratorOptions = useMemo(
    () =>
      users
        .map((user) => {
          const collaborator = normalizeCommissionCollaborator(user);
          const value = getUserKey(user) ?? collaborator.code;
          if (!value || !collaborator.code) return null;
          const label =
            collaborator.name && collaborator.name !== collaborator.code
              ? `${collaborator.code} · ${collaborator.name}`
              : collaborator.code;
          return {
            label,
            value,
            collaborator,
          };
        })
        .filter(Boolean) as Array<{
        label: string;
        value: string;
        collaborator: ServiceCommissionCollaboratorSnapshot;
      }>,
    [users],
  );

  const persistCommission = ({
    collaborator,
    nextRateValue = rateValue,
    nextType = commissionType,
  }: {
    collaborator: ServiceCommissionCollaboratorSnapshot;
    nextRateValue?: number;
    nextType?: ServiceCommissionType;
  }) => {
    if (!lineId) return;
    dispatch(
      updateProductFields({
        id: lineId,
        data: {
          serviceCommission: buildServiceCommissionLineSnapshot({
            collaborator,
            current: currentCommission,
            defaultRate: settings.defaultRate,
            defaultType: settings.defaultType,
            product: item,
            rateValue: nextRateValue,
            type: nextType,
          }),
        },
      }),
    );
  };

  const selectedCollaborator =
    currentCommission?.collaborator ??
    collaboratorOptions.find((option) => option.value === selectedCollaboratorKey)
      ?.collaborator ??
    null;

  return (
    <Panel>
      <Header>
        <Label>
          <TeamOutlined />
          Colaborador del servicio
        </Label>
        {selectedCollaborator ? (
          <Tooltip title="Estimado sobre subtotal sin ITBIS">
            <Estimate>
              {formatPriceByCurrency(estimatedCommission, documentCurrency)}
            </Estimate>
          </Tooltip>
        ) : null}
      </Header>

      <Controls>
        <Select
          allowClear
          showSearch
          loading={loading}
          placeholder="Código o nombre"
          optionFilterProp="label"
          options={collaboratorOptions}
          value={selectedCollaboratorKey}
          onChange={(value) => {
            if (!lineId) return;
            if (!value) {
              dispatch(
                updateProductFields({
                  id: lineId,
                  data: { serviceCommission: null },
                }),
              );
              return;
            }
            const selected = collaboratorOptions.find(
              (option) => option.value === value,
            );
            if (!selected) return;
            persistCommission({ collaborator: selected.collaborator });
          }}
        />

        <Select
          aria-label="Tipo de comisión"
          disabled={!selectedCollaborator}
          options={COMMISSION_TYPE_OPTIONS}
          value={commissionType}
          onChange={(nextType) => {
            if (!selectedCollaborator) return;
            persistCommission({
              collaborator: selectedCollaborator,
              nextType,
            });
          }}
        />

        <InputNumber
          aria-label="Tasa de comisión"
          disabled={!selectedCollaborator}
          min={0}
          precision={2}
          addonAfter={commissionType === 'percentage' ? '%' : 'RD$'}
          value={rateValue}
          onChange={(value) => {
            if (!selectedCollaborator) return;
            persistCommission({
              collaborator: selectedCollaborator,
              nextRateValue: Number(value ?? 0),
            });
          }}
          style={{ width: '100%' }}
        />
      </Controls>
    </Panel>
  );
};

export default ServiceCommissionControl;
