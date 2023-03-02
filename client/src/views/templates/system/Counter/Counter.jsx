import React, { Fragment, useEffect, useState } from 'react'
import { CgMathMinus, CgMathPlus } from 'react-icons/cg';
import { useDispatch } from 'react-redux';
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

export const Counter = ({ amountToBuyTotal, stock, id }) => {
    const dispatch = useDispatch()
    const [DeletePrevent, setDeletePrevent] = useState(false)
    const [counter, setCounter] = useState({ id })
    useEffect(() => {
        if (stock >= counter.value) {
            dispatch(totalShoppingItems())
            dispatch(totalPurchase())
            dispatch(totalTaxes())
            dispatch(onChangeValueAmountToProduct(counter))
            dispatch(addPaymentMethodAutoValue())
            dispatch(setChange())
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
            <div className={`${Style.Counter_container}`}>
                <button className={Style.Couter_button} onClick={handleDiminishCounter}>
                    <span><CgMathMinus /></span>
                </button>

                <input className={Style.CounterDisplay} type="number" name="" id="" value={amountToBuyTotal} onChange={e => setCounter({ ...counter, value: Number(e.target.value) })} />
                <button className={Style.Couter_button} onClick={handleIncreaseCounter}>
                    <span><CgMathPlus /></span>
                </button>
            </div>
            <Alert
                id={id}
                isOpen={DeletePrevent}
                handleIsOpen={setDeletePrevent}
            />
        </Fragment>
    )
}
