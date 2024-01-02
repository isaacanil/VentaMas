import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseconfig";
import { isFirebaseStorageUrl } from "../../../utils/url/isValidUrl";
import { fbDeleteImage } from "../../img/fbDeleteImage";
import { fbUploadFileAndGetURL } from "../../img/fbUploadFileAndGetURL";
import { isImageFile } from "../../../utils/file/isValidFile";


// Función que se encarga de actualizar un gasto.
export const fbUpdateExpense = async (user, setLoading, expense, img) => {
    try {
        setLoading({
            isOpen: true,
            message: "Iniciando actualización del gasto..."
        });
        // Verifica que el usuario tenga un ID de negocio.
        if (!user.businessID) {
            throw new Error("No businessID provided");
        }
     
        // Construye el objeto de gasto modificado. Las fechas se convierten al formato Timestamp de Firebase.
        let modifiedExpense = {
            ...expense,
            dates: {
                ...expense.dates,
                expenseDate: Timestamp.fromMillis(expense.dates.expenseDate),
                createdAt: Timestamp.fromMillis(expense.dates.createdAt),
            },
        }

        // Si img es un archivo de imagen válido...
        if (isImageFile(img)) {
            setLoading({
                isOpen: true,
                message: "Procesando imagen..."
            });
            if (isFirebaseStorageUrl(expense.receiptImageUrl)) {
                // Elimina la imagen antigua.
                setLoading({
                    isOpen: true,
                    message: "Eliminando imagen anterior..."
                });
                await fbDeleteImage(expense.receiptImageUrl);
                console.log("Deleted old image-----------------");
            }
            // Carga la nueva imagen y actualiza la URL de la imagen en el gasto modificado.
            setLoading({
                isOpen: true,
                message: "Cargando nueva imagen..."
            });
            const url = await fbUploadFileAndGetURL(user, 'expensesReceiptImg', img);
            modifiedExpense.receiptImageUrl = url;
            console.log("Uploaded new image-----------------------");
        }

        // Si img es una cadena vacía...
        if (img === "") {
            // Establece la URL de la imagen en el gasto modificado como una cadena vacía.
            modifiedExpense.receiptImageUrl = "";
            // Si el gasto actual tiene una URL de imagen en Firebase Storage...
            if (isFirebaseStorageUrl(expense.receiptImageUrl)) {
                // Elimina la imagen antigua.
                await fbDeleteImage(expense.receiptImageUrl);
                console.log("Deleted old image-----------------");
            }
        }
    
        setLoading({
            isOpen: true,
            message: "Actualizando gasto..."
        });

        // Obtiene la referencia del gasto en Firebase y actualiza el gasto con el gasto modificado.
        const expenseRef = doc(db, 'businesses', user.businessID, 'expenses', expense.id);
        await updateDoc(expenseRef, { expense: modifiedExpense });

        setLoading({
            isOpen: false,
            message: ""
        });

    } catch (error) {
        // Si ocurre algún error, lo arroja para que pueda ser manejado por la función que llama a fbUpdateExpense.
        throw new Error("Error updating expense: " + error);
    }
}


