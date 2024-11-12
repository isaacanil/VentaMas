import React, { useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Counter } from '../../../templates/system/Counter/Counter';
import {
    deleteProduct,
    changeProductPrice,
    changeProductWeight
} from '../../../../features/cart/cartSlice';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { icons } from '../../../../constants/icons/icons';
import { motion } from 'framer-motion';
import * as antd from 'antd';
import { userAccess } from '../../../../hooks/abilities/useAbilities';
import {
    getAvgPriceTotal,
    getListPriceTotal,
    getMinPriceTotal,
    getPriceTotal,
    getPriceWithoutTax,
    getTotalPrice
} from '../../../../utils/pricing';
import { selectTaxReceiptEnabled } from '../../../../features/taxReceipt/taxReceiptSlice';
import PriceAndSaleUnitsModal from './PriceAndSaleUnitsModal';

const defaultColor = { bg: 'var(--White3)', border: 'var(--Gray4)' };
const errorColor = { bg: '#ffefcc', border: '#f5ba3c' };
const exactMatchColor = { bg: '#ccffcc', border: '#88cc88' };
const inRangeColor = { bg: '#ffffcc', border: '#cccc88' };

const { Button, message } = antd;

const determineInputPriceColor = (totalPrice, minPrice, listPrice, avgPrice) => {
    if (totalPrice < minPrice || totalPrice > listPrice) {
        return errorColor;
    } else if (totalPrice === minPrice || totalPrice === avgPrice) {
        return exactMatchColor;
    } else if (totalPrice > minPrice && totalPrice < listPrice) {
        return inRangeColor;
    }
    return defaultColor;
};

export function extraerPreciosConImpuesto(pricing, taxReceiptEnabled = true) {

    const { listPrice, avgPrice, minPrice } = pricing || {};
    console.log('pricing ...........................', pricing.listPrice);
    const preciosConImpuesto = [
        {
            label: 'Precio de Lista',
            value: listPrice || 'N/A',
            valueWithTax: getListPriceTotal({ pricing }, taxReceiptEnabled),
            pricing,
            type: 'listPrice',
            enabled: pricing?.listPriceEnabled ?? true
        },
        {
            label: 'Precio Promedio',
            value: avgPrice || 'N/A',
            valueWithTax: getAvgPriceTotal({ pricing }, taxReceiptEnabled),
            type: 'avgPrice',
            pricing,
            enabled: pricing?.avgPriceEnabled ?? true
        },
        {
            label: 'Precio Mínimo',
            value: minPrice || 'N/A',
            valueWithTax: getMinPriceTotal({ pricing }, taxReceiptEnabled),
            type: 'minPrice',
            pricing,
            enabled: pricing?.minPriceEnabled ?? true
        }
    ];
    console.log('preciosConImpuesto ______________________________', preciosConImpuesto);
    return preciosConImpuesto;
}

const variants = {
    initial: { opacity: 0, y: -90 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 150, transition: { duration: 0.5 } },
};

export const ProductCardForCart = ({ item }) => {
    const dispatch = useDispatch();
    const { abilities } = userAccess();
    const [isModalVisible, setModalVisible] = useState(false);

    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
    const [selectedUnit, setSelectedUnit] = useState(null); // Por defecto, el item base
    const [inputPrice, setInputPrice] = useState(getTotalPrice(item, taxReceiptEnabled));
    const [precios, setPrecios] = useState([]);
    const itemPrice = () => {
        setInputPrice(getPriceTotal(item, taxReceiptEnabled))
    }
    useEffect(() => {
        itemPrice()
    }, [item])

    const updatePricing = (pricing) => {
        setPrecios(extraerPreciosConImpuesto(pricing, taxReceiptEnabled));
    };

    const handleSelectUnit = (unit) => {
        setSelectedUnit(unit);
        const pricing = unit.pricing;

        console.log('total ', getPriceTotal({ pricing }, taxReceiptEnabled))
        const selectedPriceValue = getPriceTotal({ pricing }, taxReceiptEnabled);
        setInputPrice(selectedPriceValue);

        updatePricing(pricing);// Actualiza los precios disponibles y el estado
        dispatch(changeProductPrice({ id: item.id, saleUnit: unit, }));
    };

    const handleSelectDefaultUnit = (unit) => {
        const pricing = unit?.pricing;
        setSelectedUnit(null);
        const selectedPriceValue = getPriceTotal({ pricing }, taxReceiptEnabled)
        setInputPrice(selectedPriceValue);
        updatePricing(pricing);
        dispatch(changeProductPrice({ id: item.id, pricing: pricing }))
    }

    const handleSelectPrice = (pricing) => {
        if (!abilities.can('read', 'PriceList')) {
            message.error('No tienes permisos para seleccionar un precio de la lista');
            return;
        }
        // Puedes seleccionar qué precio utilizar, aquí asumiremos listPrice
        const selectedPriceValue = getPriceTotal({ pricing: pricing.pricing }, taxReceiptEnabled);
        setInputPrice(selectedPriceValue);

        dispatch(changeProductPrice({ id: item.id, price: pricing.value }));

        // Actualiza los precios disponibles y el estado
        updatePricing(pricing.pricing);
    };


    return (
        <Container variants={variants} initial="initial" animate="animate" transition={{ duration: 0.6 }}>
            <Row>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr min-content min-content' }}>
                    <Title>{item.name}</Title>
                    <Price>{useFormatPrice(getTotalPrice(item, taxReceiptEnabled))}</Price>
                    <Button
                        type="text"
                        size="small"
                        icon={icons.operationModes.discard}
                        onClick={() => dispatch(deleteProduct(item.cid))}
                        danger
                    />
                </div>
            </Row>
            <Row>
                <Group>
                    <Button
                        icon={icons.arrows.caretDown}
                        size="small"
                        onClick={() => setModalVisible(true)}
                    />
                    <Input
                        disabled={!abilities.can('modify', 'Price') || item?.weightDetail?.isSoldByWeight}
                        readOnly={!abilities.can('modify', 'Price')}
                        type="text"
                        value={useFormatPrice(inputPrice)}
                    />
                    {
                        item?.weightDetail?.isSoldByWeight ? (
                            <div style={{ display: "flex", gap: "1em" }}>
                                <Input
                                    value={`${(item?.weightDetail?.weight)}`}
                                    onChange={(e) => dispatch(changeProductWeight({ id: item.cid, weight: e.target.value }))}
                                />
                                {item?.weightDetail?.weightUnit}
                            </div>

                        ) : (
                            <Counter
                                amountToBuyTotal={item.amountToBuy}
                                stock={item?.stock}
                                id={item.id}
                                product={item}
                            />
                        )
                    }

                </Group>
            </Row>
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
    gap: 0.4em;
`;

const Row = styled.div`
    display: grid;
    align-items: center;
`;

const Group = styled.div`
    display: grid;
    align-items: center;
    gap: 0.4em;
    grid-template-columns: min-content 1fr 1fr;
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
    color: var(--Gray6);
`;

const Input = styled.input`
    width: 100%;
    height: 1.8em;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    padding: 0 10px;
    background-color: ${props => props?.color?.bg};
    border: 2px solid ${props => props?.color?.border};
    color: var(--Gray6);
    outline: none;
`;
