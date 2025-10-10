import { PercentageOutlined, DollarOutlined } from '@ant-design/icons';
import { Modal, Radio, InputNumber, Button, Typography } from 'antd';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { updateProductDiscount } from '../../../features/cart/cartSlice';
import { selectTaxReceiptEnabled } from '../../../features/taxReceipt/taxReceiptSlice';
import { useFormatPrice } from '../../../hooks/useFormatPrice';
import { getTotalPrice } from '../../../utils/pricing';

const { Text, Title } = Typography;

export const ProductDiscountModal = ({ visible, onClose, product }) => {
    const dispatch = useDispatch();
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
    const [discountType, setDiscountType] = useState('percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [presetDiscount, setPresetDiscount] = useState(null);

    const presetDiscounts = [
        { label: '5%', value: 5, type: 'percentage' },
        { label: '10%', value: 10, type: 'percentage' },
        { label: '15%', value: 15, type: 'percentage' },
        { label: '20%', value: 20, type: 'percentage' },
        { label: '25%', value: 25, type: 'percentage' },
        { label: '50%', value: 50, type: 'percentage' },
    ];

    // Reiniciar valores cuando se abre el modal
    useEffect(() => {
        if (visible && product) {
            if (product.discount) {
                setDiscountType(product.discount.type);
                setDiscountValue(product.discount.value);
                setPresetDiscount(null);
            } else {
                setDiscountType('percentage');
                setDiscountValue(0);
                setPresetDiscount(null);
            }
        }
    }, [visible, product]);    const calculateDiscountedPrice = () => {
        if (!product) return 0;
        
        const value = presetDiscount?.value || discountValue;
        const type = presetDiscount?.type || discountType;
        
        // Crear una copia temporal del producto sin descuento para obtener el precio base
        const productWithoutDiscount = { ...product, discount: null };
        const unitPriceWithTax = getTotalPrice(productWithoutDiscount, taxReceiptEnabled, false); // false para obtener precio unitario
        const quantity = product.amountToBuy || 1;
        const totalPriceWithTax = unitPriceWithTax * quantity;
        
        if (value <= 0) return totalPriceWithTax;
        
        if (type === 'percentage') {
            return totalPriceWithTax * (1 - value / 100);
        } else {
            // Para monto fijo, restamos el descuento del total
            return Math.max(0, totalPriceWithTax - value);
        }
    };

    const calculateDiscountAmount = () => {
        if (!product) return 0;
        
        // Obtener el precio total sin descuento
        const productWithoutDiscount = { ...product, discount: null };
        const unitPriceWithTax = getTotalPrice(productWithoutDiscount, taxReceiptEnabled, false);
        const quantity = product.amountToBuy || 1;
        const totalPriceWithTax = unitPriceWithTax * quantity;
        const discountedPrice = calculateDiscountedPrice();
        
        return totalPriceWithTax - discountedPrice;
    };    // Calcular precios para mostrar en la UI
    const displayPrices = React.useMemo(() => {
        if (!product) return { unitPrice: 0, totalPrice: 0 };
        
        const productWithoutDiscount = { ...product, discount: null };
        const unitPriceWithTax = getTotalPrice(productWithoutDiscount, taxReceiptEnabled, false);
        const quantity = product.amountToBuy || 1;
        const totalPriceWithTax = unitPriceWithTax * quantity;
        
        return {
            unitPrice: unitPriceWithTax,
            totalPrice: totalPriceWithTax
        };
    }, [product, taxReceiptEnabled]);

    const formattedUnitPrice = useFormatPrice(displayPrices.unitPrice);
    const formattedTotalPrice = useFormatPrice(displayPrices.totalPrice);
    const formattedDiscountAmount = useFormatPrice(calculateDiscountAmount());
    const formattedDiscountedPrice = useFormatPrice(calculateDiscountedPrice());const handleApply = () => {
        const discount = presetDiscount || { type: discountType, value: discountValue };
        const finalDiscountValue = presetDiscount?.value || discountValue;
        
        console.log('Aplicando descuento:', {
            product: product?.name,
            discount,
            finalDiscountValue,
            productId: product?.id || product?.cid
        });
        
        dispatch(updateProductDiscount({
            id: product.id || product.cid,
            discount: finalDiscountValue > 0 ? discount : null
        }));
        
        onClose();
    };

    const handleRemove = () => {
        dispatch(updateProductDiscount({
            id: product.id || product.cid,
            discount: null
        }));
        onClose();
    };

    const handlePresetSelect = (preset) => {
        setPresetDiscount(preset);
        setDiscountValue(0);
    };    const handleCustomValueChange = (value) => {
        setDiscountValue(value || 0);
        setPresetDiscount(null);
    };

    const handleDiscountTypeChange = (e) => {
        const newType = e.target.value;
        setDiscountType(newType);
        // Limpiar preset si se cambia a monto fijo (ya que los presets son porcentajes)
        if (newType === 'fixed') {
            setPresetDiscount(null);
        }
        // Limpiar valor personalizado
        setDiscountValue(0);
    };const maxFixedDiscount = displayPrices.totalPrice;
    const currentDiscountValue = presetDiscount?.value || discountValue;
    const hasDiscount = currentDiscountValue > 0;
    const actualDiscountValue = presetDiscount?.value || discountValue;

    return (
        <Modal
            title="Aplicar Descuento al Producto"
            open={visible}
            onCancel={onClose}
            style={{top: 10}}            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancelar
                </Button>,
                product?.discount && (
                    <Button key="remove" onClick={handleRemove} danger>
                        Quitar Descuento
                    </Button>
                ),
                <Button 
                    key="apply" 
                    type="primary" 
                    onClick={handleApply}
                    disabled={!hasDiscount}
                >
                    Aplicar Descuento
                </Button>
            ]}
            width={500}
        >            <ModalContent>
                <ProductInfo>
                    <ProductHeader>
                        <ProductName>{product?.name || product?.productName}</ProductName>
                        <QuantityBadge>Cant: {product?.amountToBuy || 1}</QuantityBadge>
                    </ProductHeader>
                      <PriceDetails>
                        <PriceRow>
                            <PriceLabel>Precio unitario:</PriceLabel>
                            <PriceValue>{formattedUnitPrice}</PriceValue>
                        </PriceRow>
                        <PriceRow>
                            <PriceLabel>Total actual:</PriceLabel>
                            <PriceValue $isTotal>{formattedTotalPrice}</PriceValue>
                        </PriceRow>
                    </PriceDetails>
                </ProductInfo><DiscountSection>
                    {discountType === 'percentage' && (
                        <div>
                            <Text strong style={{ marginBottom: '8px', display: 'block' }}>Descuentos rápidos:</Text>
                            <PresetGrid>
                                {presetDiscounts.map((preset, index) => (
                                    <PresetPill
                                        key={index}
                                        $isSelected={presetDiscount?.value === preset.value && presetDiscount?.type === preset.type}
                                        onClick={() => handlePresetSelect(preset)}
                                    >
                                        {preset.label}
                                    </PresetPill>
                                ))}
                            </PresetGrid>
                        </div>
                    )}

                    <CustomDiscountSection>                        <Radio.Group
                            value={discountType}
                            onChange={handleDiscountTypeChange}
                        >
                            <CustomRadio value="percentage">
                                <RadioContent>
                                    <PercentageOutlined />
                                    Porcentaje
                                </RadioContent>
                            </CustomRadio>
                            <CustomRadio value="fixed">
                                <RadioContent>
                                    <DollarOutlined />
                                    Monto fijo
                                </RadioContent>
                            </CustomRadio>
                        </Radio.Group>                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder={discountType === 'percentage' ? 'Ej: 15' : `Máx: ${maxFixedDiscount}`}
                            value={discountValue}
                            onChange={handleCustomValueChange}
                            min={0}
                            max={discountType === 'percentage' ? 100 : maxFixedDiscount}
                            suffix={discountType === 'percentage' ? '%' : '$'}
                            size="large"
                        />

                        {hasDiscount && (
                            <DiscountResultsSection>
                                <PriceRow $isDiscount>
                                    <PriceLabel>Descuento:</PriceLabel>
                                    <PriceValue $isDiscount>-{formattedDiscountAmount}</PriceValue>
                                </PriceRow>
                                <PriceRow $isFinal>
                                    <PriceLabel>Precio final:</PriceLabel>
                                    <PriceValue $isFinal>{formattedDiscountedPrice}</PriceValue>
                                </PriceRow>
                            </DiscountResultsSection>
                        )}
                    </CustomDiscountSection>
                </DiscountSection>
            </ModalContent>
        </Modal>
    );
};

const ModalContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const ProductInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  
    border-radius: 8px;
    border: 1px solid #e0e6ed;
`;

const ProductHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
`;

const ProductName = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    flex: 1;
    line-height: 1.3;
`;

const QuantityBadge = styled.div`
    background-color: #1890ff;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
`;

const PriceDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const PriceRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${props => props.$isFinal ? '8px 0 4px 0' : '4px 0'};
    background-color: ${props => 
        props.$isFinal ? 'rgba(82, 196, 26, 0.1)' : 
        props.$isDiscount ? 'rgba(255, 77, 79, 0.05)' : 
        'transparent'
    };
    border-radius: ${props => (props.$isFinal || props.$isDiscount) ? '6px' : '0'};
    margin: ${props => (props.$isFinal || props.$isDiscount) ? '0 -8px' : '0'};
    padding-left: ${props => (props.$isFinal || props.$isDiscount) ? '8px' : '0'};
    padding-right: ${props => (props.$isFinal || props.$isDiscount) ? '8px' : '0'};
`;

const PriceLabel = styled.span`
    font-size: 14px;
    color: ${props => 
        props.$isFinal ? '#52c41a' : 
        props.$isDiscount ? '#ff4d4f' : 
        '#6c757d'
    };
    font-weight: ${props => props.$isFinal ? '600' : '500'};
`;

