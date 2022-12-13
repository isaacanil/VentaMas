import { isEmpty } from '@firebase/util'
import React, { useState } from 'react'
import { useEffect } from 'react'
import styled from 'styled-components'
import { getCustomProduct, QueryByType } from '../../../../firebase/firebaseconfig.js'
import { separator } from '../../../../hooks/separator'
import { Modal } from '../modal'
import { IngredientCard } from '../../../templates/system/customProduct/typePizza/ingredientCard'
import { useDispatch, useSelector } from 'react-redux'
import { SelectSetCustomPizzaModal, handleModalSetCustomPizza } from '../../../../features/modals/modalSlice'
import { selectTotalIngredientPrice, SelectIngredientsListName, formatData } from '../../../../features/customProducts/customProductSlice'
import { nanoid } from 'nanoid'
import { addProduct } from '../../../../features/cart/cartSlice'
import { v4 } from 'uuid'
import { Button } from '../../../templates/system/Button/Button.jsx'
import { useNavigate } from 'react-router-dom'
import { AddCustomProductModal } from '../AddCustomProductModal/AddCustomProductModal.jsx'
import { removeMatchesString } from '../../../../hooks/removeMatchesString.js'
export const SetCustomProduct = ({ isOpen }) => {
    const dispatch = useDispatch()
    const matchList = /Completa|Pepperoni|Vegetales|Jamón y queso|Maíz |Pollo/g;
    const totalIngredientPrice = useSelector(selectTotalIngredientPrice)
    const IngredientListNameSelected = useSelector(SelectIngredientsListName)
    //console.log('hola', IngredientListNameSelected)
    const [IngredientModalOpen, setIngredientModalOpen ] = useState(false)
    const handleIngredientOpen = () => setIngredientModalOpen(!IngredientModalOpen)
    const [customProduct, setCustomProduct] = useState({})
    const [newProduct, setNewProduct] = useState(
        {
            productName: '',
            cost: { unit: 0, total: 0 },
            id: '',
            price: { unit: 0, total: 0 },
            amountToBuy: { unit: 1, total: 1 },
            tax: { ref: 'Exento', value: 0, unit: 0, total: 0 },
            size: '',
        },
    )
    useEffect(() => {
        getCustomProduct(setCustomProduct)
    }, [])
    const [size, setSize] = useState('')
    const [products, setProducts] = useState([])
    const [product, setProduct] = useState({
        id: '',
        type: '',
        productName: '',
        category: '',
        amountToBuy: {
            unit: 1,
            total: 1,
        },
        price: {
            unit: 0,
            total: 0
        },
        mitad: {
            first: '',
            second: ''
        }
    })
    const [productSelected, setProductSelected] = useState(
        {
            a: '',
            b: ''
        }
    )
    const [isComplete, setIsComplete] = useState(true)
    const handleProduct = (data) => {
        data === 'false' ? setIsComplete(false) : null;
        data === 'true' ? setIsComplete(true) : null;
        // console.log(isComplete)
    }
    const closeModal = () => {
        dispatch(
            handleModalSetCustomPizza()
        )
    }
    let type = 'pizza';
    useEffect(() => {
        if (size === '') {
            // console.log('esperando')
        } else {
            QueryByType(setProducts, type, size)
        }
    }, [size])
    useEffect(() => {
        if (isComplete && productSelected.a !== '') {
            const a = JSON.parse(productSelected.a)
            const firstProductPrice = a.price.total
            const firstProductName = removeMatchesString(String(a.productName), matchList)
            setNewProduct({
                ...newProduct,
                productName: `pizza de ${firstProductName}. ingrediente extras: ${IngredientListNameSelected}`,
                price: {
                    unit: firstProductPrice + totalIngredientPrice,
                    total: firstProductPrice + totalIngredientPrice
                }, size: size
            })
            setProduct({
                price: { total: firstProductPrice }
            })
        }
        if (!isComplete && productSelected.a !== '' && productSelected.b !== '') {
            const a = JSON.parse(productSelected.a)
            const b = JSON.parse(productSelected.b)
            const firstProductPrice = a.price.total;
            const firstProductName = removeMatchesString(String(a.productName), matchList);
            const secondProductPrice = b.price.total;
            const secondProductName = removeMatchesString(String(b.productName), matchList);

            console.log(`${firstProductName} => ${firstProductPrice}, ${secondProductName} => ${secondProductPrice}`)
            //Todo ************price****************************************************************
            const price = () => {
                return new Promise((resolve, reject) => {
                    if (firstProductPrice > secondProductPrice) {
                        setProduct({
                            price: { unit: firstProductPrice, total: firstProductPrice }
                        })
                        resolve(product.price.total)
                    }
                    if (firstProductPrice < secondProductPrice) {
                        setProduct({
                            price: { unit: secondProductPrice, total: secondProductPrice }
                        })
                        resolve(secondProductPrice)
                    }
                    if (firstProductPrice === secondProductPrice) {
                        setProduct({
                            price: { unit: firstProductPrice, total: firstProductPrice }
                        })
                        resolve(firstProductPrice)
                    }
                })
            }
            try {
                price().then((price) => {
                    setNewProduct({
                        ...newProduct,
                        productName: `pizza mitad de ${firstProductName} y mitad de ${secondProductName}. ingrediente extras: ${IngredientListNameSelected}`,
                        price: {
                            unit: price + totalIngredientPrice,
                            total: price + totalIngredientPrice
                        },
                        size: size,
                        id: nanoid(6)
                    })
                })
            } catch (error) {
                console.log(error)
            }
        }
    }, [productSelected.a, productSelected.b, IngredientListNameSelected])
  
  
    console.log(productSelected.b)
    const HandleSubmit = () => {
        setNewProduct({
            ...newProduct,
            id: nanoid(6),
            size,
            amountToBuy: { unit: 1, total: 1 },
        })
        dispatch(
            addProduct(newProduct)
        )
        dispatch(
            formatData()
        )
        setProductSelected(
            {
                a: '',
                b: ''
            }
        ),
            setIsComplete(true),
            setProduct(
                {
                    id: '',
                    type: '',
                    productName: '',
                    amountToBuy: {
                        unit: 1,
                        total: 1,
                    },
                    price: {
                        unit: 0,
                        total: 0
                    },
                    mitad: {
                        first: '',
                        second: ''
                    }
                }
            )
        setNewProduct({
            ...newProduct,
            productName: '',
            cost: { unit: 0, total: 0 },
            id: '',
            price: { unit: 0, total: 0 },
            amountToBuy: { unit: 1, total: 1 },
            tax: { ref: 'Exento', value: 0, unit: 0, total: 0 },
            size: ''
        })
    }
    return (
        <Modal
            isOpen={isOpen}
            close={closeModal}
            btnSubmitName='Aceptar'
            nameRef='Producto Personalizable'
            handleSubmit={HandleSubmit}
            subModal={
                <AddCustomProductModal
                    isOpen={IngredientModalOpen}
                    handleOpen={handleIngredientOpen}
                />}
        >
            <Body>
                <Row>
                    <Group>
                        <h4>Porción</h4>
                        <div>
                            <Select name="" id="" onChange={(e) => handleProduct(e.target.value)}>
                                <option value='true'>Completa</option>
                                <option value='false'>Mitad</option>
                            </Select>
                        </div>
                    </Group>
                    <Group>
                        <h4>Tamaño</h4>
                        <div>
                            <Select name="" id="" onChange={e => setSize(e.target.value)}>
                                <option value="">Elige el tamaño</option>
                                <option value="Familiar">Familiar</option>
                                <option value="Grande">Grande</option>
                                <option value="Mediana">Mediana</option>
                                <option value="Personal">Personal</option>
                            </Select>
                        </div>
                    </Group>
                </Row>
                <Row>
                    <Group>
                        <div>
                            <Select name="" id="" onChange={(e) => setProductSelected({ ...productSelected, a: e.target.value })}>
                                <option value="">Eligir</option>
                                {
                                    products.map(({ product }, index) => (
                                        <option value={JSON.stringify(product)} key={index}>{product.productName}</option>
                                    ))
                                }
                            </Select>
                        </div>
                    </Group>
                    {!isComplete ? (
                        <Group>
                            <div>
                                <Select name="" id="" onChange={(e) => setProductSelected({ ...productSelected, b: e.target.value })}>
                                    <option value="">Eligir</option>
                                    {
                                        products.map(({ product }, index) => (
                                            <option value={JSON.stringify(product)} key={index}>{product.productName}</option>
                                        ))
                                    }
                                </Select>
                            </div>
                        </Group>
                    ) : null}
                </Row>
                <ProductPriceBar>
                    <span>Total: RD$ {separator(product.price.total)}</span>
                </ProductPriceBar>
                <IngredientListContainer>
                    <IngredientList>
                        <IngredientListWrapper>
                            {
                                !isEmpty(customProduct) ? (
                                    customProduct.ingredientList.length > 0 ? (
                                        customProduct.ingredientList.map((item, index) => (
                                            <IngredientCard
                                                key={index}
                                                item={item}
                                            />
                                        ))
                                    ) : null
                                ) : null
                            }
                        </IngredientListWrapper>
                        <IngredientPriceBar>
                            <Button title={'Editar Ingredientes'} onClick={handleIngredientOpen} />
                            <span>Total: RD$ {separator(totalIngredientPrice)}</span>
                        </IngredientPriceBar>
                    </IngredientList>
                </IngredientListContainer>
                <IngredientPriceBar>
                    <span></span>
                    <span>Total: RD$ {separator(newProduct.price.total)}</span>
                </IngredientPriceBar>
            </Body>

        </Modal>

    )
}
const Container = styled.div`
    height: 100%;
    display: grid;
    grid-template-rows: 2em 1fr;

`
const Header = styled.div`
    
`
const Body = styled.div`
 padding: 1em;
 display: grid;
 grid-template-rows: min-content min-content min-content 1fr min-content;
 gap: 0.2em 0.4em;
`
const Row = styled.div`
    display: flex;
    gap: 1em;
    margin-bottom: 0.4em;
`
const Group = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0;
    div{
        select{
            width: 100%;
        }
    }
`
const Select = styled.select`
    height: 1.8em;
    border-radius: 50px;
    padding: 0 0.6em;
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
const IngredientListContainer = styled.div`
   
    
    margin: 0;
    padding: 0;
    border-radius: 10px;
    height: auto;
    position: relative;
    `

const IngredientList = styled.div`
    display: grid;
    height: auto;
    grid-template-rows: 1fr min-content;
    background-color: #bdcdce;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
   
    
    `
const IngredientListWrapper = styled.ul`
    overflow-y: scroll;
    height: 15em;
    width: 100%;
    background-color: rgb(187,187,187);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.137);
    padding: 0.6em;
    display: grid;
    grid-auto-rows: min-content;
    gap: 0.6em;
    

`
const Footer = styled.div`
    height: 4em;
    width: 100%;
    border-radius: 8px;
`
const IngredientPriceBar = styled.div`
    width: 100%;
    display: flex;
    height: 2.4em;
    align-items: center;
    padding: 0 1em;
    justify-content: space-between;
`
