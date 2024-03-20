import { Timestamp, doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { fbUpdateStock } from "./fbUpdateStock"
import { nanoid } from "nanoid"

export const fbAddProductOutFlow =  async (user, productOutflow) => {
    
    if (!user?.businessID || !user?.uid ) {
        console.error("Información requerida para la operación faltante o inválida");
        return;
    }

    console.log(productOutflow, user.uid)
    
    const updates = productOutflow.productList.map(product => ({
        product: product.product,
        quantityRemoved: -product.quantityRemoved // Asume que quieres decrementar el stock
    }));

    const productOutflowData = {
        ...productOutflow,
        id: nanoid(10),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isDeleted: false,
    }
    console.log(productOutflowData)
    const productOutFlowRef = doc(db, "businesses", user.businessID, 'productOutflow', productOutflowData.id)

    try {
        await setDoc(productOutFlowRef, productOutflowData)
    
        await fbUpdateStock(user, updates);
    } catch (error) {
        console.error("Error en fbAddProductOutFlow:", error);
    }
}