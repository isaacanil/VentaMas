import { useSelector } from "react-redux";
import { selectUser } from "../../../features/auth/userSlice";
import { collection, doc, onSnapshot, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { nanoid } from "nanoid";

// Hook para escuchar los ingredientes activos
export const useListenActiveIngredients = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const user = useSelector(selectUser);

    useEffect(() => {
        let unsubscribe;
        const fetchData = async () => {
            try {
                if (!user) return;
                setLoading(true);
                unsubscribe = await listenActiveIngredients(user, setData);
                setLoading(false);
            } catch (error) {
                setError(error);
            }
        };

        fetchData();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    return { data, loading, error };
}

const listenActiveIngredients = async (user, setData) => {
    const query = collection(db, `businesses/${user.businessID}/activeIngredients`);
    const unsubscribe = onSnapshot(query, (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());
        setData(data);
    });

    return unsubscribe;
}

// Función para agregar un ingrediente activo
export const fbAddActiveIngredient = async (user, data) => {
    try {
        const newData = {
            ...data,
            id: nanoid(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }
        // Uso de 'doc' en lugar de 'collection'
        const activeIngredientRef = doc(db, `businesses/${user.businessID}/activeIngredients/${newData.id}`);
        await setDoc(activeIngredientRef, newData);
        console.log("Ingrediente activo añadido con éxito:", newData.id);

    } catch (error) {
        console.error("Error al agregar el ingrediente activo:", error);
    }
}

// Función para actualizar un ingrediente activo
export const fbUpdateActiveIngredient = async (user, data) => {
    try {
        // Uso de 'doc' en lugar de 'collection'
        const activeIngredientRef = doc(db, `businesses/${user.businessID}/activeIngredients/${data.id}`);
        await updateDoc(activeIngredientRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
        console.log("Ingrediente activo actualizado:", data.id);
    } catch (error) {
        console.error("Error al actualizar el ingrediente activo:", error);
    }
}
