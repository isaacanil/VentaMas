
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectUser } from '../../features/auth/userSlice'

export const RequireAuth = ({ children }) => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true }); // Redirige al usuario a la ruta principal
        }
    }, [user, navigate]);

    return user ? children : null;
};