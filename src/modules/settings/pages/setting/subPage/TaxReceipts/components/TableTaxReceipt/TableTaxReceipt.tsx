import {
  CheckOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  StopOutlined,
} from '@/constants/icons/antd';
import { Button, Dropdown, Modal, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { updateTaxReceipt } from '@/firebase/taxReceipt/updateTaxReceipt';
import TaxReceiptForm from '@/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptForm/TaxReceiptForm';
import type {
  TaxReceiptData,
  TaxReceiptDocument,
  TaxReceiptUser,
} from '@/types/taxReceipt';

type TaxReceiptTableItem = TaxReceiptDocument;

type SetTaxReceiptData = (
  next:
    | TaxReceiptTableItem[]
    | ((prev: TaxReceiptTableItem[]) => TaxReceiptTableItem[]),
) => void;

interface TableTaxReceiptProps {
  array?: TaxReceiptTableItem[] | null;
  setData: SetTaxReceiptData;
  filter?: 'active' | 'archived';
}

interface RowProps {
  disabled?: boolean;
}

interface HealthState {
  label: string;
  tone: 'neutral' | 'warning' | 'danger';
  pillTone: 'positive' | 'neutral' | 'warning' | 'danger';
  detail: string;
}

const hasBusinessId = (
  value: TaxReceiptUser | null,
): value is TaxReceiptUser & { businessID: string } =>
  typeof value?.businessID === 'string' && value.businessID.trim().length > 0;

const formatSequence = (
  seq?: number | string,
  length?: number,
): string | number | undefined => {
  if (seq === undefined || length === undefined) return seq;
  return String(seq).padStart(length, '0');
};

const buildReceiptCode = (data?: TaxReceiptData | null): string => {
  if (!data) return 'Sin codigo';
  const type = data.type?.trim() || '--';
  const serie = data.serie?.trim() || '--';
  return `${type}${serie}`;
};

const buildSequenceLabel = (data?: TaxReceiptData | null): string => {
  if (!data) return 'N/D';
  const code = buildReceiptCode(data);
  const sequence = formatSequence(data.sequence, data.sequenceLength);
  if (sequence === undefined || sequence === null || sequence === '') {
    return code;
  }
  return `${code}${sequence}`;
};

const buildSequenceMeta = (data?: TaxReceiptData | null): string | null => {
  if (!data) return null;

  const increase = data.increase ?? 1;
  const sequenceLength = data.sequenceLength ?? 8;
  const parts: string[] = [];

  if (increase !== 1) {
    parts.push(`Inc. ${increase}`);
  }

  if (sequenceLength !== 8) {
    parts.push(`${sequenceLength} dig.`);
  }

  if (!parts.length) return null;
  return parts.join(' · ');
};

const calculateLimit = (data?: TaxReceiptData | null): string => {
  if (!data) return 'N/D';
  const { type, serie, sequence, quantity, sequenceLength, increase } = data;
  if (!type || !serie || sequence === undefined || !quantity) return 'N/D';

  const parsedSequence = Number.parseInt(String(sequence), 10);
  const parsedQuantity = Number.parseInt(String(quantity), 10);
  const parsedIncrease = Number.parseInt(String(increase ?? 1), 10);

  if (
    Number.isNaN(parsedSequence) ||
    Number.isNaN(parsedQuantity) ||
    Number.isNaN(parsedIncrease)
  ) {
    return 'N/D';
  }

  const limitSequence = parsedSequence + parsedQuantity * parsedIncrease;
  return `${type}${serie}${String(limitSequence).padStart(sequenceLength || 8, '0')}`;
};

const parseQuantity = (value?: number | string): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeAuthorityStatus = (value?: string | null): string | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'not_applicable') return null;

  if (normalized === 'approved' || normalized === 'authorized') {
    return 'Autorizada';
  }

  if (normalized === 'pending') {
    return 'Pendiente';
  }

  if (normalized === 'rejected') {
    return 'Rechazada';
  }

  return value;
};

const resolveHealthState = (data?: TaxReceiptData | null): HealthState => {
  if (data?.disabled) {
    return {
      label: 'Archivada',
      tone: 'neutral',
      pillTone: 'neutral',
      detail: 'Serie fuera de uso',
    };
  }

  const quantity = parseQuantity(data?.quantity);
  const limit = calculateLimit(data);
  const authorityStatus = normalizeAuthorityStatus(data?.authorityStatus);

  if (quantity === 0) {
    return {
      label: 'Agotada',
      tone: 'danger',
      pillTone: 'danger',
      detail: 'No disponible',
    };
  }

  if (limit === 'N/D') {
    return {
      label: 'Incompleta',
      tone: 'warning',
      pillTone: 'warning',
      detail: 'Falta completar el rango fiscal',
    };
  }

  if (authorityStatus) {
    return {
      label: 'Activa',
      tone: 'neutral',
      pillTone: 'positive',
      detail: authorityStatus,
    };
  }

  return {
    label: 'Activa',
    tone: 'neutral',
    pillTone: 'positive',
    detail: 'Lista para emitir',
  };
};

