import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, InputNumber, Statistic, Button, message, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { SelectProduct, selectProductSelected, setSelectedBackOrders, clearSelectedBackOrders, selectOrder } from '../../../../../features/addOrder/addOrderSlice';
import { selectUser } from '../../../../../features/auth/userSlice';
import { getBackOrdersByProduct } from '../../../../../firebase/warehouse/backOrderService';
import { formatMoney } from '../../../../../utils/formatters';
import BackOrdersModal from '../../PurchaseManagement/components/BackOrdersModal';

import ProductModal from './ProductModal';


function AddProductForm({ onSave, onClear, mode }) {
    const dispatch = useDispatch();

    const user = useSelector(selectUser);

    const { id } = useSelector(selectOrder);
    const [form] = Form.useForm();
    const [unitCost, setUnitCost] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [calculatedITBIS, setCalculatedITBIS] = useState(0);
    const [isBackOrderModalVisible, setIsBackOrderModalVisible] = useState(false);
    const [tempSelectedProduct, setTempSelectedProduct] = useState(null);
    const [productBackOrders, setProductBackOrders] = useState([]);
    const [isLoadingBackOrders, setIsLoadingBackOrders] = useState(false);
    const [isBackOrderChecked, setIsBackOrderChecked] = useState(false);
    const [checkedProducts, setCheckedProducts] = useState(new Set());

    const selectedProduct = useSelector(selectProductSelected);

    const isProductSelected = !!selectedProduct?.name || !!selectedProduct?.id;

    const onSelectProduct = (product) => {
        dispatch(SelectProduct(product));
        setIsBackOrderChecked(false);
        // Reset checked state when selecting a new product
        if (!product?.id) {
            setCheckedProducts(new Set());
        }
    };

    const calculateCosts = () => {
        const values = form.getFieldsValue();
        const baseCost = Number(values.baseCost) || 0;
        const taxPercent = Number(values.taxPercentage) || 0;
        const freight = Number(values.freight) || 0;
        const otherCosts = Number(values.otherCosts) || 0;

        const calculatedTax = (baseCost * taxPercent) / 100;
        setCalculatedITBIS(calculatedTax);

        const newUnitCost = baseCost + calculatedTax + freight + otherCosts;
        setUnitCost(newUnitCost);

        const quantity = selectedProduct?.purchaseQuantity || 0;
        setSubtotal(newUnitCost * quantity);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSave({
                ...values,
                unitCost,
                subtotal,
                calculatedITBIS,
                selectedBackOrders: selectedProduct.selectedBackOrders,
                quantity: selectedProduct.quantity,
                purchaseQuantity: selectedProduct.purchaseQuantity,
            });
            form.resetFields();
            dispatch(clearSelectedBackOrders());
            setIsBackOrderChecked(false);
            // Clear checked products after saving
            setCheckedProducts(new Set());
            message.success('Producto agregado correctamente');
        } catch (error) {
            const errorFields = error.errorFields || [];
            if (errorFields.length > 0) {
                message.error('Por favor complete todos los campos requeridos');
            } else {
                message.error('Error al agregar el producto');
            }
        }
    };

    const handleDelete = () => {
        form.resetFields();
        onClear();
        onSelectProduct({});
        // Clear checked products when deleting
        setCheckedProducts(new Set());
    };

    const handleQuantityClick = async () => {
        if (!selectedProduct?.id || !user?.businessID) return;
        
        // If we've already checked this product and found no back orders, don't check again
        if (checkedProducts.has(selectedProduct.id)) {
            return;
        }

        setIsLoadingBackOrders(true);
        try {
            const data = await getBackOrdersByProduct(user.businessID, selectedProduct.id);
            if (data?.length > 0) {
                setProductBackOrders(data);
                setTempSelectedProduct(selectedProduct);
                setIsBackOrderModalVisible(true);
            } else {
                dispatch(clearSelectedBackOrders());
                setIsBackOrderChecked(true);
                // Add this product to the checked set since it has no back orders
                setCheckedProducts(new Set([...checkedProducts, selectedProduct.id]));
            }
        } finally {
            setIsLoadingBackOrders(false);
        }
    };

    const handleBackOrderModalConfirm = (backOrderData) => {
        dispatch(SelectProduct(tempSelectedProduct));
        dispatch(setSelectedBackOrders(backOrderData));
        setIsBackOrderModalVisible(false);
        setTempSelectedProduct(null);
        calculateCosts();
    };

    const handleBackOrderModalCancel = () => {
        setIsBackOrderModalVisible(false);
        setTempSelectedProduct(null);
        dispatch(clearSelectedBackOrders());
    };

    const handleQuantityChange = (value) => {
        form.validateFields().then(calculateCosts).catch(() => { });
    };

    useEffect(() => {
        if (selectedProduct) {
            form.setFieldsValue({
                name: selectedProduct.name,
                quantity: selectedProduct.quantity,
            });
            calculateCosts();
        }
    }, [selectedProduct]);

    return (
        <RowContainer>
            <Form
                form={form}
                layout="vertical"
            >
                <FieldsRow>
                    <Tooltip title='Nombre del Producto'>
                        <StyledFormItem
                            name="name"
                            label="Producto"
                            rules={[{ required: isProductSelected }]}
                        >
                            <ProductModal
                                onSelect={onSelectProduct}
                                selectedProduct={selectedProduct}
                            />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Cantidad'>
                        <StyledFormItem
                            name="quantity"
                            label="Cantidad"
                            rules={[{ required: isProductSelected }]}
                        >
                            <InputNumber
                                controls={false}
                                disabled={!isProductSelected || isLoadingBackOrders}
                                placeholder="Cantidad"
                                value={selectedProduct?.quantity}
                                onChange={handleQuantityChange}
                                onClick={handleQuantityClick}
                                style={{ cursor: isProductSelected && !isLoadingBackOrders ? 'pointer' : 'not-allowed', width: '100%' }}
                                addonAfter={isLoadingBackOrders && (
                                    <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#1890ff' }} />
                                )}
                            />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Costo Base'>
                        <StyledFormItem
                            name="baseCost"
                            label="Costo Base"
                            rules={[{ required: isProductSelected }]}
                        >
                            <InputNumber
                                controls={false}
                                disabled={!isProductSelected}
                                placeholder="Costo"
                                min={isProductSelected && 0.1}
                                style={{ width: '100%' }}
                                onChange={calculateCosts}
                            />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Costo Unitario'>
                        <TotalItem
                            title="Costo Unitario"
                            value={unitCost}
                            formatter={(value) => formatMoney(value)}
                        />
                    </Tooltip>
                    <Tooltip title='Subtotal'>
                        <TotalItem
                            title="Subtotal"
                            value={subtotal}
                            formatter={(value) => formatMoney(value)}
                        />
                    </Tooltip>
                    <ActionContainer>
                        <Tooltip title='Borrar'>
                            <Button
                                icon={icons.operationModes.close}
                                onClick={handleDelete}
                                disabled={!isProductSelected}
                            />
                        </Tooltip>
                        <Tooltip title='Agregar Producto'>
                            <Button
                                type="primary"
                                icon={icons.operationModes.add}
                                onClick={handleSubmit}
                                disabled={!isProductSelected}
                            />
                        </Tooltip>
                    </ActionContainer>
                </FieldsRow>
            </Form>
            <BackOrdersModal
                isVisible={isBackOrderModalVisible}
                onCancel={handleBackOrderModalCancel}
                onConfirm={handleBackOrderModalConfirm}
                initialSelectedBackOrders={selectedProduct.selectedBackOrders}
                initialPurchaseQuantity={selectedProduct.purchaseQuantity}
                productId={selectedProduct.id}
                backOrders={productBackOrders}
                mode={mode}
                orderId={id}
            />
        </RowContainer>
    );
};

