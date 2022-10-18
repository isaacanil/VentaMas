
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectUser } from '../../features/auth/userSlice'

export const RequireAuth = ({ children }) => {
    const user = useSelector(selectUser)
    const Navigate = useNavigate()
    useEffect(() => {
        if (user === null) {
            Navigate('/')
        }      
    }, [user])
    return children
}