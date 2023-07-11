export const fbDeleteClient = async (id) => {
    console.log(id)
    const counterRef = doc(db, "businesses", id)
    try {
        await deleteDoc(counterRef)
        //deleteDoc(doc(db, `products`, id))
        console.log(id)
    } catch (error) {
        console.log(error)
    }
}
 
export const deleteMultipleClients = (array) => {
    array.forEach((id) => {
        deleteClient(id)
    })
}