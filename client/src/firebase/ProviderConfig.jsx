import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { handleSetOptions } from "../features/order/ordersSlice"
import { fbGetProviders } from "./provider/fbGetProvider"
import { selectUser } from "../features/auth/userSlice"

export const ProvidersData = () => {
    const [providers, setProviders] = useState([])
    const user = useSelector(selectUser)
    useEffect(() => { fbGetProviders(setProviders, user) }, [])
    return providers
}
export const SetProvidersInFilterOptionsMenu = (providers) => {
    const dispatch = useDispatch()
    useEffect(() => {
        if (providers.length > 0) {
            dispatch(handleSetOptions({ optionsID: 'Proveedores', datas: providers, propertyName: 'provider' }))
        }
    }, [providers])
}