// Importamos las librerías necesarias
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

const getPathIds = (path) => {
    if (!path) return {};
    const ids = path?.split('/')?.filter((id) => id !== '');
    return {
        warehouseId: ids[0],
        shelfId: ids[1],
        rowShelfId: ids[2],
        segmentId: ids[3]
    }
}

function extractIdsFromPath(path) {
    const ids = path.split('/');
    return {
        warehouseId: ids[0] || null,
        shelfId: ids[1] || null,
        rowShelfId: ids[2] || null,
        segmentId: ids[3] || null,
    };
}

function transformInventoryItems(inventoryItems, data) {
    return inventoryItems.map(item => {
        const { warehouseId, shelfId, rowShelfId, segmentId } = extractIdsFromPath(item.path);

        // Variables para almacenar los nombres
        let warehouseName = '';
        let warehouseShortName = '';
        let shelfName = '';
        let rowName = '';
        let productStockId = item.id;
        let segmentName = '';
        let path = item.path;

        // Obtener datos del almacén
        if (warehouseId) {
            const warehouse = data.warehouses.find(w => w.id === warehouseId || w.warehouseId === warehouseId);
            if (warehouse) {
                warehouseName = warehouse.data.name || '';
                warehouseShortName = warehouse.data.shortName || '';
            }
        }

        // Obtener datos de la estantería
        if (shelfId) {
            const shelf = data.shelves.find(s => s.id === shelfId || s.shelfId === shelfId);
            if (shelf) {
                shelfName = shelf.data.shortName || '';
            }
        }

        // Obtener datos de la fila
        if (rowShelfId) {
            const row = data.rows.find(r => r.id === rowShelfId || r.rowShelfId === rowShelfId);
            if (row) {
                rowName = row.data.shortName || '';
            }
        }

        // Obtener datos del segmento
        if (segmentId) {
            const segment = data.segments.find(s => s.id === segmentId || s.segmentId === segmentId);
            if (segment) {
                segmentName = segment.data.shortName || '';
            }
        }

        // Obtener otros campos del item de inventario
        const batch = item.batchId || '';
        const expirationDate = item.expirationDate || '';
        const stock = item.stock || 0;

        // Retornar el objeto con la estructura deseada
        return {
            warehouse: warehouseName,
            shortName: warehouseShortName,
            shelf: shelfName,
            row: rowName,
            segment: segmentName,
            path: path,
            productStockId: productStockId,
            batch: batch,
            expirationDate: expirationDate,
            stock: stock
        };
    });
}
const saveBatchDataOnInventory = (inventory, batches) => {
    return inventory.map(item => {
        const batch = batches.find(b => b.id === item.batch);
        if (batch) {
            return {
                ...item,
                productStockId: batch.productStockId,
                batchData: {
                    shortName: batch.shortName,
                    expirationDate: batch.expirationDate,
                }
            };
        }
        return item;
    });
}

export function buildLocationString(item) {
    let locationString = '';
    if (item.shortName) locationString += item.shortName;
    if (item.shelf) locationString += `-${item.shelf}`;
    if (item.row) locationString += `-${item.row}`;
    if (item.segment) locationString += `-${item.segment}`;
    return locationString;
}

function sortInventoryByLocation(inventoryItems) {
    return inventoryItems.sort((a, b) => {
        const locationA = buildLocationString(a).toLowerCase();
        const locationB = buildLocationString(b).toLowerCase();
        if (locationA < locationB) return -1;
        if (locationA > locationB) return 1;
        return 0;
    });
}

function getBatchIdsFromInventory(inventory) {
    if (!Array.isArray(inventory) || inventory.length === 0) {
        return []; // Devuelve un array vacío si el inventario es inválido o vacío
    }
    const batchIds = inventory.map(item => item.batch);
    return [...new Set(batchIds)]; // Remove duplicate batch IDs
}

// Componente principal
const ProductExpirySelection = () => {
    const dispatch = useDispatch();
    const productId = useSelector(selectProductId);
    const isOpen = useSelector(selectModalOpen);
    const inventory = useSelector(selectFilteredInventory);
    const user = useSelector(selectUser);

    const { data: productStock } = useListenProductsStock(productId);

    const paths = productStock && Array.isArray(productStock) ? productStock.map((product) => product?.path) : [];

    const pathIds = useMemo(() => paths.map((path) => getPathIds(path)), [paths]);

    const { data, loading, error } = useGetWarehouseData(user, pathIds);

    const { data: batches, loading: batchesLoading, error: batchesError } = useListenBatchesByIds(getBatchIdsFromInventory(inventory));

    // const memorizedInventoryData = useMemo(() => {
    //     if (!loading && !batchesLoading && productStock && data && batches) {
    //       const inventoryData = transformInventoryItems(productStock, data);
    //       const inventoryWithBatches = saveBatchDataOnInventory(inventoryData, batches);
    //       return sortInventoryByLocation(inventoryWithBatches);
    //     }
    //     return [];
    //   }, [productStock, data, batches]);

    // useEffect(() => {
    //     if (memorizedInventoryData) {
    //         dispatch(updateInventory(memorizedInventoryData));
    //     }
    // }, [memorizedInventoryData]);
    
    // const handleToggleOrder = (field) => {
    //     dispatch(setOrderBy(field));
    // };

    // const handleClose = () => {
    //     dispatch(setModalOpen(false));
    //     dispatch(clearProductExpirySelector());
    // };

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
                {/* <FilterInput
                    filtro={filter}
                    setFiltro={(value) => dispatch(setFilter(value))}
                    toggleOrden={handleToggleOrder}
                    ordenPor={orderBy}
                    ordenAscendente={orderAscending}
                /> */}
                <StyledCardGrid>
                    {/* {inventory.map((item) => (
                            <InventoryCard key={item.productStockId} item={item} />
                        ))} */}
                </StyledCardGrid>
            </StyledPageContainer>
        </Modal>
    );
};

export default ProductExpirySelection;