import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { selectUser } from "../../features/auth/userSlice";
import { useSelector } from "react-redux";
import { useEffect } from "react";

export const fbGetBillingSettings = async (user) => {
   
        if(!user?.businessID){
            throw new Error('El ID del negocio no está disponible.');
        }
        const userDocRef = doc(db, 'businesses', user.businessID, "settings", "billing");
        const docSnapshot = await getDoc(userDocRef);
        if(docSnapshot.exists()){
            return docSnapshot.data();
        }else{
            throw new Error('La configuración de facturación no existe.');
        }   
}

export const useGetBillingSettings = () => {
    const user = useSelector(selectUser);

    return useQuery({
        queryKey: ['billingSettings', user?.businessID],
        queryFn: () => fbGetBillingSettings(user),
        enabled: !!user?.businessID, // Solo ejecutar si businessID está disponible
        retry: 2, // Reintentar en caso de fallo
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000 // 10 minutos
    });
}

export default useGetBillingSettings;