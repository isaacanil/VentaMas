import React, { useMemo } from 'react'
import styled from "styled-components"
import { ResizableSidebar } from '../../../../component/ResizebleSidebar/ResizebleSidebar'
import { useTransformedWarehouseData } from '../../../../../firebase/warehouse/warehouseNestedServise'
import { MenuApp } from '../../../..'
import { DetailView } from './components/DetailView'
import Sidebar from './components/Sidebar/Sidebar'

export const Warehouse = () => {
  const { data, loading, error } = useTransformedWarehouseData()

  const memoizedSidebar = useMemo(() => (
    <Sidebar items={data} />
  ), [data]);

  const memoizedDetailView = useMemo(() => (
    <DetailView items={data} />
  ), [data]);

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error al cargar los datos</div>

  return (
    <Container>
      <MenuApp sectionName={"Almacenes"} />
      <ResizableSidebar
        Sidebar={memoizedSidebar}
      >
        {memoizedDetailView}
      </ResizableSidebar>
    </Container>
  )
}

const Container = styled.div` 
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100vh;
  overflow-y: hidden; 
`;