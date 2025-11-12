
import { nanoid } from 'nanoid'
import  { useState } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import { addProduct } from '../../../../../features/cart/cartSlice'
import { formatData } from '../../../../../features/customProducts/customProductSlice'
import { handleModalSetCustomPizza } from '../../../../../features/modals/modalSlice'
import { addNotification } from '../../../../../features/notification/notificationSlice.js'
import { separator } from '../../../../../hooks/separator'
import { AddCustomProductModal } from '../../AddCustomProductModal/AddCustomProductModal.jsx'
import { Modal } from '../../Modal'

import { Header } from './Components/Header.jsx'
import { IngredientList } from './Components/IngredientList.jsx'


const EmptyNewProduct = {
    name: '',
    id: '',
    pricing: {
        price: 0,
        cost: 0,
        tax: 0
    },
    amountToBuy: 1,
    size: '',
}

export const SetCustomProduct = ({ isOpen }) => {

    const dispatch = useDispatch()
    const [IngredientModalOpen, setIngredientModalOpen] = useState(false)
    const handleIngredientOpen = () => setIngredientModalOpen(!IngredientModalOpen)
    const [newProduct, setNewProduct] = useState(EmptyNewProduct)
    const [initialState, setInitialState] = useState(false)

    const closeModal = () => {
        dispatch(handleModalSetCustomPizza())
        dispatch(formatData())
        setNewProduct(EmptyNewProduct)
        setInitialState(true)
    }

    const HandleSubmit = async () => {
        try {
            if (newProduct?.name === '') {
                dispatch(
                    addNotification({
                        message: 'Debe seleccionar un producto',
                        type: 'error'
                    })
                )
                return Promise.reject(new Error('Debe seleccionar un producto'))
            }

            dispatch(addProduct(newProduct))
            return Promise.resolve();
        } catch (error) {
            console.error('Error in SetCustomProduct:', error)
            dispatch(addNotification({ id: nanoid(), message: 'Error al agregar producto', type: 'error' }))
        }

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
                <Header
                    Row={Row}
                    Group={Group}
                    newProduct={newProduct}
                    setNewProduct={setNewProduct}
                    initialState={initialState}
                    setInitialState={setInitialState}
                />
                <IngredientList
                    handleIngredientOpen={handleIngredientOpen}
                />
                <PriceBar>
                    <span></span>
                    <span>Total: RD$ {separator(newProduct?.pricing?.price)}</span>
                </PriceBar>
            </Body>
        </Modal>
    )
}

const Body = styled.div`
 padding: 1em;
 display: grid;
 width: 100%;
    height: 100%;
  background-color: #f1ebeb;
 grid-template-rows: min-content 1fr min-content;
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

const PriceBar = styled.div`
    width: 100%;
    display: flex;
    height: 2.4em;
    align-items: center;
    padding: 0 1em;
    justify-content: space-between;
`