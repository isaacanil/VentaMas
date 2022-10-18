import React, {useState, Fragment} from 'react'
import styled from 'styled-components'
import { SelectClient } from '../../../../../features/cart/cartSlice'
import { InputNumber } from '../Style'
import { useSelector } from 'react-redux'
import { addDelivery, totalPurchase, setChange } from '../../../../../features/cart/cartSlice'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
export const DeliveryOption = () => {
    const dispatch = useDispatch()
    const [deliveryState, setDeliveryState] = useState()
    const ClientSelected = useSelector(SelectClient)
    const handleDelivery = (cash) => {
        
        dispatch(
            addDelivery(cash)
        )
        dispatch(
            totalPurchase()
        )
        dispatch(
            setChange()
        )
       
        

    }
    
    return (
        <Container>
            <DeliveryInner>
                <input type="checkbox" name="" id="delivery" onChange={e => setDeliveryState(e.target.checked)} />
                <label htmlFor="delivery">Delivery</label>
            </DeliveryInner>
            {
                deliveryState ? (
                    ClientSelected ? (
                        <Fragment>
                            <InputNumber border='circle' size='small' type="number" name="" id="" onChange={e => handleDelivery(e.target.value)} placeholder='RD$' />
                            <span>Dirección: {ClientSelected.address}</span>
                        </Fragment>
                    ) : null
                ) : null
            }

        </Container>
    )
}



const Container = styled.div`
    padding: 0.2em 0.6em;
    height: 2.4em;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 0.4em;
    background-color: rgb(199,199,199);

    
`
const DeliveryInner = styled.div``
