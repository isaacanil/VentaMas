import React, { useEffect, useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { Counter } from '../../../templates/system/Counter/Counter'
import { totalShoppingItems, deleteProduct, totalPurchase, setChange, totalPurchaseWithoutTaxes, addPaymentMethodAutoValue, changeProductPrice } from '../../../../features/cart/cartSlice'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { icons } from '../../../../constants/icons/icons'
//import { Button } from '../../../templates/system/Button/Button'
import { motion } from 'framer-motion'
import * as antd from 'antd'
import { SmileOutlined } from '@ant-design/icons';
import { Dropdown } from './Dropdown'
import { selectUser } from '../../../../features/auth/userSlice'
import { userAccess } from '../../../../hooks/abilities/useAbilities'
import { getAvgPriceTotal, getListPriceTotal, getMinPriceTotal, getPriceWithoutTax, getTax, getTotalPrice } from '../../../../utils/pricing'
import { TbAxe } from 'react-icons/tb'

const defaultColor = { bg: 'var(--White3)', border: 'var(--Gray4)' }; // Asume que var(--Gray4) es el color de borde por defecto
const errorColor = { bg: '#ffefcc', border: '#f5ba3c' }; // Rojo claro para indicar error, con un borde más oscuro
const exactMatchColor = { bg: '#ccffcc', border: '#88cc88' }; // Verde claro para coincidencia exacta, con un borde más oscuro
const inRangeColor = { bg: '#ffffcc', border: '#cccc88' }; // Amarillo claro para indicar que está en rango, con un borde más oscuro

const { Button } = antd
const variants = {
    initial: { opacity: 0, y: -90 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 150, transition: { duration: 0.5 } },  // nueva propiedad
};
const determineInputPriceColor = (totalPrice, minPrice, listPrice, averagePrice) => {
    if (totalPrice < minPrice || totalPrice > listPrice) {
        return errorColor;
    } else if (totalPrice === minPrice || totalPrice === averagePrice) {
        return exactMatchColor;
    } else if (totalPrice > minPrice && totalPrice < listPrice) {
        return inRangeColor;
    }
    return defaultColor;
};
function extraerPreciosConImpuesto(producto) {
    const propiedadesPrecio = {
        'listPrice': 'Precio de lista',
        'avgPrice': 'Precio promedio',
        'minPrice': 'Precio mínimo',
    };
    const listPriceTotal = getListPriceTotal(producto);
    const avgPriceTotal = getAvgPriceTotal(producto);
    const minPriceTotal = getMinPriceTotal(producto);
    const preciosConImpuesto = [
        {label: listPriceTotal, value: listPriceTotal},
        {label: avgPriceTotal, value: avgPriceTotal},
        {label: minPriceTotal, value: minPriceTotal},
    ]

    return preciosConImpuesto;
}

export const ProductCardForCart = ({ item }) => {
    const dispatch = useDispatch()
    const [priceInputFocus, setInputPriceFocus] = useState(false);
    const { abilities } = userAccess();
    const user = useSelector(selectUser)

    const tax = item.pricing.tax
    const minPrice = getMinPriceTotal(item);
    const listPrice = getListPriceTotal(item);
    const averagePrice = getAvgPriceTotal(item);
    const price = getTotalPrice(item)

    const [inputPriceColor, setInputPriceColor] = useState(defaultColor);
    const [inputPrice, setInputPrice] = useState(price);

    const deleteProductFromCart = (id) => dispatch(deleteProduct(id));

    const canModifyPrice = abilities.can('change', 'Price');

    const handleChangePrice = (e) => {
        if (!canModifyPrice) {
            antd.message.error('No tienes permisos para cambiar el precio de los productos');
            return
        };
        const newPrice = e.target.value;
        const priceWithoutTax = getPriceWithoutTax(newPrice, tax);

      
        if (newPrice < minPrice) {
            antd.message.error('El precio ingresado es menor al precio mínimo permitido.', 4);
        }
        if (newPrice > listPrice) {
            antd.message.error('El precio ingresado es mayor al precio de lista.', 4);
        }
        const color = determineInputPriceColor(newPrice, minPrice, listPrice, averagePrice)

        setInputPriceColor(color);

        dispatch(changeProductPrice({ id: item.id, newPrice: priceWithoutTax }));
        setInputPriceFocus(false)
    }


    const precios = extraerPreciosConImpuesto(item);

    const handleMenuClick = (e) => {
        console.log(e)
        const item = {
            target: {
                value: e.value
            }
        }
        setInputPrice(e.value)
        handleChangePrice(item); // actualiza el precio en el estado global del carrito
    };


    const items = precios.map((precio, index) => ({
        key: `${index}`,
        label: (
            <div
                onClick={() => handleMenuClick(precio)}
                style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{precio.label}</span>
            </div>
        )
    }));


    return (
        <Container
            variants={variants}
            initial='initial'
            animate='animate'
            transition={{ duration: 0.6 }}
        >
            <Row>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr min-content min-content',
                    }}
                >
                    <Title>{item.name}</Title>
                    <Price>{useFormatPrice(price)}</Price>
                    <Button
                        type='text'
                        size='small'
                        style={{
                            fontSize: 20,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        icon={icons.operationModes.discard}
                        onClick={() => deleteProductFromCart(item.cid)}
                        danger
                    />
                </div>
            </Row>
            <Row>
                <Group >
                    <Dropdown
                        menu={{ items }}
                        trigger={['click']}
                    >
                        {
                            canModifyPrice && !item?.weightDetail?.isSoldByWeight ? (
                                <Button
                                    icon={icons.arrows.caretDown}
                                    size='small'
                                />) : (
                                <div></div>
                            )
                        }

                    </Dropdown>
                    <Input
                        disabled={!canModifyPrice || item?.weightDetail?.isSoldByWeight}
                        readOnly={!canModifyPrice}
                        type={priceInputFocus ? "number" : "text"}
                        onFocus={() => setInputPriceFocus(true)}
                        onBlur={handleChangePrice}
                        color={inputPriceColor}
                        onChange={(e) => setInputPrice(e.target.value)}
                        value={priceInputFocus ? inputPrice : useFormatPrice(inputPrice)}
                    />
                    {
                        item?.weightDetail?.isSoldByWeight ? (
                            <Input 
                                readOnly={true}
                                value={`${(item?.weightDetail?.weight)} ${item?.weightDetail?.weightUnit}`}

                            />

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
        </Container>
    )
}
const Container = styled(motion.div)`
    width: 100%;
    height: min-content;
    position: relative;
    background-color: #ffffff;
    padding: 0.2em 0.4em;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 8px;

    display: grid;
    border: none;
    border: 1px solid rgba(0, 0, 0, 0.121);
    gap: 0.3em;

`
const Row = styled.div`
 
    display: grid;
    align-items: center;
`
const Group = styled.div`
    display: grid;
    align-items: center;
    gap: 1em;
    grid-template-columns: min-content 1fr 1fr ;
    .ant-dropdown{
        z-index: 1000000000 !important;
    }
    .ant-dropdown.css-dev-only-do-not-override-zl9ks2 {
  z-index: 1000000000 !important;
}


    ${props => {
        switch (props.justifyContent) {
            case 'space-between':
                return `
                    justify-content: space-between;
                `


            default:
                break;
        }
    }}
`

const Title = styled.span`
    font-weight: 500;
    line-height: 16px;
    font-size: 14px;
    color: rgb(71, 71, 71);
    text-transform: capitalize;
`
const Price = styled.span`
    
    width: 100%;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    display: block;
    padding: 0 10px;
    margin: 0;
    white-space: nowrap;
    background-color: var(--White1);
    color: var(--Gray6);
 
`
const Input = styled.input`
    width: 100%;
    height: 1.8em;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    display: block;
    padding: 0 10px;
    margin: 0;
    white-space: nowrap;
    color: var(--Gray6);
    background-color: ${props => props?.color?.bg};
    border: 2px solid ${props => props?.color?.border};
    :focus {
        outline: none;
    }

`