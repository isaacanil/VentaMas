import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { TbPlus } from 'react-icons/tb'



import { useDispatch, useSelector } from 'react-redux'


import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { addNotification } from '../../../../../features/notification/NotificationSlice'
import { ProductFilter } from '../../../ProductFilter/ProductFilter'
import { AddProductButton } from '../../AddOrder/Button'
import { InputNumber, InputText } from '../../../../templates/system/Inputs/Input'
import { Button } from '../../../../templates/system/Button/Button'
import { Tooltip } from '../../../../templates/system/Button/Tooltip'
import { addProductToProductOutflow, selectProduct, SelectProductSelected } from '../../../../../features/productOutflow/productOutflow'
import { tableHeaderColumns } from './tableConfig/tableHeaderConfig'
import { useClickOutSide } from '../../../../../hooks/useClickOutSide'

export const OutputProductEntry = ({ fn }) => {

    const dispatch = useDispatch();
    const [showProductList, setShowProductList] = useState(false)
    const productSelected = useSelector(SelectProductSelected)
    const clickOutside = useClickOutSide()
    const handleAddToProductOutflow = () => dispatch(addProductToProductOutflow(productSelected))

    const inputProductNameRef = useRef(null);
    const inputQuantityRef = useRef(null);
    const inputMotiveRef = useRef(null);
    const inputObservationsRef = useRef(null);
    const inputStockFocus = () => inputQuantityRef.current.focus();
    const handleSelectProduct = async (product) => {
        inputStockFocus()
        dispatch(selectProduct({ ...productSelected, product: product.product }))
    }

    const handleInputChange = (e, type = false) => {
        switch (type) {
            case false:
                return dispatch(selectProduct({ ...productSelected, [e.target.name]: e.target.value })) 
            case 'number':
                return dispatch(selectProduct({ ...productSelected, [e.target.name]: Number(e.target.value) }))
            default:
                return
        }
        dispatch(selectProduct({ ...productSelected, [e.target.name]: e.target.value }))
    }
    const tableColumns = tableHeaderColumns({Group})
    return (
        <Container>
            <Row columns={tableColumns}>
                {tableColumns.map((col, index) => (
                    <Col key={index}>
                        {col.render(col.subtitle)}
                    </Col>
                ))}     
            </Row>
            <Row columns={tableColumns}>
                <ProductFilter
                    handleSelectProduct={handleSelectProduct}
                    isOpen={showProductList}
                    setIsOpen={setShowProductList}
                    productName={productSelected?.product?.productName || ''}
                />
                <div>
                    <InputNumber
                        bgColor='gray-light'
                        border
                        ref={inputQuantityRef}
                        placeholder={`Cantidad`}
                        name='currentRemovedQuantity'
                        value={productSelected?.currentRemovedQuantity || ''}
                        onChange={(e) => handleInputChange(e, 'number')}
                    />
                </div>
                <div>
                    <InputText
                        value={productSelected?.motive || ""}
                        placeholder='Motivo'
                        name='motive'
                        onChange={handleInputChange}
                        border
                        bgColor='gray-light'
                    />
                </div>
                <div>
                    <InputText
                        value={productSelected?.observations || ""}
                        placeholder='Observaciones'
                        name='observations'
                        onChange={handleInputChange}
                        border
                        bgColor='gray-light'
                    />
                </div>
                <div>
                    <Button
                        title={<TbPlus />}
                        width='icon32'
                        border='light'
                        borderRadius='normal'
                        onClick={handleAddToProductOutflow}
                    />

                </div>
            </Row>
        </Container>
    )
}
const Container = styled.div`
    background-color: var(--White);

    display: grid;
    gap: 0.2em;
    padding: 0.2em 1em 0.4em;
    position: relative;
    z-index: 2;
`
const Row = styled.div`
    color: rgb(37, 37, 37);
     display: grid;
     position: relative;
     gap: 1em;

${({ columns }) => columns && `
    grid-template-columns: ${columns.map(col => col.width).join(' ')};
    `
    }
     
`
const Col = styled.div`
       display: flex;
       font-weight: 500;
       min-width: 2em;
       align-items: center;
       span{
        
    font-size: 12px;
    line-height: 12px;
       }
`
const Group = styled.div`
    display: flex;
    gap: 0.5em;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0.5em;
    border-radius: 0.5em;
    background-color: var(--White);
    border: 1px solid var(--Gray-300);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    &:hover{
        background-color: var(--Gray-100);
    }
    span{
        font-size: 12px;
        line-height: 12px;
    }
`

