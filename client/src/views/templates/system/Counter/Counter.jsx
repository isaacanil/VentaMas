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
    totalShoppingItems
       
    
} from '../../../../features/cart/cartSlice'
import Style from './Counter.module.scss'

export const Counter = ({ amountToBuyTotal, stock, id }) => {


    const dispatch = useDispatch()
    const [counter, setCounter] = useState(
        {   
            id
        }
    )
        useEffect(()=>{
           if(stock >= counter.value){
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

        },[counter])
        //console.log(counter)
    if(counter){

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
        if(counter.value === 1){
            dispatch(
                deleteProduct(id)
            )
            setCounter(
                {
                    id
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
            <input className={Style.CounterDisplay} type="number" name="" id="" value={amountToBuyTotal} onChange={e => setCounter({...counter, value: Number(e.target.value) })} />
            <button className={Style.Couter_button} onClick={handleIncreaseCounter}>+</button>
        </div>
    )
}
