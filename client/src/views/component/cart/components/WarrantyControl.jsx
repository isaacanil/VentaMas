import React from 'react'
import * as antd from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { SelectSettingCart, togglePrintWarranty } from '../../../../features/cart/cartSlice'
const { Form, Checkbox } = antd
export const WarrantyControl = () => {
    const { printWarranty } = useSelector(SelectSettingCart)
    const dispatch = useDispatch()
    const handleTogglePrintWarranty = () => {
        dispatch(togglePrintWarranty())
    }
    return (
        <Checkbox
            style={{
                paddingLeft: '0.4em',
                fontWeight: '500'
            }}
            checked={printWarranty}
            onChange={handleTogglePrintWarranty}
        >
            Imprimir Garantía
        </Checkbox>
    )
}
