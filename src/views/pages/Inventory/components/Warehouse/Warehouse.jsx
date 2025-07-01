import React, { useMemo, useEffect } from 'react'
import styled from "styled-components"
import { ResizableSidebar } from '../../../../component/ResizebleSidebar/ResizebleSidebar'
import { useTransformedWarehouseData } from '../../../../../firebase/warehouse/warehouseNestedServise'
import { MenuApp } from '../../../..'
import { DetailView } from './components/DetailView/DetailView'
import Sidebar from './components/Sidebar/Sidebar'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useListenProductsStockByLocation } from '../../../../../firebase/warehouse/productStockService'
import { navigateWarehouse } from '../../../../../features/warehouse/warehouseSlice'
import { useDefaultWarehouse } from '../../../../../firebase/warehouse/warehouseService'
import InventoryMenu from './components/DetailView/InventoryMenu'

const makePathFromParams = (params) => {
  const path = [];
  if (params.warehouseId) path.push(params.warehouseId);
  if (params.shelfId) path.push(params.shelfId);
  if (params.rowId) path.push(params.rowId);
  if (params.segmentId) path.push(params.segmentId);
  return path.join('/');
};

export const Warehouse = () => {
  const { data, loading, error } = useTransformedWarehouseData()
  const { defaultWarehouse, loading: loadingDefault } = useDefaultWarehouse()
  const params = useParams()
  const navigate = useNavigate()

  const path = makePathFromParams(params)

  useListenProductsStockByLocation(path)

  const dispatch = useDispatch()

  useEffect(() => {
    // Si no hay parámetros y tenemos el almacén por defecto, navegamos a él
    if ((!params.warehouseId && params.warehouseId === ':warehouseId') && !loading && !loadingDefault && defaultWarehouse) {
      navigate(`/inventory/warehouses/warehouse/${defaultWarehouse.id}`);
      return;
    }

    if (!loading && data) {
      // Warehouse
      if (params.warehouseId) {
        const warehouseData = data.find(d => d.id === params.warehouseId);
        if (warehouseData) dispatch(navigateWarehouse({ view: 'warehouse', data: warehouseData }));
      }
      // Shelf
      if (params.shelfId && params.warehouseId) {
        const warehouseData = data.find(d => d.id === params.warehouseId);
        const shelfData = warehouseData?.children?.find(s => s.id === params.shelfId);
        if (shelfData) dispatch(navigateWarehouse({ view: 'shelf', data: shelfData }));
      }
      // Row
      if (params.rowId && params.shelfId && params.warehouseId) {
        const warehouseData = data.find(d => d.id === params.warehouseId);
        const shelfData = warehouseData?.children?.find(s => s.id === params.shelfId);
        const rowData = shelfData?.children?.find(r => r.id === params.rowId);
        if (rowData) dispatch(navigateWarehouse({ view: 'rowShelf', data: rowData }));
      }
      // Segment
      if (params.segmentId && params.rowId && params.shelfId && params.warehouseId) {
        const warehouseData = data.find(d => d.id === params.warehouseId);
        const shelfData = warehouseData?.children?.find(s => s.id === params.shelfId);
        const rowData = shelfData?.children?.find(r => r.id === params.rowId);
        const segmentData = rowData?.children?.find(seg => seg.id === params.segmentId);
        if (segmentData) dispatch(navigateWarehouse({ view: 'segment', data: segmentData }));
      }
    }
  }, [loading, loadingDefault, data, params, dispatch, defaultWarehouse, navigate])

  const memoizedSidebar = useMemo(() => (
    <Sidebar items={data} />
  ), [data]);

  // const memoizedDetailView = useMemo(() => (
  //   <DetailView />
  // ), [data]);

  // if (loading) return <div>Cargando...</div>
  if (error) return <div>Error al cargar los datos</div>

  return (
    <Container>
      <MenuApp sectionName={"Almacenes"} />
      <InventoryMenu />
      <ResizableSidebar
        Sidebar={memoizedSidebar}
      >
        <Outlet />
      </ResizableSidebar>
    </Container>
  )
}

const Container = styled.div`
  display: grid;
  height: 100%;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
`