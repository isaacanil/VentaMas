import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { navigateWarehouse } from '../../../../../features/warehouse/warehouseSlice';
import { useListenProductsStockByLocation } from '../../../../../firebase/warehouse/productStockService';
import { useTransformedWarehouseData } from '../../../../../firebase/warehouse/warehouseNestedServise';
import { useDefaultWarehouse } from '../../../../../firebase/warehouse/warehouseService';
import { ResizableSidebar } from '../../../../component/ResizebleSidebar/ResizebleSidebar';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

import InventoryMenu from './components/DetailView/InventoryMenu';
import Sidebar from './components/Sidebar/Sidebar';

const makePathFromParams = (params) => {
  const path = [];
  if (params.warehouseId) path.push(params.warehouseId);
  if (params.shelfId) path.push(params.shelfId);
  if (params.rowId) path.push(params.rowId);
  if (params.segmentId) path.push(params.segmentId);
  return path.join('/');
};

const sanitizeForRedux = (value) => {
  if (value === null || value === undefined) return value;

  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForRedux);
  }

  if (typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeForRedux(value[key]);
      return acc;
    }, {});
  }

  return value;
};

export const Warehouse = () => {
  const { data, loading, error } = useTransformedWarehouseData();
  const { defaultWarehouse, loading: loadingDefault } = useDefaultWarehouse();
  const params = useParams();
  const navigate = useNavigate();

  const path = makePathFromParams(params);

  useListenProductsStockByLocation(path);

  const dispatch = useDispatch();

  useEffect(() => {
    // Si no hay parámetros y tenemos el almacén por defecto, navegamos a él
    if (
      !params.warehouseId &&
      params.warehouseId === ':warehouseId' &&
      !loading &&
      !loadingDefault &&
      defaultWarehouse
    ) {
      navigate(`/inventory/warehouses/warehouse/${defaultWarehouse.id}`);
      return;
    }

    if (!loading && data) {
      // Warehouse
      if (params.warehouseId) {
        const warehouseData = data.find((d) => d.id === params.warehouseId);
        if (warehouseData)
          dispatch(
            navigateWarehouse({
              view: 'warehouse',
              data: sanitizeForRedux(warehouseData),
            }),
          );
      }
      // Shelf
      if (params.shelfId && params.warehouseId) {
        const warehouseData = data.find((d) => d.id === params.warehouseId);
        const shelfData = warehouseData?.children?.find(
          (s) => s.id === params.shelfId,
        );
        if (shelfData)
          dispatch(
            navigateWarehouse({
              view: 'shelf',
              data: sanitizeForRedux(shelfData),
            }),
          );
      }
      // Row
      if (params.rowId && params.shelfId && params.warehouseId) {
        const warehouseData = data.find((d) => d.id === params.warehouseId);
        const shelfData = warehouseData?.children?.find(
          (s) => s.id === params.shelfId,
        );
        const rowData = shelfData?.children?.find((r) => r.id === params.rowId);
        if (rowData)
          dispatch(
            navigateWarehouse({
              view: 'rowShelf',
              data: sanitizeForRedux(rowData),
            }),
          );
      }
      // Segment
      if (
        params.segmentId &&
        params.rowId &&
        params.shelfId &&
        params.warehouseId
      ) {
        const warehouseData = data.find((d) => d.id === params.warehouseId);
        const shelfData = warehouseData?.children?.find(
          (s) => s.id === params.shelfId,
        );
        const rowData = shelfData?.children?.find((r) => r.id === params.rowId);
        const segmentData = rowData?.children?.find(
          (seg) => seg.id === params.segmentId,
        );
        if (segmentData)
          dispatch(
            navigateWarehouse({
              view: 'segment',
              data: sanitizeForRedux(segmentData),
            }),
          );
      }
    }
  }, [
    loading,
    loadingDefault,
    data,
    params,
    dispatch,
    defaultWarehouse,
    navigate,
  ]);

  if (error) return <div>Error al cargar los datos</div>;

  return (
    <Container>
      <MenuApp sectionName={'Almacenes'} />
      <InventoryMenu />
      <ResizableSidebar Sidebar={<Sidebar items={data} />}>
        <Outlet />
      </ResizableSidebar>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  height: 100%;
  grid-template-rows: min-content min-content 1fr;
  overflow: hidden;
`;
