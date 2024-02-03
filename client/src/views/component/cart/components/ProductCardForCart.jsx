import React, { useEffect, useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { useDispatch } from 'react-redux'
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
const { Button } = antd
const variants = {
    initial: { opacity: 0, y: -90 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 150, transition: { duration: 0.5 } },  // nueva propiedad
};

export const ProductCardForCart = ({ item }) => {
    const dispatch = useDispatch()
    const [priceInputFocus, setInputPriceFocus] = useState(false);
    console.log(item)
    const deleteProductFromCart = (id) => {
        dispatch(totalPurchase())
        dispatch(deleteProduct(id))
        dispatch(totalPurchaseWithoutTaxes())
        dispatch(totalPurchase())
        dispatch(totalShoppingItems())
        dispatch(setChange())
        dispatch(addPaymentMethodAutoValue())
    }

    const handleChangePrice = (e) => {
        dispatch(changeProductPrice({ id: item.id, newPrice: e.target.value }))
    }

    function extraerPreciosConImpuesto(producto) {
        const propiedadesPrecio = {
            'listPrice': 'Precio de lista',
            'averagePrice': 'Precio promedio',
            'minimumPrice': 'Precio mínimo',
        };
        const preciosConImpuesto = [];

        Object.entries(propiedadesPrecio).forEach(([key, label]) => {
            if (producto.hasOwnProperty(key)) {
                let valor = producto[key];

                // Calcular y agregar el precio con impuesto
                if (producto.hasOwnProperty('tax') && producto.tax.hasOwnProperty('value')) {
                    const impuesto = producto.tax.value;
                    const precioConImpuesto = valor * (1 + impuesto);
                    preciosConImpuesto.push({ label: ``, value: Number(precioConImpuesto.toFixed(2)) });
                }
            }
        });

        return preciosConImpuesto;
    }
    const precios = extraerPreciosConImpuesto(item);
    const handleMenuClick = (e) => {
        console.log(e)
        const item = {
            target: {
                value: e.value
            }
        }
        handleChangePrice(item); // actualiza el precio en el estado global del carrito
    };

    const items = precios.map((precio, index) => ({
        key: `${index}`,
        label: (
            <div
                onClick={() => handleMenuClick(precio)}
                style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{precio.label}</span>
                <span>{`$${precio.value.toFixed(2)}`}</span>
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

                    <Title>{item.productName}</Title>
                    <Price>{useFormatPrice(item.price.total)}</Price>
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
                        onClick={() => deleteProductFromCart(item.id)}
                        danger
                    />
                </div>
            </Row>
            <Row>
                <Group >
                    <Dropdown
                        menu={{
                            items
                        }}
                        trigger={
                            ['click']
                        }
                    >
                        <Button
                            icon={icons.arrows.caretDown}
                            size='small'
                        />
                    </Dropdown>
                    <input
                        type={priceInputFocus ? "number" : "text"}
                        onFocus={() => setInputPriceFocus(true)}
                        onBlur={() => setInputPriceFocus(false)}
                        style={
                            {
                                width: '100%',
                                height: "1.8em",
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '6px',
                                border: 'none',
                                display: 'block',
                                padding: '0 10px',
                                margin: '0',
                                whiteSpace: 'nowrap',
                                backgroundColor: 'var(--White3)',
                                color: 'var(--Gray6)',
                            }
                        }
                        onChange={handleChangePrice}
                        value={priceInputFocus ? item.price.unit : useFormatPrice(item.price.unit)}
                    />
                    <Counter
                        amountToBuyTotal={item.amountToBuy.total}
                        stock={item.stock}
                        id={item.id}
                        product={item}
                    ></Counter>


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
