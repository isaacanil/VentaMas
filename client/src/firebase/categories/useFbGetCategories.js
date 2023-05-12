import { useSelector } from "react-redux"
import { selectUser } from "../../features/auth/userSlice"
import { useEffect, useState } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const useFbGetCategories = () => {
    const [categories, setCategories] = useState([])
    const user = useSelector(selectUser)
  
    const categoriesRef = collection(db, "businesses", String(user?.businessID), "categories")
    const q = query(categoriesRef, orderBy("category.name", "desc"))
  
    useEffect(() => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let categoriesArray = snapshot.docs.map(item => item.data())
        setCategories(categoriesArray)
      })
      return () => { unsubscribe() }
    }, [user?.businessID])
    return { categories }
  }