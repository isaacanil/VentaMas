export const fbUpdateClient = async (client) => {
    console.log('product from firebase', client)
    const clientRef = doc(db, 'client', client.id)
    await updateDoc(clientRef, { client })
        .then(() => { console.log('product from firebase', client) })
}