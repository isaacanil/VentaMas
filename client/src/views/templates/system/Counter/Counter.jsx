import React, { Fragment, useEffect, useState } from 'react'

import { useDispatch } from 'react-redux';
import {
    setChange,
    totalTaxes,
    totalPurchase,
    deleteProduct,
    addAmountToProduct,
    diminishAmountToProduct,
    onChangeValueAmountToProduct,
    totalShoppingItems
} from '../../../../features/cart/cartSlice'
import { Alert } from '../Product/Cart/Alert';
import Style from './Counter.module.scss'

export const Counter = ({ amountToBuyTotal, stock, id, HandleMenuDelete, MenuDelete }) => {
    const dispatch = useDispatch()
    const [DeletePrevent, setDeletePrevent] = useState(false)
    const [counter, setCounter] = useState(
        {
            id
        }
    )
    useEffect(() => {
        if (stock >= counter.value) {
            dispatch(
                onChangeValueAmountToProduct(counter)
            )

            dispatch(
                totalTaxes()
            )
            dispatch(
                totalPurchase()
            )
            dispatch(
                totalShoppingItems()
            )
            dispatch(
                setChange()
            )
        }
    }, [counter])
    if (counter) {
    }
    const handleIncreaseCounter = () => {
        setCounter(
            {
                id

            }
        )
        dispatch(
            addAmountToProduct(counter)
        )
        dispatch(
            totalShoppingItems()
        )
        dispatch(
            totalTaxes()
        )
        dispatch(
            totalPurchase()
        )
        dispatch(
            setChange()
        )
    }
    //console.log(amountToBuy)
    const handleDiminishCounter = () => {
        if(amountToBuyTotal > 1){
        setCounter(
            {
                id
            }
        )
        dispatch(
            diminishAmountToProduct(counter)
        )
        dispatch(
            totalShoppingItems()
        )
        }
        if (amountToBuyTotal === 1) {
       
            setDeletePrevent(true)
            // if (MenuDelete.execute === true) {
            //     dispatch(
            //         deleteProduct(id, MenuDelete)
            //     )
            //     setCounter(
            //         {
            //             id
            //         }
            //     )
            //     dispatch(
            //         totalTaxes()
            //     )
            //     dispatch(
            //         totalPurchase()
            //     )
            //     dispatch(
            //         setChange()
            //     )
            // }

        }
    }

    return (
        <Fragment>
            <div className={`${Style.Counter_container}`}>
                <button className={Style.Couter_button} onClick={handleDiminishCounter}>-</button>
                <input className={Style.CounterDisplay} type="number" name="" id="" value={amountToBuyTotal} onChange={e => setCounter({ ...counter, value: Number(e.target.value) })} />
                <button className={Style.Couter_button} onClick={handleIncreaseCounter}>+</button>
            </div>
            <Alert
                id={id}
                isOpen={DeletePrevent}
                handleIsOpen={setDeletePrevent}
            />
        </Fragment>
    )
}
