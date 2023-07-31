import { doc, updateDoc } from 'firebase/firestore';
import React from 'react'
import { db } from '../firebaseconfig';

export const fbUpdateProductOutflow = (user, item) => {
    if (!user?.businessID) return
    item = {
        ...item,
        productList: item.productList.map((item) => {
            const copy = {
                ...item,
                currentRemovedQuantity: 0,
            }
            return copy
        })
    }
    const productOutflowRef = doc(db,"businesses", user.businessID,  "productOutflow", item.id);
    try {
        updateDoc(productOutflowRef, item)
    } catch (error) {
        console.log("Lo sentimos Ocurrió un error: ", error)
    }
}

// export const fbUpdateProductOutflow = (item) => {
//     const productOutflowRef = doc(db, "productOutflow", item.id);
//     try {
//         updateDoc(productOutflowRef, item)
//     } catch (error) {
//         console.log("Lo sentimos Ocurrió un error: ", error)
//     }
// }