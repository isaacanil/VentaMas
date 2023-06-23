import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbGetUsers = async  (setUser, user ) => {
   
    if(!user || !user?.businessID){return}
  
    const businessID = user.businessID
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("user.businessID", "==", businessID))
    onSnapshot(q, (snapshot)=>{
        const usersArray = snapshot.docs.map((doc) =>  doc.data())
        setUser(usersArray)
    })
}