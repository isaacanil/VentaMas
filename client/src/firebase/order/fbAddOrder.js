import { Timestamp, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";

async function getNextID(user, name) {
    // Referencia al documento en la ubicación configurada por el nombre
    if (!user || !user.businessID) return;
    const counterRef = doc(db, "businesses", user.businessID, 'metadata', name);

    // Obtener el documento
    const counterSnap = await getDoc(counterRef);

    let nextID = 1;
    if (counterSnap.exists()) {
        // Si el documento existe, incrementar el valor
        nextID = counterSnap.data().currentID + 1;
        await updateDoc(counterRef, { currentID: nextID }); // Usar updateDoc ya que no estamos en una transacción
    } else {
        // Si el documento no existe, crearlo con el valor inicial
        await setDoc(counterRef, { currentID: nextID }); // Usar setDoc ya que no estamos en una transacción
    }
    return nextID;
}

export const fbAddOrder = async (user, value) => {
    if (!user || !user.businessID) return;
    const nextID = await getNextID(user, 'lastOrdersId');
    const providerRef = doc(db, "businesses", user.businessID, 'providers', value.provider.id);
    let data = {
        ...value,
        orderId: nanoid(12),
        id: nextID,
        dates: {
            ...value.dates,
            deliveryDate: Timestamp.fromMillis(value.dates.deliveryDate),
            createdAt: Timestamp.now(),
        },
        provider: providerRef,
        state: 'state_2'
    }
    const OrderRef = doc(db, "businesses", user.businessID, "orders", data.orderId)
    console.log(data)
    try {
        await setDoc(OrderRef, { data })
        console.log('Document written ', data)
    } catch (error) {
        console.error("Error adding document: ", error)
    }
}