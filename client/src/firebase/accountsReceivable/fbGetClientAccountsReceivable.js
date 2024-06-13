import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import React from 'react'
import { db } from '../firebaseconfig'

export const fbGetClientAccountsReceivable = ({ user, clientId, onUpdate }) => {
    if (!user?.businessID) {
        return
    }
    const accountsReceivableRef = collection(db, "businesses", user?.businessID, "accountsReceivable")
    const q = query(accountsReceivableRef, where("clientId", "==", clientId))
    const unSnapshot = onSnapshot(q, (snapshot) => {
        const accountsReceivable = snapshot.docs.map((doc) => doc.data())
        if (onUpdate) {
            onUpdate(accountsReceivable)
        }

    },
        (error) => {
            console.error("Error al obtener las cuentas por cobrar: ", error);
        }

    )
    return unSnapshot
}
