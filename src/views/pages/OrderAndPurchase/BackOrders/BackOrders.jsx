import { Spin, Empty, message } from 'antd';
import { saveAs } from 'file-saver';
import { AnimatePresence } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../features/auth/userSlice';
import {
  useEnrichedBackOrders,
  updateBackOrder,
} from '../../../../firebase/warehouse/backOrderService';
import InventoryMenu from '../../../pages/Inventory/components/Warehouse/components/DetailView/InventoryMenu';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';

import FulfillModal from './components/FulfillModal';
import Header from './components/Header';
import ProductGroup from './components/ProductGroup';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
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

const BackOrders = () => {
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [sortBy, setSortBy] = useState('name-asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fulfillOpen, setFulfillOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: backorders, loading } = useEnrichedBackOrders();
  const user = useSelector(selectUser);

  const stats = useMemo(
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
        ? item.productName.toLowerCase().includes(searchText.toLowerCase())
        : true;

      // Robust date handling for dayjs/moment/Date
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdMs = new Date(item.createdAt).getTime();
        const startMs =
          dateRange[0]?.startOf?.('day')?.valueOf?.() ??
          new Date(dateRange[0]).setHours(0, 0, 0, 0);
        const endMs =
          dateRange[1]?.endOf?.('day')?.valueOf?.() ??
          new Date(dateRange[1]).setHours(23, 59, 59, 999);
        matchesDate = createdMs >= startMs && createdMs <= endMs;
      }

      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [backorders, searchText, dateRange, statusFilter]);

  const handleExport = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
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

      const rows = filteredBackorders.map((r) => ({
        productName: r.productName,
        status: toEs(r.status),
        initialQuantity: r.initialQuantity ?? 0,
        pendingQuantity: r.pendingQuantity ?? 0,
        createdAt: new Date(r.createdAt).toLocaleString(),
        updatedAt: new Date(r.updatedAt).toLocaleString(),
      }));

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
    } catch (err) {
      console.error(err);
      message.error('No se pudo exportar a Excel');
    }
  };

  const groupedBackorders = useMemo(() => {
    // Filtrar backorders
    const filtered = backorders.filter((item) => {
      const matchesSearch = searchText
        ? item.productName.toLowerCase().includes(searchText.toLowerCase())
        : true;

      // Robust date handling for dayjs/moment/Date
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdMs = new Date(item.createdAt).getTime();
        const startMs =
          dateRange[0]?.startOf?.('day')?.valueOf?.() ??
          new Date(dateRange[0]).setHours(0, 0, 0, 0);
        const endMs =
          dateRange[1]?.endOf?.('day')?.valueOf?.() ??
          new Date(dateRange[1]).setHours(23, 59, 59, 999);
        matchesDate = createdMs >= startMs && createdMs <= endMs;
      }

      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });

    // Agrupar por producto y luego por fecha
    const groups = filtered.reduce((acc, item) => {
      const key = item.productId;
      const dateKey = new Date(item.createdAt).toLocaleDateString();

      if (!acc[key]) {
        acc[key] = {
          productId: key,
          productName: item.productName,
          totalQuantity: 0,
          pendingQuantity: 0,
          reservedPendingQuantity: 0,
          directPendingQuantity: 0,
          lastUpdate: item.updatedAt,
          progress: 0,
          dateGroups: {},
        };
      }

      if (!acc[key].dateGroups[dateKey]) {
        acc[key].dateGroups[dateKey] = {
          date: new Date(item.createdAt),
          items: [],
          totalQuantity: 0,
          pendingQuantity: 0,
        };
      }

      acc[key].dateGroups[dateKey].items.push(item);
      acc[key].dateGroups[dateKey].totalQuantity += item.initialQuantity || 0;
      acc[key].dateGroups[dateKey].pendingQuantity += item.pendingQuantity || 0;

      acc[key].totalQuantity += item.initialQuantity || 0;
      acc[key].pendingQuantity += item.pendingQuantity || 0;
      if (item.status === 'reserved') {
        acc[key].reservedPendingQuantity += item.pendingQuantity || 0;
      } else if (item.status === 'pending') {
        acc[key].directPendingQuantity += item.pendingQuantity || 0;
      }
      acc[key].lastUpdate = new Date(
        Math.max(new Date(acc[key].lastUpdate), new Date(item.updatedAt)),
      );
      acc[key].progress = Math.round(
        ((acc[key].totalQuantity - acc[key].pendingQuantity) /
          acc[key].totalQuantity) *
          100,
      );
      return acc;
    }, {});

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
          return b.lastUpdate - a.lastUpdate;
        case 'date-asc':
          return a.lastUpdate - b.lastUpdate;
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
        sectionNameIcon="📦"
        displayName="Back Orders"
        onBackClick={() => {}}
      />
      <InventoryMenu />
      <Content>
        <Header
          stats={stats}
          searchText={searchText}
          setSearchText={setSearchText}
          dateRange={dateRange}
          setDateRange={setDateRange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
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
                  onFulfill={(g) => {
                    setSelectedGroup(g);
                    setFulfillOpen(true);
                  }}
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
            setFulfillOpen(false);
            setSelectedGroup(null);
          }
        }}
        onConfirm={async (amount) => {
          if (!selectedGroup || !user?.businessID) return;
          try {
            setSubmitting(true);
            let remaining = amount;

            // Tomar items actuales del store por productId (más seguro que snapshot de selección)
            const items = backorders
              .filter(
                (it) =>
                  it.productId === selectedGroup.productId &&
                  it.status === 'pending' &&
                  (it?.pendingQuantity ?? 0) > 0,
              )
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            for (const it of items) {
              if (remaining <= 0) break;
              const alloc = Math.min(remaining, it.pendingQuantity || 0);
              if (alloc <= 0) continue;
              const newPending = Math.max(0, (it.pendingQuantity || 0) - alloc);
              await updateBackOrder(user.businessID, it.id, {
                pendingQuantity: newPending,
                status: newPending === 0 ? 'completed' : it.status,
              });
              remaining -= alloc;
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
              setFulfillOpen(false);
              setSelectedGroup(null);
            } else {
              // Actualizar vista del modal para reflejar nuevo pendiente sin cerrar
              setSelectedGroup((prev) => {
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
              });
            }
          } catch (err) {
            console.error(err);
            message.error('No se pudo aplicar la cobertura.');
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </Container>
  );
};

export default BackOrders;
