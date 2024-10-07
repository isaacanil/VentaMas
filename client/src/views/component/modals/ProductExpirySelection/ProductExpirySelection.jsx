import { Modal, Button } from 'antd';
import styled from 'styled-components';
import FilterInput from './components/FilterInput';
import InventoryCard from './components/InventoryCard';
import { clearProductExpirySelector, selectFilteredInventory, selectModalOpen, selectProductId, setModalOpen, setOrderBy, updateInventory } from '../../../../features/warehouse/productExpirySelectionSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import { useListenProductsStock } from '../../../../firebase/warehouse/ProductStockService';
import { useGetWarehouseData } from '../../../../firebase/warehouse/warehouseService';
import useListenBatchesByIds from '../../../../firebase/warehouse/batchService';
import { selectUser } from '../../../../features/auth/userSlice';

const StyledPageContainer = styled.div`
  padding: 20px;
  background: linear-gradient(to bottom right, #f0f2f5, #c3d8ff);
  min-height: 75vh;
`;

const StyledCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
`;

const ProductExpirySelection = () => {
    const dispatch = useDispatch();
    
    // Logs en Selectores de Redux
    const productId = useSelector(selectProductId);
    console.log('Selector - productId:', productId);

    const isOpen = useSelector(selectModalOpen);
    console.log('Selector - isOpen:', isOpen);

    const inventory = useSelector(selectFilteredInventory);
    console.log('Selector - inventory:', inventory);

    const user = useSelector(selectUser);
    console.log('Selector - user:', user);

    // Logs en hooks personalizados
    const { data: productStock } = useListenProductsStock(productId);
    console.log('Hook - productStock:', productStock);

    const paths = productStock && Array.isArray(productStock) ? productStock.map((product) => product?.path) : [];
    console.log('Paths:', paths);

    // Logs en useMemo para verificar memoización de pathIds
    const pathIds = useMemo(() => {
        console.log('Calculando pathIds...');
        return paths.map((path) => getPathIds(path));
    }, [paths]);
    console.log('Memoized - pathIds:', pathIds);

    // Logs en hook personalizado para obtener datos del almacén
    const { data, loading, error } = useGetWarehouseData(user, pathIds);
    console.log('Hook - Warehouse Data:', data, 'Loading:', loading, 'Error:', error);

    const { data: batches, loading: batchesLoading, error: batchesError } = useListenBatchesByIds(getBatchIdsFromInventory(inventory));
    console.log('Hook - Batches Data:', batches, 'Loading:', batchesLoading, 'Error:', batchesError);

    // Logs en useMemo para verificar memoización de inventoryData
    const memorizedInventoryData = useMemo(() => {
        if (!loading && !batchesLoading && productStock && data && batches) {
            console.log('Transformando y ordenando inventory data...');
            const inventoryData = transformInventoryItems(productStock, data);
            const inventoryWithBatches = saveBatchDataOnInventory(inventoryData, batches);
            return sortInventoryByLocation(inventoryWithBatches);
        }
        return [];
    }, [productStock, data, batches, loading, batchesLoading]);
    console.log('Memoized - memorizedInventoryData:', memorizedInventoryData);

    // Logs en useEffect para detectar cambios en memorizedInventoryData
    useEffect(() => {
        console.log('useEffect - memorizedInventoryData cambiado:', memorizedInventoryData);
        if (memorizedInventoryData) {
            dispatch(updateInventory(memorizedInventoryData));
        }
    }, [memorizedInventoryData, dispatch]);

    const handleClose = () => {
        dispatch(setModalOpen(false));
        dispatch(clearProductExpirySelector());
    };

    return (
        <Modal
            title="Detalles Importantes"
            open={isOpen}
            width={1000}
            onCancel={handleClose}
            style={{ top: 10 }}
            footer={[
                <Button key="close" onClick={handleClose} type="primary">
                    Cerrar
                </Button>,
            ]}
        >
            <StyledPageContainer>
                <StyledCardGrid>
                    {/* Mapea el inventario si es necesario */}
                    {inventory.map((item) => (
                        <InventoryCard key={item.productStockId} item={item} />
                    ))}
                </StyledCardGrid>
            </StyledPageContainer>
        </Modal>
    );
};

export default ProductExpirySelection;
