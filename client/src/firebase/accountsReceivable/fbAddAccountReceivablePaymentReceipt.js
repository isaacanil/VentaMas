import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { nanoid } from 'nanoid';
import React from 'react'
import { db } from '../firebaseconfig';
import { fbGetClient } from '../client/fbGetClient';

export async function fbAddAccountReceivablePaymentReceipt({user, clientId, paymentReceipt}) {

    const client = await fbGetClient(user, clientId);

    const receipt = {
        id: nanoid(),
        client,
        user: {
            id: user.uid,   
            displayName: user.displayName,
        },
        createdBy: user.uid,
        updatedBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...paymentReceipt,
    }
    console.log('user: ', user)
    const paymentReceiptRef = doc(db, 'businesses', user.businessID, 'accountsReceivablePaymentReceipt', receipt.id);
    await setDoc(paymentReceiptRef, receipt);
    return receipt;

}
