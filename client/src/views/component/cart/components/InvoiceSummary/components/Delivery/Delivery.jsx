import React, { useRef } from 'react'
import { Label, LineItem } from '../../InvoiceSummary'
import {Input, Checkbox, InputNumber} from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { selectClient, setClient } from '../../../../../../../features/clientCart/clientCartSlice'
import { useEffect } from 'react'

export const Delivery = () => {
    const dispatch = useDispatch()
    const deliveryStatusInput = useRef(null)
    const client = useSelector(selectClient)

    useEffect(() => {
        if (client?.delivery?.status && deliveryStatusInput.current) {
          // Enfocar el input cuando el estado de delivery es verdadero
          deliveryStatusInput.current.focus();
        }
      }, [client?.delivery?.status]);
    const updateClientStatus = (e) => {
        const value = e.target.checked;
        dispatch(setClient({
            ...client,
            delivery: {
                ...client.delivery,
                status: value,
            }
        }))
    }
    const updateClient = (value) => {
        dispatch(setClient({
            ...client,
            delivery: {
                ...client.delivery,
                value: Number(value),
            }
        }))
    }
    
    return (
        <LineItem>
                <Label htmlFor='delivery'>Delivery:</Label>
            <span
                style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', alignItems: 'center', gap: '0.2em', }}
            >
                <Checkbox
                    id='delivery'
                   
                    checked={client?.delivery?.status}
                    onChange={(e) => updateClientStatus(e)}
                />
                <InputNumber
                    value={client?.delivery?.value || ''}
                    ref={deliveryStatusInput}
                    placeholder='0'
                    prefix='$'
                    style={{ width: '170px' }}
                    min={0}
                    disabled={!client?.delivery?.status}
                    onChange={(e) => updateClient(e)}
                />
            </span>
        </LineItem>
    )
}