export const TableTaxReceipt = ({
  array,
  setData,
  filter = 'active',
}: TableTaxReceiptProps) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<TaxReceiptData | null>(
    null,
  );
  const user = useSelector(selectUser);

  const safeArray = array ?? [];
  const visibleReceipts =
    filter === 'archived'
      ? safeArray.filter((item) => item.data?.disabled)
      : safeArray.filter((item) => !item.data?.disabled);

  if (!visibleReceipts.length) {
    return (
      <Container>
        <EmptyMessage>
          {filter === 'archived'
            ? 'No hay comprobantes archivados.'
            : 'No hay comprobantes activos.'}
        </EmptyMessage>
      </Container>
    );
  }

  const handleToggleDisabled = async (index: number) => {
    const item = safeArray[index];
    if (!item?.data) return;

    const isCurrentlyDisabled = item.data?.disabled === true;
    const actionText = isCurrentlyDisabled ? 'habilitar' : 'archivar';
    const statusText = isCurrentlyDisabled ? 'activa' : 'archivada';

    Modal.confirm({
      title: `¿Quieres ${actionText} esta serie?`,
      icon: <ExclamationCircleOutlined />,
      content: `La serie quedará ${statusText} para futuras emisiones.`,
      okText: isCurrentlyDisabled ? 'Habilitar' : 'Archivar',
      okType: isCurrentlyDisabled ? 'primary' : 'default',
      cancelText: 'Cancelar',
      onOk: () => {
        if (!hasBusinessId(user)) {
          message.error(`Error al ${actionText} la serie`);
          return;
        }

        if (typeof item.data.id !== 'string') {
          message.error(`Error al ${actionText} la serie`);
          return;
        }

        const newDisabledState = !isCurrentlyDisabled;
        const dataToUpdate: TaxReceiptData = {
          ...item.data,
          id: item.data.id,
          disabled: newDisabledState,
        };

        return updateTaxReceipt(user, dataToUpdate).then(
          () => {
            message.success(
              `Serie ${isCurrentlyDisabled ? 'habilitada' : 'archivada'} correctamente`,
            );
            const newArray = safeArray.map((it, i) =>
              i === index
                ? { ...it, data: { ...it.data, disabled: newDisabledState } }
                : it,
            );
            setData(newArray);
          },
          (error) => {
            console.error(`Error al ${actionText} la serie:`, error);
            message.error(`Error al ${actionText} la serie`);
          },
        );
      },
    });
  };

  const handleEditTaxReceipt = (index: number) => {
    const itemToEdit = safeArray[index];
    if (!itemToEdit?.data) {
      message.error('No se pudieron cargar los datos para editar.');
      return;
    }

    setCurrentEditItem({ ...itemToEdit.data });
    setEditModalVisible(true);
  };

  return (
    <Container>
      <HeaderRow>
        <HeaderCell>Comprobante</HeaderCell>
        <HeaderCell>Secuencia</HeaderCell>
        <HeaderCell>Disponibilidad</HeaderCell>
        <HeaderCell>Estado</HeaderCell>
        <HeaderActionCell />
      </HeaderRow>

      {visibleReceipts.map((item, idx) => {
        const sourceIndex = safeArray.indexOf(item);
        const quantity = parseQuantity(item.data?.quantity);
        const limit = calculateLimit(item.data);
        const healthState = resolveHealthState(item.data);
        const sequenceMeta = buildSequenceMeta(item.data);
        const menuItems: MenuProps['items'] = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Editar serie',
            onClick: () => handleEditTaxReceipt(sourceIndex),
          },
          {
            key: 'toggle',
            icon: item.data?.disabled ? <CheckOutlined /> : <StopOutlined />,
            label: item.data?.disabled ? 'Habilitar serie' : 'Archivar serie',
            onClick: () => {
              void handleToggleDisabled(sourceIndex);
            },
          },
        ];

        return (
          <DataRow
            key={item.data?.id || idx}
            onDoubleClick={() => handleEditTaxReceipt(sourceIndex)}
            disabled={item.data?.disabled}
          >
            <CompositeCell>
              <PrimaryText>{item.data?.name || 'Sin nombre'}</PrimaryText>
              <SecondaryText>{buildReceiptCode(item.data)}</SecondaryText>
            </CompositeCell>

            <CompositeCell>
              <PrimaryText>{buildSequenceLabel(item.data)}</PrimaryText>
              {sequenceMeta ? (
                <SecondaryText>{sequenceMeta}</SecondaryText>
              ) : null}
            </CompositeCell>

            <CompositeCell>
              <PrimaryText tone={healthState.tone}>
                {quantity === null ? 'Disponibilidad N/D' : `${quantity} disponibles`}
              </PrimaryText>
              <SecondaryText tone={healthState.tone}>
                <Tooltip title="Ultimo NCF disponible dentro del rango configurado">
                  <span>{limit === 'N/D' ? 'Límite no disponible' : `Límite ${limit}`}</span>
                </Tooltip>
              </SecondaryText>
            </CompositeCell>

            <CompositeCell>
              <StatusPill tone={healthState.pillTone}>
                {healthState.label}
              </StatusPill>
              <SecondaryText tone={healthState.tone}>
                {healthState.detail}
              </SecondaryText>
            </CompositeCell>

            <ActionCell>
              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                <MenuButton
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(event) => event.stopPropagation()}
                />
              </Dropdown>
            </ActionCell>
          </DataRow>
        );
      })}

      <TaxReceiptForm
        editModalVisible={editModalVisible}
        setEditModalVisible={setEditModalVisible}
        currentEditItem={currentEditItem}
      />
    </Container>
  );
};

