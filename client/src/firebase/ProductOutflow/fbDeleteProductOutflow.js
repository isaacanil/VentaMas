import { deleteDoc, doc } from 'firebase/firestore'
import React from 'react'
import { db } from '../firebaseconfig'

export const fbDeleteProductOutflow = async (user, id) => {
    //función para eliminar un doc de firestore v9 (firebase 9)
    const docRef = doc(db, "businesses", user.businessID, "productOutflow", id)
    try {
        await deleteDoc(docRef)
        console.log("doc eliminado")
    } catch (error) {
        console.log(error)
    }
}