const PriceValue = styled.span`
    font-size: ${props => 
        props.$isFinal ? '18px' : 
        props.$isTotal ? '16px' : 
        '14px'
    };
    font-weight: 700;
    color: ${props => 
        props.$isFinal ? '#52c41a' : 
        props.$isDiscount ? '#ff4d4f' : 
        props.$isTotal ? '#2c3e50' : 
        '#495057'
    };
`;

const DiscountDivider = styled.div`
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #e0e6ed 50%, transparent 100%);
    margin: 4px 0;
`;

const ProductDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const DiscountSection = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 20px;
`;

const CustomDiscountSection = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 12px;
`;

const CustomRadio = styled(Radio)`
    .ant-radio-wrapper {
        display: flex;
        align-items: center;
    }
`;

const RadioContent = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const PresetGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
`;

const PresetPill = styled.div`
    height: 32px;
    padding: 0 12px;
    font-size: 12px;
    min-width: auto;
    border-radius: 16px;
    border: 1px solid ${props => props.$isSelected ? '#1890ff' : '#d9d9d9'};
    background-color: ${props => props.$isSelected ? '#1890ff' : 'white'};
    color: ${props => props.$isSelected ? 'white' : '#595959'};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    transition: all 0.2s ease;
    
    &:hover {
        border-color: #1890ff;
        color: ${props => props.$isSelected ? 'white' : '#1890ff'};
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
    }
    
    &:active {
        transform: translateY(0);
    }
`;

const PresetButton = styled(Button)`
    height: 32px;
    padding: 0 8px;
    font-size: 12px;
    min-width: auto;
`;

const DiscountResultsSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(24, 144, 255, 0.2);
`;
