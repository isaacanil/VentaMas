import { CancelShipping, } from '../../../../features/cart/cartSlice'
import { useDispatch } from 'react-redux'
import { Button } from './Button'
import { clearTaxReceiptData } from '../../../../features/taxReceipt/taxReceiptSlice'
import { icons } from '../../../../constants/icons/icons'

export const CancelPurchaseBtn = () => {
    const dispatch = useDispatch();

    const handleCancelShipping = () => {
        dispatch(CancelShipping())
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