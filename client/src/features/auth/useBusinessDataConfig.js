import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "./userSlice"
import { useEffect, useState } from "react"
import { fbGetBusinessInfo } from "../../firebase/businessInfo/fbGetBusinessInfo"
import { setBusiness } from "./businessSlice"

export const useBusinessDataConfig = () => {
    const user = useSelector(selectUser)
    const [businessDataStatus, setBusinessDataStatus] = useState(false)
    const [businessData, setBusinessData] = useState()
    const dispatch = useDispatch()
    useEffect(() => {
        fbGetBusinessInfo(setBusinessData, user)
    }, [user])

    useEffect(() => {
        if (businessData && !businessDataStatus) {
            console.log(businessData)
            dispatch(setBusiness(businessData))
            setBusinessDataStatus(true)
        }
    }, [businessData])
}
