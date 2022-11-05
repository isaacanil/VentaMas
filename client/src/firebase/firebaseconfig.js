// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//TODO ***AUTH**************************************
import { getAuth, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
//TODO ***FIRESTORE***********************************
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where, enableIndexedDbPersistence, arrayUnion, arrayRemove, increment, Timestamp } from "firebase/firestore";
//TODO ***STORAGE***********************************
import { getDownloadURL, getStorage, ref, uploadBytes, uploadBytesResumable } from "firebase/storage"

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { v4 } from 'uuid'
import { useDispatch } from "react-redux";
import { login, logout } from "../features/auth/userSlice";
import { useNavigate } from "react-router-dom";


//Todo Hi Pizza **************************************************
// const firebaseConfig = {
//   apiKey: "AIzaSyAIG5W8rtGwTQ2hxVK7XpSxU3iQBRvHaT4",
//   authDomain: "hipizza-1b9cc.firebaseapp.com",
//   projectId: "hipizza-1b9cc",
//   storageBucket: "hipizza-1b9cc.appspot.com",
//   messagingSenderId: "626612970714",
//   appId: "1:626612970714:web:8747469a390b7bb63271e3",
//   measurementId: "G-21YPCHBYHV"
// };
//Todo Original**************************************************
const firebaseConfig = {
  apiKey: "AIzaSyAJd82BkS5bp3lI5MbTJohU8rhZth3_AL4",
  authDomain: "ventamax-75bec.firebaseapp.com",
  projectId: "ventamax-75bec",
  storageBucket: "ventamax-75bec.appspot.com",
  messagingSenderId: "653993214585",
  appId: "1:653993214585:web:f2e6674640557a28220aa8",
  measurementId: "G-9RTQMM0JW2"
};
//Todo Initialize Firebase *******************************************************************
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app)

