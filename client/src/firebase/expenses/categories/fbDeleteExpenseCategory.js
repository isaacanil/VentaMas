import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseconfig";

/**
 * Elimina una categoría de gastos en Firebase.
 *
 * @param {string} categoryId - El ID de la categoría que se desea eliminar.
 * @returns {Promise} - Retorna una promesa que indica si la operación fue exitosa o no.
 */
export const fbDeleteExpenseCategory = async (user, categoryId) => {

    if (!user || !user?.businessID) throw new Error('no se encontró el id del negocio');
    
    if (!categoryId) throw new Error('no se encontró el id de la categoría');

    const counterRef = doc(db, "businesses", user.businessID, "expensesCategories", categoryId);

    try {
        await deleteDoc(counterRef);

    } catch (err) {
        console.log(err);
        throw new Error(err);
    }

}