import React from 'react'
import { db } from '../firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Fetches a client from the database by ID to check if they exist.
 * 
 * @param {string} clientId - The ID of the client to fetch.
 * @param {function} fetchByIdFunction - Function to fetch the client by ID from the database.
 * @returns {Promise<object|null>} Returns the client object if found, or null if not found.
 */
export async function fbGetClient(user, clientId) {
    try {
        const clientRef = doc(db, 'businesses', user.businessID, 'clients', clientId)
        const clientSnapshot = await getDoc(clientRef);
        const clientExist = clientSnapshot.exists();
        if (clientExist) {
            return clientSnapshot.data().client;
        } else {
            return null;
        };
    } catch (error) {
        console.error('Error fetching the client:', error);
        throw error;  // Rethrowing the error for the caller to handle it appropriately
    }
}