// enableIndexedDbPersistence(db)
//   .catch((err) => {
//     if (err.code == 'failed-precondition') {
//       // Multiple tabs open, persistence can only be enabled
//       // in one tab at a a time.
//       // ...
//     } else if (err.code == 'unimplemented') {
//       // The current browser does not support all of the
//       // features required to enable persistence
//       // ...
//     }
//   });
//Todo Product **************************************************************************
export const AuthStateChanged = (dispatch) => {

  onAuthStateChanged(auth, (userAuth) => {
    if (userAuth) {
      const { email, uid, displayName } = userAuth
      dispatch(
        login({
          email,
          uid,
          displayName,
        })

      );
    } else { dispatch(logout()) }
  })
}
export const HandleRegister = (name, email, pass, confirmPass) => {
  const Navigate = useNavigate();
  if (pass === confirmPass) {
    createUserWithEmailAndPassword(auth, email, pass)
      .then(userAuth => {
        updateProfile(userAuth.user, {
          displayName: name,
        }).catch(error => console.log('user not updated'));
      }).catch(err => alert(err));
    Navigate('/login');
  }

}
export const loginToApp = (email, password) => {
  // Sign in an existing user with Firebase
  const Navigate = useNavigate()
  const dispatch = useDispatch()
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredencial) => {
      const user = userCredencial.user
      dispatch(login({
        email: user.email,
        uid: user.uid,
        displayName: user.displayName
      }))
      Navigate('/app/')
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage)
    })
  // returns  an auth object after a successful authentication
  // userAuth.user contains all our user details

};
export const watchingUserState = (setUserDisplayName) => {
  onAuthStateChanged(auth, (userAuth) => {
    if (userAuth) {
      userAuth
      setUserDisplayName(userAuth)
    }
  })
}
/****************** **********************/
export const UploadProdImg = (file) => {
  const today = new Date();
  const hour = `${today.getHours()}:${today.getMinutes()}`
  const storageRef = ref(storage, `products/${v4()}.jpg`)

  return new Promise((resolve, reject) => {
    uploadBytes(storageRef, file)
      .then((snapshot) => {
        getDownloadURL(storageRef)
          .then((url) => {
            console.log('File available at', url);  
            resolve(url);
          });
      })
  })
}
export const UploadProdData = async (product) => {
    console.log(product) 
  const productRef = doc(db, "products", product.id)
    try {
      await setDoc(productRef, {product})
      const s = 'impedimentos'
      console.log('Document written ', product)
    } catch (error) {
      console.error("Error adding document: ", error)
    }
}
/****************** **********************/
export const getProducts = async (setProduct) => {
  const productRef = collection(db, "products")
  const q = query(productRef, orderBy("product.productName", "desc"), limit(25))
  onSnapshot(q, (snapshot) => {
    let productsArray = snapshot.docs.map(item => item.data())
    setProduct(productsArray)
  })
}
export const updateProduct = async (product) => {
  console.log('product from firebase', product)
  const productRef = doc(db, "products", product.id)
  await updateDoc(productRef, {product})
}
export const getCat = async (setCategories) => {
  const categoriesRef = collection(db, "categorys")
  onSnapshot(categoriesRef, (snapshot) => {
    let categoriesArray = snapshot.docs.map(item => item.data())
    setCategories(categoriesArray)
  })
}
export const getProduct = async (id) => {
  getDoc(doc(db, 'products', id))
}
export const getTaxes = async (setTaxe) => {
  const taxeRef = collection(db, "taxes")
  const { docs } = await getDocs(taxeRef)
  const taxeArray = docs.map(item => item.data())
  setTaxe(taxeArray)
}
export const getClients = async (setClients) => {
  const clientRef = collection(db, "client")
  onSnapshot(clientRef, (snapshot) => {
    let clientArray = snapshot.docs.map(item => item.data())
    setClients(clientArray)
  })
}
export const addIngredientTypePizza = async (ingredient) => {
  const IngredientRef = doc(db, "products", "6dssod");
  // Atomically add a new region to the "regions" array field.
  try {
    await updateDoc(IngredientRef, {
      ingredientList: arrayUnion(ingredient)
    });
  } catch (error) {
    console.log("Lo sentimos Ocurrió un error:", error)
  }

}
export const deleteIngredientTypePizza = async (ingredient) => {
  const IngredientRef = doc(db, "products", "6dssod");
  try {
    await updateDoc(IngredientRef, {
      ingredientList: arrayRemove(ingredient)
    });
  } catch (error) {
    console.log("Lo sentimos Ocurrió un error: ", error)
  }
}
export const getCustomProduct = async (setProduct) => {
  const customProductRef = doc(db, "products", "6dssod")
  onSnapshot(customProductRef, (snapshot) => {
    const data = snapshot.data()
    setProduct(data)
  })
}
export const UploadCat = async (path, category, id) => {
  await setDoc(doc(db, `${path}`, id), {
    category
  });
}
export const deleteProduct = (id) => {
  deleteDoc(doc(db, `products`, id))
}
export const getBills = async (setBills, setClient) => {
  const Ref = collection(db, `bills`);
  const q = query(Ref, orderBy("data.date"));
  const { docs } = await getDocs(q);
  const arrayBills = docs.map(item => item.data())
  const clientData = () => {
    arrayBills.map(async (item) => {
      const clientid = item.data['client']
      const clientRef = doc(db, `clients`, clientid)
      const clientDoc = await getDoc(clientRef)
      return clientDoc.exists() ? clientDoc : null

      //const clientDoc = await getDoc(clientRef)
    })
  }

  setClient(clientData())
  setBills(arrayBills)

  //setBills(DataArray);
}
export const AddBills = (data) => {

  const clientRef = doc(db, "client", "4O-0")
  const billsRef = doc(db, "bills", data.id)
  try {
    setDoc((billsRef), {
      data: {
        ...data,
        date: new Date(),

      }
    });
  } catch (error) {
    console.log(error)
  }

}
export const QueryByCategory = async (setProductArray, categoryArrayData, categoryStatus) => {

  const productsRef = collection(db, "products")
  const q = query(productsRef, where("product.category", "in", categoryArrayData));
  const { docs } = await getDocs(q);
  const array = docs.map((doc) => doc.data());

  if (categoryStatus) {
    setProductArray(array);
  }

}
export const QueryByType = async (setProducts, type, size) => {
  const productsRef = collection(db, "products")

  const q = query(productsRef, where("product.type", "==", type), where("product.size", "==", size))

  const { docs } = await getDocs(q);
  const array = docs.map((item) => item.data());
  console.log(array)
  setProducts(array)

}