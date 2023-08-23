import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "./userSlice"
import { useEffect } from "react"
import { fbGetBusinessInfo } from "../../firebase/businessInfo/fbGetBusinessInfo"

export const useBusinessDataConfig = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    useEffect(() => {
        if (!user || !user?.businessID) return;
        fbGetBusinessInfo(user, dispatch)

    }, [user])
}
