import React, { Fragment } from 'react'
import styled from 'styled-components'
import { CancelShipping,  } from '../../../../features/cart/cartSlice'
import { useDispatch } from 'react-redux'
import { IoMdTrash } from 'react-icons/io'
import { Button } from './Button'
export const CancelPurchaseBtn = () => {
    const dispatch = useDispatch()
    const handleCancelShipping = () => {
        dispatch(
          CancelShipping()
        )
        
      }
    return (
     
            <Button 
            title={ <IoMdTrash/>}
            width='icon32'
            color='gray-dark'
            onClick={handleCancelShipping}
            >
                
            </Button>
       
    )
}

const Container = styled('div')`
    width: 32px;
    height: 32px;
    padding: 0.2em;
    display: flex;
    justify-content: center;
    align-items: center;      
    border-radius: 100px;
    background-color: white;
    
    border: 1px solid rgba(0, 0, 0, 0.307);
    svg{
        width: 1em;
        fill: rgba(31, 31, 31, 0.72);
        
    }
`