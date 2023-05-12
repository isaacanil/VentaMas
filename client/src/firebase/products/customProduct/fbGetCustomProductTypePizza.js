import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../../firebaseconfig"

export const fbGetCustomProduct = async (user, setProduct) => {
  if(!user && user?.businessID){return}
  const customProductRef = doc(db, "businesses", user.businessID, "products", "6dssod")
  onSnapshot(customProductRef, (snapshot) => {
    const data = snapshot.data()
    setProduct(data)
  })
}
