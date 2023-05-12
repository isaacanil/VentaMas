import { useSelector } from "react-redux"
import { selectUser } from "../../features/auth/userSlice"
const handleNoData = (user) => {
    if (!user || !user?.businessID) {
        console.log("No business ID found. Please contact support."); //TODO: replace with toast
        return () => { return };
    }
}
export const getUser = (fn) => {
    const user = useSelector(selectUser)
    return { user, handleNoData: handleNoData(user) };
}