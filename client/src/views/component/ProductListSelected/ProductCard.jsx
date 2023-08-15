import React, { useMemo, useState } from 'react'
import { IoMdTrash } from 'react-icons/io'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { DeleteProduct, updateInitialCost, updateNewStock, } from '../../../features/addOrder/addOrderModalSlice'
import { separator } from '../../../hooks/separator'
import { Button } from '../../templates/system/Button/Button'
import { InputV4 } from '../../templates/system/Inputs/InputV4'
import { useFormatPrice } from '../../../hooks/useFormatPrice'

export const ProductCard = ({ product, handleDeleteProduct }) => {
    const dispatch = useDispatch()

    return (
        <Container>
            <Col>
                <span>
                    {product.productName}
                </span>
            </Col>
            <Col>
                <span>
                    <Input value={product.stock.newStock} onChange={e => dispatch(updateNewStock({ stock: e.target.value, productID: product.id }))} />
                </span>
            </Col>
            <Col>
                <span>
                    <Input
                        value={product.initialCost}
                        handleBlur={(value) => useFormatPrice(value)}
                        onChange={e => dispatch(updateInitialCost(
                            { initialCost: e.target.value, productID: product.id }
                        ))}
                    />
                    {/* RD${separator(product.initialCost)} */}
                </span>
            </Col>
            <Col>
                <span>
                    RD${separator(product.initialCost * product.stock.newStock)}
                </span>
            </Col>
            <Button
                title={<IoMdTrash />}
                width='icon24'
                border='light'
                borderRadius='normal'
                onClick={() => handleDeleteProduct(product)}
            />

        </Container>
    )
}
const Container = styled.div`
    display: grid;
    grid-template-columns: 250px 1fr 1fr 1fr min-content;
    height: 2.75em;
    align-items: center;
    align-content: center;
    padding: 0 0.8em;
    background-color: #fff;
    color: #353535;
    border: var(--border-primary);
    border-radius: var(--border-radius-light);
    gap: 1em;
    &:last-child{
        border-bottom: none;
    }
    
`
const Col = styled.div`
color: var(--Gray6);
    &:first-child{
        span{
            max-width: 180px;
            width: 100%;
            line-height: 1pc;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;  
            //white-space: nowrap;
            text-transform: capitalize;
            text-overflow: ellipsis;
            overflow: hidden;            
        }
    }
    &:nth-child(3n){
        span{
            display: block;
            text-align: right;
        }
    }
    &:nth-child(4n){
        span{
            display: block;
            text-align: right;
        }
    }
    &:nth-child(4n){
      
            display: block;
            text-align: right;
        
    }
`
const Input = ({ value, onChange, handleBlur, handleFocus }) => {
    const [isFocus, setIsFocus] = useState(false)

    const displayedValue = useMemo(() => {
        if (!isFocus && handleBlur) return handleBlur(value);
        if (isFocus && handleFocus) return handleFocus(value);
        return value;
    }, [isFocus, handleBlur, handleFocus, value]);

    return (
        <InputContainer
            value={displayedValue}
            onChange={onChange}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
        />
    )
}
const InputContainer = styled.input`
            outline: none;
            border: none;
            height: 100%;
            border: 1px solid transparent;
            width: 100%;
        :focus{
            border: 1px solid black;
        }
    `