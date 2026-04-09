import ExcelJS from 'exceljs';
import { Spin, Empty, message } from 'antd';
import { saveAs } from 'file-saver';
import { AnimatePresence } from 'framer-motion';
import { useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { PageShell } from '@/components/layout/PageShell';
import {
  useEnrichedBackOrders,
  updateBackOrder,
} from '@/firebase/warehouse/backOrderService';
import InventoryMenu from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/InventoryMenu';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import type { UserIdentity } from '@/types/users';

import FulfillModal from './components/FulfillModal';
import Header from './components/Header';
import ProductGroup from './components/ProductGroup';
import type {
  BackOrderItem,
  BackorderGroup,
  BackorderSort,
  BackorderStats,
  BackorderStatusFilter,
  DateRangeValue,
} from './types';

const Container = styled(PageShell)`
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #fff;
`;

const ProductGroupsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 12px;
`;

interface BackOrdersState {
  searchText: string;
  dateRange: DateRangeValue;
  sortBy: BackorderSort;
  statusFilter: BackorderStatusFilter;
  fulfillOpen: boolean;
  selectedGroup: BackorderGroup | null;
  submitting: boolean;
}

type BackOrdersAction =
  | { type: 'setSearchText'; value: string }
  | { type: 'setDateRange'; value: DateRangeValue }
  | { type: 'setSortBy'; value: BackorderSort }
  | { type: 'setStatusFilter'; value: BackorderStatusFilter }
  | { type: 'openFulfill'; group: BackorderGroup }
  | { type: 'closeFulfill' }
  | { type: 'setSubmitting'; value: boolean }
  | { type: 'setSelectedGroup'; value: BackorderGroup | null };

const initialBackOrdersState: BackOrdersState = {
  searchText: '',
  dateRange: null,
  sortBy: 'name-asc',
  statusFilter: 'all',
  fulfillOpen: false,
  selectedGroup: null,
  submitting: false,
};

const backOrdersReducer = (
  state: BackOrdersState,
  action: BackOrdersAction,
): BackOrdersState => {
  switch (action.type) {
    case 'setSearchText':
      return { ...state, searchText: action.value };
    case 'setDateRange':
      return { ...state, dateRange: action.value };
    case 'setSortBy':
      return { ...state, sortBy: action.value };
    case 'setStatusFilter':
      return { ...state, statusFilter: action.value };
    case 'openFulfill':
      return {
        ...state,
        selectedGroup: action.group,
        fulfillOpen: true,
      };
    case 'closeFulfill':
      return {
        ...state,
        fulfillOpen: false,
        selectedGroup: null,
      };
    case 'setSubmitting':
      return { ...state, submitting: action.value };
    case 'setSelectedGroup':
      return { ...state, selectedGroup: action.value };
    default:
      return state;
  }
};

const BackOrders = () => {
  const [state, dispatch] = useReducer(
    backOrdersReducer,
    initialBackOrdersState,
  );
  const {
    searchText,
    dateRange,
    sortBy,
    statusFilter,
    fulfillOpen,
    selectedGroup,
    submitting,
  } = state;
  const { data: backorders = [], loading } = useEnrichedBackOrders() as {
    data: BackOrderItem[];
    loading: boolean;
  };
  const user = useSelector(selectUser) as UserIdentity | null;

  const stats = useMemo<BackorderStats>(
    () => ({
      total: backorders.length,
      pending: backorders.filter((b) => b.status === 'pending').length,
      reserved: backorders.filter((b) => b.status === 'reserved').length,
      completed: backorders.filter((b) => b.status === 'completed').length,
    }),
    [backorders],
  );

  const filteredBackorders = useMemo(() => {
    return backorders.filter((item) => {
      const matchesSearch = searchText
        ? (item.productName ?? '')
            .toLowerCase()
            .includes(searchText.toLowerCase())
        : true;

      // Robust date handling for luxon/Date
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdMs = item.createdAt
          ? new Date(item.createdAt).getTime()
          : 0;
        const startMs = dateRange[0]?.startOf?.('day')?.valueOf?.() ?? 0;
        const endMs = dateRange[1]?.endOf?.('day')?.valueOf?.() ?? 0;
        matchesDate = createdMs >= startMs && createdMs <= endMs;
      }

      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [backorders, searchText, dateRange, statusFilter]);

  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Backorders');

    ws.columns = [
      { header: 'Producto', key: 'productName', width: 28 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Inicial', key: 'initialQuantity', width: 10 },
      { header: 'Pendiente', key: 'pendingQuantity', width: 10 },
      { header: 'Creado', key: 'createdAt', width: 20 },
      { header: 'Actualizado', key: 'updatedAt', width: 20 },
    ];

    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: 'A1', to: 'F1' };

    const toEs = (s) => {
      switch ((s || '').toLowerCase()) {
        case 'pending':
          return 'Pendiente';
        case 'reserved':
          return 'Reservado';
        case 'completed':
          return 'Completado';
        default:
          return s;
      }
    };

    const rows = filteredBackorders.map((r) => {
      const createdAt = r.createdAt ? new Date(r.createdAt) : new Date(0);
      const updatedAt = r.updatedAt ? new Date(r.updatedAt) : new Date(0);
      return {
        productName: r.productName,
        status: toEs(r.status),
        initialQuantity: r.initialQuantity ?? 0,
        pendingQuantity: r.pendingQuantity ?? 0,
        createdAt: createdAt.toLocaleString(),
        updatedAt: updatedAt.toLocaleString(),
      };
    });

    ws.addRows(rows);
    ws.getRow(1).font = { bold: true };

    if (rows.length > 0) {
      const totalRow = ws.addRow([
        'TOTAL',
        '',
        { formula: `SUM(C2:C${rows.length + 1})` },
        { formula: `SUM(D2:D${rows.length + 1})` },
        '',
        '',
      ]);
      totalRow.font = { bold: true };
    }

    const buf = await wb.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    saveAs(
      new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `backorders_${stamp}.xlsx`,
    );
  };

  const groupedBackorders = useMemo(() => {
    // Filtrar backorders
    const filtered = backorders.filter((item) => {
      const matchesSearch = searchText
        ? (item.productName ?? '')
            .toLowerCase()
            .includes(searchText.toLowerCase())
        : true;

      // Robust date handling for luxon/Date
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdMs = item.createdAt
          ? new Date(item.createdAt).getTime()
          : 0;
        const startMs = dateRange[0]?.startOf?.('day')?.valueOf?.() ?? 0;
        const endMs = dateRange[1]?.endOf?.('day')?.valueOf?.() ?? 0;
        matchesDate = createdMs >= startMs && createdMs <= endMs;
      }

      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });

    // Agrupar por producto y luego por fecha
    const groups = filtered.reduce<Record<string, BackorderGroup>>(
      (acc, item) => {
        const key = item.productId ?? 'unknown';
        const safeCreatedAt = item.createdAt
          ? new Date(item.createdAt)
          : new Date(0);
        const safeUpdatedAt = item.updatedAt
          ? new Date(item.updatedAt)
          : safeCreatedAt;
        const dateKey = formatLocaleDate(safeCreatedAt);

        if (!acc[key]) {
          acc[key] = {
            productId: key,
            productName: item.productName || 'Producto sin nombre',
            totalQuantity: 0,
            pendingQuantity: 0,
            reservedPendingQuantity: 0,
            directPendingQuantity: 0,
            lastUpdate: safeUpdatedAt,
            progress: 0,
            dateGroups: {},
          };
        }

        if (!acc[key].dateGroups[dateKey]) {
          acc[key].dateGroups[dateKey] = {
            date: safeCreatedAt,
            items: [],
            totalQuantity: 0,
            pendingQuantity: 0,
          };
        }

        acc[key].dateGroups[dateKey].items.push(item);
        acc[key].dateGroups[dateKey].totalQuantity += item.initialQuantity || 0;
        acc[key].dateGroups[dateKey].pendingQuantity +=
          item.pendingQuantity || 0;

        acc[key].totalQuantity += item.initialQuantity || 0;
        acc[key].pendingQuantity += item.pendingQuantity || 0;
        if (item.status === 'reserved') {
          acc[key].reservedPendingQuantity += item.pendingQuantity || 0;
        } else if (item.status === 'pending') {
          acc[key].directPendingQuantity += item.pendingQuantity || 0;
        }
        const nextUpdate = safeUpdatedAt;
        acc[key].lastUpdate = new Date(
          Math.max(acc[key].lastUpdate.getTime(), nextUpdate.getTime()),
        );
        acc[key].progress = Math.round(
          ((acc[key].totalQuantity - acc[key].pendingQuantity) /
            acc[key].totalQuantity) *
            100,
        );
        return acc;
      },
      {},
    );

    // Ordenar grupos según el criterio seleccionado
    return Object.values(groups).sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.productName || '').localeCompare(
            b.productName || '',
            'es',
            {
              sensitivity: 'base',
            },
          );
        case 'name-desc':
          return (b.productName || '').localeCompare(
            a.productName || '',
            'es',
            {
              sensitivity: 'base',
            },
          );
        case 'pending-desc':
          return b.pendingQuantity - a.pendingQuantity;
        case 'pending-asc':
          return a.pendingQuantity - b.pendingQuantity;
        case 'date-desc':
          return b.lastUpdate.getTime() - a.lastUpdate.getTime();
        case 'date-asc':
          return a.lastUpdate.getTime() - b.lastUpdate.getTime();
        case 'progress-desc':
          return b.progress - a.progress;
        case 'progress-asc':
          return a.progress - b.progress;
        default:
          return 0;
      }
    });
  }, [backorders, searchText, dateRange, sortBy, statusFilter]);

  return (
    <Container>
      <MenuApp
        data={[]}
        sectionName="BackOrders"
        sectionNameIcon="ðŸ“¦"
        onBackClick={() => undefined}
      />
      <InventoryMenu />
      <Content>
        <Header
          stats={stats}
          searchText={searchText}
          setSearchText={(value) =>
            dispatch({ type: 'setSearchText', value })
          }
          setDateRange={(value) => dispatch({ type: 'setDateRange', value })}
          sortBy={sortBy}
          setSortBy={(value) => dispatch({ type: 'setSortBy', value })}
          statusFilter={statusFilter}
          setStatusFilter={(value) =>
            dispatch({ type: 'setStatusFilter', value })
          }
          onExport={handleExport}
          exportDisabled={loading || filteredBackorders.length === 0}
        />

        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <Spin />
          </div>
        ) : groupedBackorders.length === 0 ? (
          <Empty description="Sin backorders para mostrar" />
        ) : (
          <AnimatePresence>
            <ProductGroupsContainer>
              {groupedBackorders.map((group) => (
                <ProductGroup
                  key={group.productId}
                  group={group}
                  onFulfill={(groupToFulfill) =>
                    dispatch({
                      type: 'openFulfill',
                      group: groupToFulfill,
                    })
                  }
                />
              ))}
            </ProductGroupsContainer>
          </AnimatePresence>
        )}
      </Content>

      <FulfillModal
        open={fulfillOpen}
        group={selectedGroup}
        loading={submitting}
        onCancel={() => {
          if (!submitting) {
            dispatch({ type: 'closeFulfill' });
          }
        }}
        onConfirm={async (amount) => {
          if (!selectedGroup || !user?.businessID) return;
          dispatch({ type: 'setSubmitting', value: true });
          let remaining = amount;

          // Tomar items actuales del store por productId (más seguro que snapshot de selección)
          const items = backorders
            .filter(
              (it) =>
                it.productId === selectedGroup.productId &&
                it.status === 'pending' &&
                (it?.pendingQuantity ?? 0) > 0,
            )
            .sort(
              (a, b) =>
                new Date(a.createdAt ?? 0).getTime() -
                new Date(b.createdAt ?? 0).getTime(),
            );

          const updateError = await (async () => {
            for (const it of items) {
              if (remaining <= 0) break;
              const alloc = Math.min(remaining, it.pendingQuantity || 0);
              if (alloc <= 0) continue;
              const newPending = Math.max(0, (it.pendingQuantity || 0) - alloc);
              const currentError = await updateBackOrder(user.businessID, it.id, {
                pendingQuantity: newPending,
                status: newPending === 0 ? 'completed' : it.status,
              })
                .then(() => null)
                .catch((error) => error);
              if (currentError) return currentError;
              remaining -= alloc;
            }
            return null;
          })();

          if (updateError) {
            console.error(updateError);
            message.error('No se pudo aplicar la cobertura.');
            dispatch({ type: 'setSubmitting', value: false });
            return;
          }

          const applied = amount - remaining;

          if (applied <= 0) {
            message.info('No había pendientes para cubrir.');
          } else if (remaining > 0) {
            message.warning(
              `Sobraron ${remaining} sin aplicar por falta de pendientes.`,
            );
          } else {
            message.success('Cobertura aplicada correctamente.');
          }

          // Calcular nuevo pendiente local y cerrar si terminó (llegó a 0)
          const newPendingLocal = Math.max(
            0,
            (selectedGroup.pendingQuantity || 0) - applied,
          );
          const newDirectPendingLocal = Math.max(
            0,
            (selectedGroup.directPendingQuantity || 0) - applied,
          );
          if (newDirectPendingLocal <= 0) {
            dispatch({ type: 'closeFulfill' });
          } else {
            // Actualizar vista del modal para reflejar nuevo pendiente sin cerrar
            dispatch({
              type: 'setSelectedGroup',
              value: ((prev: BackorderGroup | null) => {
              if (!prev) return prev;
              const total = prev.totalQuantity || 0;
              const newProgress =
                total > 0
                  ? Math.round(((total - newPendingLocal) / total) * 100)
                  : 0;
              return {
                ...prev,
                pendingQuantity: newPendingLocal,
                directPendingQuantity: newDirectPendingLocal,
                progress: newProgress,
              };
              })(selectedGroup),
            });
          }
          dispatch({ type: 'setSubmitting', value: false });
        }}
      />
    </Container>
  );
};

export default BackOrders;
