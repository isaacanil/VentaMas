import React, { useEffect, useState } from 'react'

import { useDispatch } from 'react-redux';
import { 
    setChange,
    totalTaxes, 
    totalPurchase,  
    deleteProduct, 
    addAmountToProduct, 
    diminishAmountToProduct, 
    onChangeValueAmountToProduct, 
    
} from '../../../../features/cart/cartSlice'
import Style from './Counter.module.scss'

export const Counter = ({ amountToBuy, stock, id }) => {


    const dispatch = useDispatch()
    const [counter, setCounter] = useState(
        {
            id,
            value: 1
        }
    )
    
        useEffect(()=>{
           
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
                setChange()
              )
        },[counter])

    if(counter){

    }
    const handleIncreaseCounter = () => {
        setCounter(
            {
                id,
                value: Number(counter.value + 1)
            }
        )
        dispatch(
            addAmountToProduct(counter)
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
        setCounter(
            {
                id,
                value: Number(counter.value - 1)
            }
        )
        dispatch(
            diminishAmountToProduct(counter)
        )
        if(counter.value === 1){
            dispatch(
                deleteProduct(id)
            )
            setCounter(
                {
                    id, 
                    value: 1
                }
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
    }
    
    return (
        <div className={`${Style.Counter_container}`}>
            <button className={Style.Couter_button} onClick={handleDiminishCounter}>-</button>
            <input className={Style.CounterDisplay} type="number" name="" id="" value={counter.value.toFixed()} onChange={e => setCounter({id, value: Number(e.target.value) })} />
            <button className={Style.Couter_button} onClick={handleIncreaseCounter}>+</button>
        </div>
    )
}
