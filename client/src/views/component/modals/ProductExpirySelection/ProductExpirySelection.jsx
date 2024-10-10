import { Modal, Button, Spin } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { clearProductExpirySelector, selectModalOpen, selectProductId, setModalOpen, updateInventory, } from '../../../../features/warehouse/productExpirySelectionSlice';
import { useDispatch, useSelector } from 'react-redux';
import InventoryCard from './components/InventoryCard';
import { selectUser } from '../../../../features/auth/userSlice';
import { fetchAllInventoryData, useGetAllInventoryData } from './fbFetchAllInventoryData';

const StyledPageContainer = styled.div`
  padding: 20px;
  background: linear-gradient(to bottom right, #f0f2f5, #c3d8ff);
  min-height: 75vh;
  display: grid;
    gap: 1rem;
`;

const StyledCardsGroup = styled.div`
    display: grid;
    h3{
        color: #1a1a1a;
        font-size: 1rem;
        font-weight: 700;
    }
`;

const StyledCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
`;

const groupInventoryByWarehouse = (inventoryItems) => {
    return inventoryItems.reduce((acc, item) => {
        const warehouse = item.warehouse;
        if (!acc[warehouse]) {
            acc[warehouse] = [];
        }
        acc[warehouse].push(item);
        return acc;
    }, {});
};

const ProductExpirySelection = () => {
    const dispatch = useDispatch();
    const productId = useSelector(selectProductId);
    const isOpen = useSelector(selectModalOpen);
    // const inventory = useSelector(selectFilteredInventory);
    // const [items, setItems] = useState([]);
    const user = useSelector(selectUser)

    // useEffect(() => {
    //     if (user && productId) {
    //         fetchAllInventoryData(user, productId, setItems)
    //     }
    // }, [user, productId]);
    const { loading, data: items, error } = useGetAllInventoryData(productId);

    const handleClose = () => {
        dispatch(setModalOpen(false));
        dispatch(clearProductExpirySelector());
    };

    const groupedItems = groupInventoryByWarehouse(items);

    return (
        <Modal
            title="Seleccionar Ubicación de Inventario"
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
            <Spin
                spinning={loading}
                tip="Cargando..."
                size="large"
            >
                {loading &&
                    <div style={{ height: "400px" }}>

                    </div>
                }
            </Spin>
            {!loading && (<StyledPageContainer>
                {Object.entries(groupedItems).map(([warehouse, warehouseItems]) => (
                    <StyledCardsGroup key={warehouse}>
                        <h3>{warehouse}</h3>
                        <StyledCardGrid>
                            {warehouseItems.map((item) => (
                                <InventoryCard key={item.productStockId} item={item} />
                            ))}
                        </StyledCardGrid>
                    </StyledCardsGroup>
                ))}
            </StyledPageContainer>)}
        </Modal>
    );
};

export default ProductExpirySelection;