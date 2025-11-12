
import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { selectUser } from '../../features/auth/userSlice'

export const RequireAuth = ({ children}) => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
   
    useEffect(() => {
        if (user === null) {
            navigate('/', { replace: true }); 
        } 
    }, [user]);

    return user ? children : null;
};
