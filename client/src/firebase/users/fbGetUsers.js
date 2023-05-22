import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbGetUsers = async  (setUser, user ) => {
    console.log('fbGetUsers-----1', user)
    if(!user || !user?.businessID){return}
    console.log('fbGetUsers-----2')
    const businessID = user.businessID
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("user.businessID", "==", businessID))
    onSnapshot(q, (snapshot)=>{
        const usersArray = snapshot.docs.map((doc) =>  doc.data())
        setUser(usersArray)
    })
}