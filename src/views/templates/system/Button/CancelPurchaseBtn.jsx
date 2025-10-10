import { useDispatch } from 'react-redux'

import { icons } from '../../../../constants/icons/icons'
import { resetCart, } from '../../../../features/cart/cartSlice'
import { clearTaxReceiptData } from '../../../../features/taxReceipt/taxReceiptSlice'

import { Button } from './Button'


export const CancelPurchaseBtn = () => {
    const dispatch = useDispatch();

    const handleCancelShipping = () => {
        dispatch(resetCart())
        dispatch(clearTaxReceiptData())
    }
    return (
        <Button
            title={icons.operationModes.delete}
            borderRadius='normal'
            width='icon32'
            color='gray-dark'
            onClick={handleCancelShipping}
        />
    )
}