
import { nanoid } from 'nanoid'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { SelectIngredientsListName, selectTotalIngredientPrice } from '../../../../../../features/customProducts/customProductSlice'
import { addNotification } from '../../../../../../features/notification/NotificationSlice'

import { removeMatchesString } from '../../../../../../hooks/removeMatchesString'
import { separator } from '../../../../../../hooks/separator'
import { getPizzaType } from '../../getPizzaType'
import customPizzaData from '../customPizza.json'
import { getPrice } from './getPrice'

import { fbGetProductsQueryByType } from '../../../../../../firebase/products/customProduct/fbGetCustomProductByType'
import { selectUser } from '../../../../../../features/auth/userSlice'

const EmptyProduct = {
    id: '',
    type: '',
    name: '',
    category: '',
    amountToBuy: 1,
    pricing: {
        price: 0,
        cost: 0,
        tax: 0
    },
    mitad: { first: '', second: '' }
}
const EmptyNewProduct = {
    name: '',
    id: '',
    amountToBuy: 1,
    pricing: {
        price: 0,
        cost: 0,
        tax: 0
    },
    size: '',
}
const EmptyProductSelected = { a: '', b: '' }

export const Header = ({ Row, Group, newProduct, setNewProduct, initialState, setInitialState }) => {
    let type = 'pizza';

    const dispatch = useDispatch()

    const user = useSelector(selectUser)

    const [products, setProducts] = useState([])
    const { pizzaSlices, sizeList } = customPizzaData
    const [isComplete, setIsComplete] = useState('complete')
    const [product, setProduct] = useState(EmptyProduct)
    const [productSelected, setProductSelected] = useState(EmptyProductSelected)

    const matchList = /Completa|Pepperoni|Vegetales|Jamón y queso|Maíz |Pollo/g;

    const totalIngredientPrice = useSelector(selectTotalIngredientPrice)
    const IngredientListNameSelected = useSelector(SelectIngredientsListName)
    const [size, setSize] = useState('')


    useEffect(() => {
        if (initialState === true) {
            try {
                setTimeout(() => {
                    setProductSelected(EmptyProductSelected)
                    setProduct(EmptyProduct)
                    setIsComplete('complete')
                    setSize('')
                    setNewProduct(EmptyNewProduct)
                    setProducts([])
                    setInitialState(false)
                }, 1000)
            } catch (error) {
                dispatch(addNotification({ message: 'Error al reiniciar el producto', type: 'error' }))
            }
        }
    }, [initialState])

    useEffect(() => {
        if (size !== '') {
            fbGetProductsQueryByType(setProducts, type, size, user)
        }
    }, [size, user])

    useEffect(() => {
        if (isComplete === 'complete' && productSelected.a !== '') {
            const a = JSON.parse(productSelected.a)
            const firstProductName = removeMatchesString(String(a.name), matchList)
            setNewProduct({
                ...newProduct,
                name: `${getPizzaType(firstProductName)} ${IngredientListNameSelected && `. Ingredientes extras: ${IngredientListNameSelected}`}`,
                pricing: {
                    ...newProduct.pricing,
                    price: getPrice({ productSelected, setProduct, isComplete }) + totalIngredientPrice
                },
                size: size,
                id: nanoid(8)
            })
        }
        if (isComplete === 'half' && (productSelected.a !== '' && productSelected.b !== '')) {
            const a = JSON.parse(productSelected.a)
            const b = JSON.parse(productSelected.b)
            const firstProductName = removeMatchesString(String(a.name), matchList);
            const secondProductName = removeMatchesString(String(b.name), matchList);
            try {
                setNewProduct({
                    ...newProduct,
                    name: `pizza mitad de ${firstProductName} y mitad de ${secondProductName}. ${IngredientListNameSelected && `Ingredientes extras: ${IngredientListNameSelected}`} `,
                    pricing: {
                        ...newProduct.pricing,
                        price: Number(getPrice({ productSelected, setProduct, isComplete })) + totalIngredientPrice,
                    },
                    size: size,
                    id: nanoid(8)
                })
            } catch (error) {
                console.log(error)
            }
        }
    }, [productSelected, IngredientListNameSelected, isComplete])

    useEffect(() => {
        if (isComplete === 'complete') {
            setNewProduct({
                ...newProduct,
                pricing: {
                    ...newProduct.pricing,
                    price: Number(getPrice({ productSelected, setProduct, isComplete })) + totalIngredientPrice,
                },
                size: size,
                id: nanoid(8)
            })
        }
        if (isComplete === 'half') {
            setNewProduct({
                ...newProduct,
                pricing: {
                    ...newProduct.pricing,
                    price: Number(getPrice({ productSelected, setProduct, isComplete })) + totalIngredientPrice,
                },
                size: size,
                id: nanoid(8)
            })
        }
    }, [product?.pricing?.price])

    console.log("?? NEW PRODUCT: ", newProduct)

    return (
        <Container>
            <Row>
                <Group>
                    <h4>Porción</h4>
                    <div>
                        <Select name="" id="" value={isComplete} onChange={(e) => setIsComplete(e.target.value)}>
                            {pizzaSlices.map((item, index) => (
                                <option key={index} value={item.value} >{item.label}</option>
                            ))}
                        </Select>
                    </div>
                </Group>
                <Group>
                    <h4>Tamaño</h4>
                    <div>
                        <Select name="" id="" value={size} onChange={e => setSize(e.target.value)}>
                            {
                                sizeList.map((size, index) => (
                                    <option value={size.value} key={index}>{size.label}</option>
                                ))
                            }
                        </Select>
                    </div>
                </Group>
            </Row>
            <Row>
                <Group>
                    <div>
                        <Select name="" id="" value={productSelected.a} onChange={(e) => setProductSelected({ ...productSelected, a: e.target.value })}>
                            <option value="">Eligir</option>
                            {
                                products
                                    .sort((a, b) => a?.name > b?.name ? 1 : -1)
                                    .map((product, index) => (
                                        <option value={JSON.stringify(product)} key={index}>{product?.name}</option>
                                    ))
                            }
                        </Select>
                    </div>
                </Group>
                {isComplete === 'half' ? (
                    <Group>
                        <div>
                            <Select name="" id="" value={productSelected.b} onChange={(e) => setProductSelected({ ...productSelected, b: e.target.value })}>
                                <option value="">Eligir</option>
                                {
                                    products
                                        .sort((a, b) => a?.name > b?.name ? 1 : -1)
                                        .map((product, index) => (
                                            <option value={JSON.stringify(product)} key={index}>{product?.name}</option>
                                        ))
                                }
                            </Select>
                        </div>
                    </Group>
                ) : null}
            </Row>
            <ProductPriceBar>
                <span>Total: RD$ {separator(product?.pricing?.price)}</span>
            </ProductPriceBar>
        </Container>
    )
}
const Container = styled.div`
`

const Select = styled.select`
    height: 1.8em;
    border-radius: var(--border-radius-light);
    padding: 0 0.6em;
    transition: width 0.5s ease ; 
    width: 100%;
`
const ProductPriceBar = styled.div`
height: 2em;
width: 100%;

    //background-color: #f1ebeb;
    display: flex;
    justify-content: flex-end;
    padding: 0 1em;
    align-items: center;
    span{
        
    }
`