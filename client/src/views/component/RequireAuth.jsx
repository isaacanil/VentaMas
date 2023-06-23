
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectUser } from '../../features/auth/userSlice'
import { inspectUserAccess } from "../../hooks/abilities/useAbilities";
import { Home } from "../pages/Home/Home";

export const RequireAuth = ({ children}) => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const sessionToken = localStorage.getItem('sessionToken'); 
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true }); // Redirige al usuario a la ruta principal si no está autenticado
        } else {
            children
        }
    }, [user]);

    // Si el usuario está autenticado y tiene los permisos necesarios, renderiza los children. En caso contrario, no renderiza nada.
    return (user && children);
};
