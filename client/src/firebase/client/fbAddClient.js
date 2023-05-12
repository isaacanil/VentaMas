
export const fbAddClient = async (client) => {
    console.log(client)
    try {
        const clientRef = doc(db, 'client', client.id)
        await setDoc(clientRef, { client })
    } catch (error) {
        console.error("Error adding document: ", error)
    }
}