export default AddProductForm;

const RowContainer = styled.div`
    padding-bottom: 0.2em;
    margin-bottom: 1em;
    overflow-x: auto;
`;

const FieldsRow = styled.div`
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr min-content ;
    gap: 8px;
   
`;


const StatsContainer = styled.div`
    display: flex;
    gap: 8px;
`;

const TotalItem = styled(Statistic)`
    align-self: end;
    justify-content: space-between;
    .ant-statistic-title {
        font-size: 14px;
        color: #333;
          text-align: right; 
    }
    .ant-statistic-content {
        font-size: 16px;
        font-weight: bold;
        text-align: right;  // Alineación a la derecha
    }
`;

const ActionContainer = styled(StatsContainer)`
    display: flex;
    align-items: end;
    padding: 0 0 0.3em 0;
    justify-content: flex-end;
     margin-left: 0.8em;
    gap: 0.4em;
    
   
`;

const StyledFormItem = styled(Form.Item)`
    .ant-form-item-explain {
        display: none;
    }
    
    .ant-form-item-label {
        display: flex;
        align-items: flex-start;
        padding-bottom: 4px;
    }

    .ant-form-item-control {
        min-height: unset; // Elimina la altura mínima predeterminada
    }

    &.ant-form-item {
        margin-bottom: 0;
       
        display: flex;
        flex-direction: column;
    }

`
