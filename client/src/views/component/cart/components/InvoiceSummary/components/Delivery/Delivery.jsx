import React, { useRef } from 'react'
import { Label, LineItem } from '../../InvoiceSummary'
import { InputV4 } from '../../../../../../templates/system/Inputs/GeneralInput/InputV4'
import * as antd from 'antd'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { selectClient, setClient } from '../../../../../../../features/clientCart/clientCartSlice'
import { updateObject } from '../../../../../../../utils/object/updateObject'

export const Delivery = () => {
    const dispatch = useDispatch()
    const deliveryStatusInput = useRef(null)
    const client = useSelector(selectClient)
    const updateClientStatus = (e) => {
        dispatch(setClient({
            ...client,
            delivery: {
                ...client.delivery,
                status: e.target.checked,
            }
        }))

    }
    const updateClient = (e) => {
        dispatch(setClient({
            ...client,
            delivery: {
                ...client.delivery,
                value: Number(e.target.value),
            }
        }))
    }
    return (
        <LineItem>
            <span
            >
                <Label htmlFor='delivery'>Delivery:</Label>
            </span>
            <span
                style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', alignItems: 'center', gap: '0.2em', maxWidth: '156px' }}
            >
                <Checkbox
                    id='delivery'
                    checked={client?.delivery?.status}
                    onChange={(e) => updateClientStatus(e)}
                />
                <InputV4
                    type="number"
                    value={client?.delivery?.value || ''}
                    placeholder='0.00'
                    disabled={!client?.delivery?.status}
                    ref={deliveryStatusInput}
                    focusWhen={client?.delivery?.status}
                    onChange={(e) => updateClient(e)}
                />


            </span>
        </LineItem>
    )
}

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px !important; // Ancho del checkbox
  height: 16px !important; // Alto del checkbox
  cursor: pointer; // Cambia el cursor a una mano para indicar que es clickable

  // Si quieres que el checkbox sea más grande al pasar el mouse, puedes agregar esto:
  &:hover {
    transform: scale(1.2); // Aumenta el tamaño del checkbox al pasar el mouse
  }
`;