import { useDispatch } from "react-redux"
import { getPendingPurchaseFromDB } from "../../../../../features/Purchase/purchaseSlice"

export const SetPendingPurchaseInState = (purchase) => {
    const dispatch = useDispatch()
    useMemo(() => {
        if (purchase.length > 0) dispatch(getPendingPurchaseFromDB({ optionsID: 'Pedidos', datas: purchase, propertyName: 'data'}))
    }, [purchase])
}