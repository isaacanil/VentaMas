import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { handleSetOptions } from "../features/order/ordersSlice"
import { getProviders } from "./firebaseconfig"

export const ProvidersData = () => {
    const [providers, setProviders] = useState([])
    useEffect(() => { getProviders(setProviders) }, [])
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