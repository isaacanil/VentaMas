import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { navigateWarehouse } from '@/features/warehouse/warehouseSlice';
import { useListenProductsStockByLocation } from '@/hooks/useProductStock';
import { useTransformedWarehouseData } from '@/firebase/warehouse/warehouseNestedServise';
import { useDefaultWarehouse } from '@/firebase/warehouse/warehouseService';
import type { RowShelf } from '@/models/Warehouse/RowShelf';
import type { Segment } from '@/models/Warehouse/Segment';
import type { Shelf } from '@/models/Warehouse/Shelf';
import type { Warehouse as WarehouseModel } from '@/models/Warehouse/Warehouse';
import { ResizableSidebar } from '@/components/layout/ResizebleSidebar/ResizebleSidebar';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import InventoryMenu from './components/DetailView/InventoryMenu';
import Sidebar from './components/Sidebar/Sidebar';

type WarehouseRouteParams = {
  warehouseId?: string;
  shelfId?: string;
  rowId?: string;
  segmentId?: string;
};

type WarehouseNode = {
  id: string;
  children?: WarehouseNode[];
  [key: string]: unknown;
};

const makePathFromParams = (params: WarehouseRouteParams) => {
  const path: string[] = [];
  if (params.warehouseId) path.push(params.warehouseId);
  if (params.shelfId) path.push(params.shelfId);
  if (params.rowId) path.push(params.rowId);
  if (params.segmentId) path.push(params.segmentId);
  return path.join('/');
};

const sanitizeForRedux = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForRedux);
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.keys(record).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sanitizeForRedux(record[key]);
      return acc;
    }, {});
  }

  return value;
};

export const Warehouse = () => {
  const { data, loading, error } = useTransformedWarehouseData();
  const { defaultWarehouse, loading: loadingDefault } = useDefaultWarehouse();
  const { warehouseId, shelfId, rowId, segmentId } =
    useParams<WarehouseRouteParams>();
  const navigate = useNavigate();

  const path = makePathFromParams({
    warehouseId,
    shelfId,
    rowId,
    segmentId,
  });

  useListenProductsStockByLocation(path);

  const dispatch = useDispatch();

  useEffect(() => {
    // Si no hay parámetros y tenemos el almacén por defecto, navegamos a él
    if (
      (!warehouseId || warehouseId === ':warehouseId') &&
      !loading &&
      !loadingDefault &&
      defaultWarehouse
    ) {
      navigate(`/inventory/warehouses/warehouse/${defaultWarehouse.id}`);
      return;
    }

    const nodes = (data || []) as WarehouseNode[];
    if (!loading) {
      // Warehouse
      if (warehouseId) {
        const warehouseData = nodes.find((d) => d.id === warehouseId);
        if (warehouseData)
          dispatch(
            navigateWarehouse({
              view: 'warehouse',
              data: sanitizeForRedux(warehouseData) as WarehouseModel,
            }),
          );
      }
      // Shelf
      if (shelfId && warehouseId) {
        const warehouseData = nodes.find((d) => d.id === warehouseId);
        const shelfData = warehouseData?.children?.find(
          (s) => s.id === shelfId,
        );
        if (shelfData)
          dispatch(
            navigateWarehouse({
              view: 'shelf',
              data: sanitizeForRedux(shelfData) as Shelf,
            }),
          );
      }
      // Row
      if (rowId && shelfId && warehouseId) {
        const warehouseData = nodes.find((d) => d.id === warehouseId);
        const shelfData = warehouseData?.children?.find(
          (s) => s.id === shelfId,
        );
        const rowData = shelfData?.children?.find((r) => r.id === rowId);
        if (rowData)
          dispatch(
            navigateWarehouse({
              view: 'rowShelf',
              data: sanitizeForRedux(rowData) as RowShelf,
            }),
          );
      }
      // Segment
      if (segmentId && rowId && shelfId && warehouseId) {
        const warehouseData = nodes.find((d) => d.id === warehouseId);
        const shelfData = warehouseData?.children?.find(
          (s) => s.id === shelfId,
        );
        const rowData = shelfData?.children?.find((r) => r.id === rowId);
        const segmentData = rowData?.children?.find(
          (seg) => seg.id === segmentId,
        );
        if (segmentData)
          dispatch(
            navigateWarehouse({
              view: 'segment',
              data: sanitizeForRedux(segmentData) as Segment,
            }),
          );
      }
    }
  }, [
    loading,
    loadingDefault,
    data,
    warehouseId,
    shelfId,
    rowId,
    segmentId,
    dispatch,
    defaultWarehouse,
    navigate,
  ]);

  if (error) return <div>Error al cargar los datos</div>;

  return (
    <>
      <MenuApp sectionName={'Almacenes'} />
      <Container>
        <InventoryMenu />
        <ResizableSidebar Sidebar={<Sidebar items={data} />}>
          <Outlet />
        </ResizableSidebar>
      </Container>
    </>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;
