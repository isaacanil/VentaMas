import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { handleSetOptions } from "../features/order/ordersSlice"
import { useFbGetProviders } from "./provider/useFbGetProvider"
import { selectUser } from "../features/auth/userSlice"

export const ProvidersData = () => {
  
    const user = useSelector(selectUser)
 const {providers} = useFbGetProviders(user)
    return providers
}

export const SetProvidersInFilterOptionsMenu = (providers) => {
    const dispatch = useDispatch()
    useEffect(() => {
        if (providers?.length > 0) {
            dispatch(handleSetOptions({ optionsID: 'Proveedores', datas: providers, propertyName: 'provider' }))
        }
    }, [providers])
}