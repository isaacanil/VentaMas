import React, { Fragment, useEffect, useState } from 'react'
import { CgMathMinus, CgMathPlus } from 'react-icons/cg';
import { useDispatch } from 'react-redux';
import { icons } from '../../../../constants/icons/icons';
import {
    setChange,
    totalTaxes,
    totalPurchase,
    deleteProduct,
    addAmountToProduct,
    diminishAmountToProduct,
    onChangeValueAmountToProduct,
    totalShoppingItems,
    addPaymentMethodAutoValue
} from '../../../../features/cart/cartSlice'
import { Button } from '../Button/Button';
import { Alert } from '../Product/Cart/Alert';
import Style from './Counter.module.scss'
import styled from 'styled-components';

export const Counter = ({ amountToBuyTotal, stock, id }) => {
    const dispatch = useDispatch()
    const [DeletePrevent, setDeletePrevent] = useState(false)
    const [counter, setCounter] = useState({ id })

    useEffect(() => {
        if (counter.value >= 0) {
            //dispatch(totalShoppingItems())
            
            dispatch(onChangeValueAmountToProduct(counter))
            dispatch(addPaymentMethodAutoValue())
           // dispatch(setChange())
        }
       
    }, [counter])

    const handleIncreaseCounter = () => {
        setCounter({ id })
        dispatch(addAmountToProduct(counter))
        dispatch(totalShoppingItems())
        dispatch(totalPurchase())
        dispatch(addPaymentMethodAutoValue())
        dispatch(totalTaxes())
        dispatch(setChange())
    }


    const handleDiminishCounter = () => {
        if (amountToBuyTotal > 1) {
            setCounter({ id })
            dispatch(diminishAmountToProduct(counter))
            dispatch(totalPurchase())
            dispatch(totalShoppingItems())
            dispatch(totalTaxes())
            dispatch(addPaymentMethodAutoValue())
        }
       
        if (amountToBuyTotal === 1) {
            setDeletePrevent(true)
        }
    }
    return (
        <Fragment>
            <Container>
                <ButtonCounter onClick={handleDiminishCounter}>
                    {icons.mathOperations.subtract}
                </ButtonCounter>
                <CounterDisplay
                    type="number"
                    name=""
                    id=""
                    value={amountToBuyTotal ? amountToBuyTotal : ""}
                   
                    onChange={e => setCounter({ ...counter, value: e.target.value })}
                />
                <ButtonCounter onClick={handleIncreaseCounter}>
                    {icons.mathOperations.add}
                </ButtonCounter>
            </Container>
            <Alert
                id={id}
                isOpen={DeletePrevent}
                handleIsOpen={setDeletePrevent}
            />
        </Fragment>
    )
}
const Container = styled.div`
    display: grid;
    grid-template-columns: min-content 1fr  min-content;
    align-items: center;
    background-color: var(--White3);
    height: 1.6em;
    padding: 0 0.2em;
    border-radius: 6px;
`
const ButtonCounter = styled.button`
    border: none;
       outline: none;
       font-weight: 700;
       display: flex;
       align-items: center;
       justify-content: center;
       border-radius: 4px;
       background-color: var(--White);
       height: 1.4em;
       width: 1.4em;
       padding: 0.2em;
       &:focus{
         outline: none;
       }
        svg{
          
            color: var(--Gray6);
        }
    
`
const CounterDisplay = styled.input`

      border: 1px solid rgba(0, 0, 0, 0);
        width: 100%;
      text-align: center;
      font-size: 17px;
      outline: none;
      background-color: transparent;
      &::-webkit-inner-spin-button, &::-webkit-outer-spin-button{
         -webkit-appearance: none;
         margin: 0;
     
    }
    `