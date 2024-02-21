import React, { useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { ButtonGroup, MenuApp, Select } from '../../..'
import { Button } from '../../..'
import { getOrderData, selectPurchase, cleanPurchase, AddProductToPurchase, SelectProductSelected, SelectProduct, deleteProductFromPurchase, setProductSelected, updateProduct, setPurchase, selectPurchaseState } from '../../../../features/purchase/addPurchaseSlice'
import { StockedProductPicker } from '../../../component/StockedProductPicker/StockedProductPicker'
import { ProductListSelected } from '../../../component/ProductListSelected/ProductListSelected'
import { selectUser } from '../../../../features/auth/userSlice'
import { fbGetPendingOrders } from '../../../../firebase/order/fbGetPedingOrder'
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider'
import { useNavigate } from 'react-router-dom'
import ROUTES_PATH from '../../../../routes/routesName'
import { addNotification } from '../../../../features/notification/NotificationSlice'
import { PurchaseDetails } from './PurchaseDetails/PurchaseDetails'
import { fbTransformOrderToPurchase } from '../../../../firebase/purchase/fbPreparePurchaseDocument'
import Loader from '../../../templates/system/loader/Loader'
import { fbAddPurchase } from '../../../../firebase/purchase/fbAddPurchase'
import { fbUpdatePurchase } from '../../../../firebase/purchase/fbUpdatePurchase'
import * as antd from 'antd'
import { icons } from '../../../../constants/icons/icons'
import { toggleProviderModal } from '../../../../features/modals/modalSlice'
import { OPERATION_MODES } from '../../../../constants/modes'
import { fromMillisToDateISO } from '../../../../utils/date/convertTimeStampToDate'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import FileList from './components/FileList'
const ProviderOption = ({ provider, orderCount }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{provider.name}</span>
        <span style={{ marginLeft: '10px' }}>{`${orderCount}`}</span>
    </div>
);

const { Form } = antd
export const AddPurchase = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [selectedProvider, setSelectedProvider] = useState(null);
    const [filteredOrders, setFilteredOrders] = useState([]);

    const [loading, setLoading] = useState({
        isOpen: false,
        message: ''
    });

    const { mode } = useSelector(selectPurchaseState)
    const user = useSelector(selectUser);

    const selectedProduct = useSelector(SelectProductSelected);
    const purchase = useSelector(selectPurchase);
    const provider = useSelector(selectPurchase).provider;

    const { providers } = useFbGetProviders(user);
    useEffect(() => {
        if (providers.length > 0 && !provider) {
            setSelectedProvider(providers[0].provider);
            dispatch(setPurchase({ provider: providers[0].provider }));
            setFilteredOrders(providers[0].provider.id);
        }
    }, [providers]);

    const { pendingOrders } = fbGetPendingOrders(user);
    const pendingOrdersOption = useMemo(() => {
        if (selectedProvider) {
            return pendingOrders
                .filter(({ data }) => data.provider.id === selectedProvider.id)
                .map(({ data }) => {
                    return { label: `#${data.numberId}  | ${fromMillisToDateISO(data.dates.createdAt)}  | ${useFormatPrice(data.total)}`, value: JSON.stringify(data) };
                });
        } else {
            return [];
        }
    }, [pendingOrders, selectedProvider]);
    // Calcular el número de pedidos para cada proveedor
    const ordersCountByProvider = useMemo(() => {
        return pendingOrders.reduce((acc, { data }) => {
            acc[data.provider.id] = (acc[data.provider.id] || 0) + 1;
            return acc;
        }, {});
    }, [pendingOrders]);

    const providersOption = useMemo(() => {
        return providers.map(({ provider }) => {
            const orderCount = ordersCountByProvider[provider.id] || 0;
            return {
                label: <ProviderOption provider={provider} orderCount={orderCount} />,
                value: JSON.stringify(provider)
            };
        });
    }, [providers, ordersCountByProvider]);

    const { PURCHASES } = ROUTES_PATH.PURCHASE_TERM;

    const [fileList, setFileList] = useState([]);
    const handleClear = () => dispatch(cleanPurchase());

    const handleClose = () => {
        handleClear();
        navigate(PURCHASES);
    }

    const handleCancel = () => {
        navigate(-1);
        handleClear();
    }

    const handleSubmit = async () => {
        if (!purchase?.provider || purchase?.provider?.id == "") {
            dispatch(addNotification({ title: 'Error', message: 'Agregue el proveedor', type: 'error' }))
            return
        }
        if (purchase.replenishments.length <= 0) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue un producto', type: 'error' }))
            return
        }
        if (!purchase.dates.deliveryDate) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Fecha de entrega', type: 'error' }))
            return
        }
        if (!purchase.dates.paymentDate) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Fecha de pago', type: 'error' }))
            return
        }
        if (!purchase.condition) {
            dispatch(addNotification({ title: 'Error', message: 'Agregue la Condición', type: 'error' }))
            return
        }

        const filesToUpload = fileList.length > 0 ? fileList.map(file => file.originFileObj) : [];
        try {
            if (mode === "add") {
                if (purchase.id) {
                    await fbTransformOrderToPurchase(user, purchase, filesToUpload, setLoading);
                    dispatch(addNotification({ title: 'Exito', message: 'Compra realizada', type: 'success' }))

                } else {
                    await fbAddPurchase(user, purchase, filesToUpload, setLoading);
                }
            } else if (mode === "edit") {
                await fbUpdatePurchase(user, purchase, filesToUpload, setLoading);
            }
            handleClose();
        } catch (error) {
            dispatch(addNotification({ title: 'Error', message: 'Error al realizar la compra', type: 'error' }))
            console.error("Hubo un error al transformar la orden en una compra:", error);
        }
    }

    const selectProduct = (product) => dispatch(SelectProduct(product));
    const handleSetSelectedProduct = (obj) => dispatch(setProductSelected(obj));
    const addProduct = () => dispatch(AddProductToPurchase());
    const handleDeleteProduct = (product) => dispatch(deleteProductFromPurchase(product.id));
    const handleUpdateProduct = (product) => dispatch(updateProduct(product));
    //abrir el modal de proveedor
    const createMode = OPERATION_MODES.CREATE.id
    const openProviderModal = () => { dispatch(toggleProviderModal({ mode: createMode, data: null })) }

    const filterOrders = (providerId) => {
        const filtered = pendingOrders.filter(({ data }) => data.provider.id === providerId);
        setFilteredOrders(filtered);
    };

    const handleProviderChange = (value) => {
        const provider = JSON.parse(value);
        dispatch(cleanPurchase())
        dispatch(setPurchase({ provider }));
        setSelectedProvider(provider);
        filterOrders(provider.id);
    };
    useEffect(() => {
        if (selectedProvider) {
            filterOrders(selectedProvider.id);
        } if(provider) {
            setSelectedProvider(provider);
        }
    }, [selectedProvider, provider]);

    const handleOrderChange = (value) => {
        const order = JSON.parse(value);
        dispatch(getOrderData(order));
    };

    console.log("proveedores ", providers)
    console.log("Pedidos Pendiente ", pendingOrders)
    console.log("pedidos Filtrados ", pendingOrdersOption)
    console.log("id proveedor ", selectedProvider?.id)
    console.log("proveedor ", provider?.name)
    console.log("compra ", purchase)
    console.log("filterOrder", filteredOrders)

    return (
        <Form
            layout='vertical'
            onValuesChange={(e) => console.log(e)}
            defaultValue={purchase}
        >
            <Modal >
                <Loader show={loading.isOpen} useRedux={false} message={loading.message} theme='light' />
                <Header>
                    <MenuApp
                        sectionName={mode === "add" ? 'Realizar Compra' : 'Editar Compra'}
                    />
                </Header>
                <BodyContainer>
                    <Body>
                        <ToolBar>
                            <SelectWithButton>
                                <Form.Item
                                    label="Proveedores"
                                    required
                                >
                                    <antd.Select
                                        style={SelectStyle}
                                        placeholder={"Seleccionar Proveedor"}
                                        options={providersOption}
                                        value={provider?.name}
                                        onChange={handleProviderChange}
                                    />
                                </Form.Item>
                                <antd.Button
                                    icon={icons.operationModes.add}
                                    size='medium'
                                    onClick={openProviderModal}
                                />

                            </SelectWithButton>
                            <SelectWithButton>
                                <Form.Item
                                    label="Pedidos"
                                    required
                                >
                                    <antd.Select
                                        placeholder={"Seleccionar Pedido"}
                                        options={pendingOrdersOption}
                                        value={purchase?.numberId || null}
                                        style={SelectStyle}
                                        onChange={handleOrderChange}
                                    />
                                </Form.Item>
                            </SelectWithButton>
                        </ToolBar>
                        <StockedProductPicker
                            addProduct={addProduct}
                            selectProduct={selectProduct}
                            selectedProduct={selectedProduct}
                            setProductSelected={handleSetSelectedProduct}
                        />
                        <ProductListSelected
                            productsSelected={purchase.replenishments}
                            productsTotalPrice={purchase.total}
                            handleDeleteProduct={handleDeleteProduct}
                            handleUpdateProduct={handleUpdateProduct}
                        />
                        <PurchaseDetails
                            purchase={purchase}
                            fileList={fileList}
                            setFileList={setFileList}
                        />

                        <Footer>
                            <ButtonGroup>
                                <Button
                                    title='Cancelar'
                                    borderRadius={'normal'}
                                    bgcolor='gray'
                                    height={'large'}
                                    onClick={handleCancel}
                                />
                                <Button
                                    title='Guardar'
                                    borderRadius={'normal'}
                                    color='primary'
                                    height={'medium'}
                                    onClick={handleSubmit}
                                />
                            </ButtonGroup>
                        </Footer>
                    </Body>
                </BodyContainer>
            </Modal>
        </Form>
    )
}

