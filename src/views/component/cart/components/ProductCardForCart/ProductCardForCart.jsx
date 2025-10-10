import { MessageOutlined, PercentageOutlined, MoreOutlined } from '@ant-design/icons';
import { Tooltip, Badge, Button, Dropdown } from 'antd';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { changeProductPrice } from '../../../../../features/cart/cartSlice';
import { selectTaxReceiptEnabled } from '../../../../../features/taxReceipt/taxReceiptSlice';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import useInsuranceEnabled from '../../../../../hooks/useInsuranceEnabled';
import { getTotalPrice } from '../../../../../utils/pricing';
import { Counter } from '../../../../templates/system/Counter/Counter';
import PriceAndSaleUnitsModal from '../PriceAndSaleUnitsModal';

import { InsuranceCoverage } from './components/InsuranceCoverage/InsuranceCoverage';
import { PriceEditor } from './components/PriceEditor/PriceEditor';
import { WeightInput } from './components/WeightInput/WeightInput';
import { extraerPreciosConImpuesto } from './utils/priceUtils';


const variants = {
    initial: { opacity: 0, y: -90 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 150, transition: { duration: 0.5 } },
};

export const ProductCardForCart = ({ item, onOpenCommentModal, onOpenDeleteModal, onOpenDiscountModal }) => {
    const dispatch = useDispatch();
    const insuranceEnabled = useInsuranceEnabled();
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [precios, setPrecios] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);

    const updatePricing = (pricing) => {
        setPrecios(extraerPreciosConImpuesto(pricing, taxReceiptEnabled));
    };

    const handleSelectUnit = (unit) => {
        setSelectedUnit(unit);
        const pricing = unit.pricing;
        updatePricing(pricing);
    };

    const handleSelectDefaultUnit = (unit) => {
        const pricing = unit?.pricing;
        setSelectedUnit(null);
        updatePricing(pricing);
    };

    const handleSelectPrice = (price) => {
        updatePricing(price.pricing);
        let newPrice;

        switch (price.type) {
            case 'listPrice':
                newPrice = price.pricing.listPrice;
                break;
            case 'avgPrice':
                newPrice = price.pricing.avgPrice;
                break;
            case 'minPrice':
                newPrice = price.pricing.minPrice;
                break;
            default:
                newPrice = price.pricing.listPrice;
        }

        // Actualizar el precio en el carrito
        if (newPrice && newPrice !== 'N/A') {
            dispatch(changeProductPrice({
                id: item.id,
                price: parseFloat(newPrice)
            }));
        }        // Cerrar el modal después de seleccionar el precio
        setModalVisible(false);
    }; 
    const actionMenuItems = [
        {
            key: 'discount',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PercentageOutlined style={{ color: item.discount ? '#52c41a' : '#8c8c8c' }} />
                    {item.discount ? 'Editar descuento' : 'Aplicar descuento'}
                </span>
            ),
            onClick: () => onOpenDiscountModal(item)
        },
        {
            key: 'comment',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageOutlined style={{ color: item.comment ? '#1890ff' : '#8c8c8c' }} />
                    {item.comment ? 'Editar comentario' : 'Agregar comentario'}
                </span>
            ),
            onClick: () => onOpenCommentModal(item)
        }
    ];

    const hasActions = Boolean(item.comment || item.discount);    // Calcular el precio final usando las funciones de pricing
    const finalPrice = getTotalPrice(item, taxReceiptEnabled);
    const originalPrice = item.pricing?.price || item.price || 0;
    const taxPercentage = Number(item.pricing?.tax) || 0;
    const quantity = item.amountToBuy || 1;
    
    // Precio base con impuestos (sin descuento)
    const unitPriceWithTax = taxReceiptEnabled ? 
        originalPrice * (1 + taxPercentage / 100) : 
        originalPrice;
    const basePriceWithTax = unitPriceWithTax * quantity;
    
    const hasDiscount = item.discount && item.discount.value > 0;

    return (
        <Container variants={variants} initial="initial" animate="animate" transition={{ duration: 0.6 }}>
            <Row>
                <HeaderContainer>                    <TitleContainer>
                        <Title>{item.name}</Title>                        
                        {item.comment && (
                            <CommentPreview title={item.comment}>
                                {item.comment}
                            </CommentPreview>
                        )}
                    </TitleContainer>
                    <PriceContainer>                        {hasDiscount && (
                            <OriginalPrice>
                                {useFormatPrice(basePriceWithTax)}
                            </OriginalPrice>
                        )}
                        <Price hasDiscount={hasDiscount}>
                            {useFormatPrice(finalPrice)}
                        </Price>
                    </PriceContainer><ButtonGroup>
                        <Tooltip title="Opciones del producto">
                            <Badge dot={hasActions} color={item.comment ? '#1890ff' : item.discount ? '#52c41a' : '#8c8c8c'} offset={[-2, 2]}>
                                <Dropdown
                                    menu={{ items: actionMenuItems }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                >
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<MoreOutlined style={{ fontSize: '16px', color: hasActions ? (item.comment ? '#1890ff' : '#52c41a') : '#8c8c8c' }} />}
                                    />
                                </Dropdown>
                            </Badge>
                        </Tooltip>
                        <Button
                            type="text"
                            size="small"
                            icon={icons.operationModes.discard}
                            onClick={() => onOpenDeleteModal(item)}
                            danger
                        />
                    </ButtonGroup>
                </HeaderContainer>
            </Row>
            <Row>
                <Group>
                    <PriceEditor
                        item={item}
                        onModalOpen={() => setModalVisible(true)}
                    />
                    {
                        item?.weightDetail?.isSoldByWeight ? (
                            <WeightInput item={item} />
                        ) : (
                            <Counter
                                item={item}
                                amountToBuy={item.amountToBuy}
                                stock={item?.stock}
                                id={item.id}
                                product={item}
                            />
                        )
                    }
                </Group>
            </Row>

            {insuranceEnabled && <InsuranceCoverage item={item} />}

            <PriceAndSaleUnitsModal
                isVisible={isModalVisible}
                onClose={() => setModalVisible(false)}
                prices={precios}
                selectedUnit={selectedUnit}
                onSelectDefaultUnit={handleSelectDefaultUnit}
                item={item}
                onSelectPrice={handleSelectPrice}
                onSelectUnit={handleSelectUnit}
            />
        </Container>
    );
};

const Container = styled(motion.div)`
    width: 100%;
    height: min-content;
    background-color: #ffffff;
    padding: 0.4em;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    display: grid;
    gap: 0.2em;
    position: relative;
`;

const Row = styled.div`
    display: grid;
    align-items: center;
`;

const Group = styled.div`
    display: grid;
    align-items: center;
    gap: 0.4em;
    grid-template-columns: 1fr 120px;
`;
const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0; // Importante para que el texto se corte correctamente
  flex: 1;
`;

const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: fit-content;
`;

const OriginalPrice = styled.span`
  font-size: 11px;
  color: #8c8c8c;
  text-decoration: line-through;
  line-height: 1;
  font-weight: 400;
`;

const CommentPreview = styled.div`
  color: #8c8c8c;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 2px;
  max-width: calc(100% - 8px); // Dejamos un pequeño margen
  line-height: 1;
`;

const HeaderContainer = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: start;
    width: 100%;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
`;

const Title = styled.span`
    font-weight: 500;
    line-height: 16px;
    font-size: 14px;
    color: rgb(71, 71, 71);
    text-transform: capitalize;
`;

const Price = styled.span`
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    padding: 0 10px;
    background-color: var(--White1);
    color: ${props => props.hasDiscount ? '#52c41a' : 'var(--Gray6)'};
`;