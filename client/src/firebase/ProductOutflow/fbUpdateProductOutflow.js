import { doc, updateDoc } from 'firebase/firestore';
import React from 'react'
import { db } from '../firebaseconfig';

export const fbUpdateProductOutflow = (item) => {
    item = {
        ...item,
        productList: item.productList.map((item) => {
            const copy = {
                ...item,
                currentRemovedQuantity: 0,
                totalRemovedQuantity: item.currentRemovedQuantity + item.totalRemovedQuantity,
            }
            return copy
        })
    }
    const productOutflowRef = doc(db, "productOutflow", item.id);
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