const Container = styled.div`
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const EmptyMessage = styled.div`
  padding: var(--ds-space-6);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
  text-align: center;
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns:
    minmax(220px, 1.2fr) minmax(200px, 1fr) minmax(180px, 0.9fr) minmax(
      150px,
      0.8fr
    )
    56px;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--ds-space-2);
  border-bottom: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-subtle);
`;

const HeaderCell = styled.div`
  padding: 0 var(--ds-space-2);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-color-text-tertiary);
`;

const HeaderActionCell = styled.div`
  width: 100%;
`;

const DataRow = styled.div<RowProps>`
  display: grid;
  grid-template-columns:
    minmax(220px, 1.2fr) minmax(200px, 1fr) minmax(180px, 0.9fr) minmax(
      150px,
      0.8fr
    )
    56px;
  align-items: center;
  min-height: 72px;
  padding: 0 var(--ds-space-2);
  border-bottom: 1px solid var(--ds-color-border-default);
  background: ${(props) =>
    props.disabled ? 'var(--ds-color-bg-subtle)' : 'var(--ds-color-bg-surface)'};
  transition: background-color 0.18s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: var(--ds-color-bg-subtle);
  }
`;

const CompositeCell = styled.div`
  display: grid;
  gap: 2px;
  padding: var(--ds-space-3) var(--ds-space-2);
  min-width: 0;
`;

const StatusPill = styled.span<{ tone: HealthState['pillTone'] }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  border: 1px solid;
  white-space: nowrap;

  ${(props) => {
    if (props.tone === 'positive') {
      return `
        color: #166534;
        background: #dcfce7;
        border-color: #86efac;
      `;
    }

    if (props.tone === 'warning') {
      return `
        color: #92400e;
        background: #fef3c7;
        border-color: #fcd34d;
      `;
    }

    if (props.tone === 'danger') {
      return `
        color: #991b1b;
        background: #fee2e2;
        border-color: #fca5a5;
      `;
    }

    return `
      color: var(--ds-color-text-secondary);
      background: var(--ds-color-bg-subtle);
      border-color: var(--ds-color-border-default);
    `;
  }}
`;

const PrimaryText = styled.span<{ tone?: HealthState['tone'] }>`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: ${(props) => {
    if (props.tone === 'danger') return 'var(--ds-color-text-danger, #cf1322)';
    if (props.tone === 'warning') return 'var(--ds-color-text-warning, #ad6800)';
    return 'var(--ds-color-text-primary)';
  }};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SecondaryText = styled.span<{ tone?: HealthState['tone'] }>`
  font-size: var(--ds-font-size-xs);
  color: ${(props) => {
    if (props.tone === 'danger') return 'var(--ds-color-text-danger, #cf1322)';
    if (props.tone === 'warning') return 'var(--ds-color-text-warning, #ad6800)';
    return 'var(--ds-color-text-secondary)';
  }};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const MenuButton = styled(Button)`
  && {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--ds-radius-md);
    color: var(--ds-color-text-secondary);
  }

  &&:hover {
    color: var(--ds-color-text-primary);
    background: var(--ds-color-bg-subtle);
  }
`;
