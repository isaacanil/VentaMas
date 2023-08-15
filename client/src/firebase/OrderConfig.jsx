import { useEffect, useMemo, useState } from "react"
import { useDispatch } from "react-redux"
import { getPendingOrdersFromDB } from "../features/order/ordersSlice"


// export const OrdersData = () => {
//     const [orders, setOrders] = useState([])
//     useEffect(() => {
//         fbGetOrders(setOrders)
//     }, [])
//     return orders
// }
// export const SetPendingOrdersInState = (orders) => {
//     const dispatch = useDispatch()
//     useMemo(() => {
//         if (orders.length > 0) dispatch(getPendingOrdersFromDB({ optionsID: 'Pedidos', datas: orders, propertyName: 'data'}))
//     }, [orders])
// }