const Modal = styled.div`
    max-width: 100%;
    width: 100%;
    height: 100vh;
    background-color: var(--color2);
    overflow: hidden;
    display: grid;
    gap: 0.6em;
    grid-template-rows: min-content 1fr;
`
const ToolBar = styled.div`
    width: 100%;
    display: flex;
    gap: 10px;
`

const Header = styled.div`
    
`
const BodyContainer = styled.div`
    overflow: hidden;
    display: grid;
    border-radius: var(--border-radius);
    background-color: white;
    max-width: var(--max-width);
    width: 100%;
    margin: 0 auto;
`
const Body = styled.div`
        height: 100%;
        width: 100%;
        padding: 1em;
        overflow-y: scroll;
        display: grid;
        grid-template-rows: min-content min-content min-content min-content min-content;
        align-items: start;
        gap: 1em;
        header {
            display: flex;
            gap: 1em;
        }
`
const Footer = styled.div`
    height: 3em;
    max-width: var(--max-width);
    background-color: #ffffff;
    width: 100%;
    padding: 0.4em 0.6em;
    justify-content: right;
    border: var(--border-primary);
    border-radius: var(--border-radius);
    //position: sticky;
    //z-index: 5;
    //bottom: 0;
    margin: 0 auto;
    display: flex;
`
export const SelectStyle = {
    minWidth: '200px'
}
const SelectWithButton = styled.div`
    display: grid;
    grid-template-columns: 1fr min-content;
    align-items: end;
    gap: 10px;
    .ant-form-item {
        margin-bottom: 0; // Elimina el margen inferior del Form.Item
    }
`;
