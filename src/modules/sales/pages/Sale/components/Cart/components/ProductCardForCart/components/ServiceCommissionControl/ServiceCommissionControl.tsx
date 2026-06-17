import styled from 'styled-components';

import { VmButton } from '@/components/heroui';
import { TeamOutlined } from '@/constants/icons/antd';
import type { Product } from '@/features/cart/types';
import type {
  ServiceCommissionsBillingSettings,
  ServiceCommissionType,
} from '@/domain/commissions/types';
import type { SupportedDocumentCurrency } from '@/types/products';
import {
  calculateServiceCommissionAmount,
  getServiceCommissionCollaboratorLabel,
  resolveServiceCommissionBaseAmount,
} from '@/utils/commissions/serviceCommissions';
import { formatPriceByCurrency } from '@/utils/format';

interface ServiceCommissionControlProps {
  documentCurrency: SupportedDocumentCurrency;
  item: Product;
  onOpen: (item: Product) => void;
  settings: Required<ServiceCommissionsBillingSettings>;
}

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveCommissionType = (
  value: unknown,
  fallback: ServiceCommissionType,
): ServiceCommissionType =>
  value === 'fixed' || value === 'percentage' ? value : fallback;

export const ServiceCommissionControl = ({
  documentCurrency,
  item,
  onOpen,
  settings,
}: ServiceCommissionControlProps) => {
  const label = getServiceCommissionCollaboratorLabel(item.serviceCommission);
  const commissionType = resolveCommissionType(
    item.serviceCommission?.type,
    settings.defaultType,
  );
  const rateValue = toFiniteNumber(
    item.serviceCommission?.rateValue,
    settings.defaultRate,
  );
  const estimatedCommission = label
    ? calculateServiceCommissionAmount({
        baseAmount: resolveServiceCommissionBaseAmount(item),
        rateValue,
        type: commissionType,
      })
    : null;
  const missingCommissionMeta = settings.requireCollaboratorOnService
    ? 'Requerido'
    : 'Sin comisión';

  return (
    <CommissionButton
      type="button"
      variant={label ? 'secondary' : 'ghost'}
      onClick={() => onOpen(item)}
      aria-label={
        label
          ? `Editar comisión de ${label}`
          : 'Asignar colaborador de comisión'
      }
    >
      <TeamOutlined />
      <ButtonContent>
        <ButtonLabel>{label ?? 'Asignar colaborador'}</ButtonLabel>
        {estimatedCommission !== null ? (
          <ButtonMeta>
            {formatPriceByCurrency(estimatedCommission, documentCurrency)}
          </ButtonMeta>
        ) : (
          <ButtonMeta
            data-warning={
              settings.requireCollaboratorOnService ? 'true' : undefined
            }
          >
            {missingCommissionMeta}
          </ButtonMeta>
        )}
      </ButtonContent>
    </CommissionButton>
  );
};

const CommissionButton = styled(VmButton)`
  && {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    justify-content: stretch;
    justify-items: stretch;
    color: var(--ds-color-text-primary);
  }

  justify-content: flex-start;
  width: 100%;
  min-height: 32px;
  padding-inline: var(--ds-space-2);

  svg {
    color: var(--ds-color-text-primary);
  }
`;

const ButtonContent = styled.span`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-2);
  align-items: center;
  width: 100%;
  min-width: 0;
`;

const ButtonLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
  font-size: var(--ds-font-size-xs);
  text-align: left;
  white-space: nowrap;
`;

const ButtonMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &[data-warning='true'] {
    color: #92400e;
    font-weight: var(--ds-font-weight-semibold);
  }
`;

export default ServiceCommissionControl;
