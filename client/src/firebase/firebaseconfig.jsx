// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//TODO ***AUTH**************************************
import { getAuth, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
//TODO ***FIRESTORE***********************************
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where, enableIndexedDbPersistence, arrayUnion, arrayRemove, increment, Timestamp, Firestore } from "firebase/firestore";
//TODO ***STORAGE***********************************
import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytes, uploadBytesResumable } from "firebase/storage"

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { v4 } from 'uuid'
import { useDispatch, useSelector } from "react-redux";
import { login, logout, selectUser } from "../features/auth/userSlice";
import { useNavigate } from "react-router-dom";
import { orderAndDataState, selectItemByName } from "../constants/orderAndPurchaseState";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app)

enableIndexedDbPersistence(db)
  .then(() => {
    console.log("La persistencia de datos IndexedDB está habilitada");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.error("Probablemente múltiples pestañas abiertas a la vez.");
    } else if (err.code === 'unimplemented') {
      console.error("El navegador actual no admite todas las características necesarias.");
    }
  });





export const AuthStateChanged = () => {
  const dispatch = useDispatch()
  const handleLogin = (userAuth) => {
    const { email, uid, displayName } = userAuth;
    dispatch(
      login({
        email,
        uid,
        displayName,
      })
    );
  };

  const handleLogout = () => { dispatch(logout()); };

  const AuthStateChangedLogic = () => {
    onAuthStateChanged(auth, (userAuth) => {
      if (userAuth) {
        setTimeout(() => {
          handleLogin(userAuth);
        }, 1000);
      } else {
        const sessionToken = localStorage.getItem('sessionToken');
        if (sessionToken) {
          return;
        } else {
          handleLogout();
        }
      }
    })
  }
  useEffect(() => {
    AuthStateChangedLogic()
  }, [])
}
export const HandleRegister = (name, email, pass, confirmPass, Navigate) => {
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

export const fbAddImgReceiptData = async (id, url) => {
  const imgRef = doc(db, "receiptImages", id);
  try {
    await setDoc(imgRef, {
      id: id,
      url: url
    });
  } catch (error) {
    console.log(error)
  }
}
export const fbDeletePurchaseReceiptImg = async (data) => {
  const { url } = data
  try {
    if (url) { await deleteImgFromUrl(url) }
    console.log(url)
  } catch (error) {
    console.log(error)
  }
}



const fbAddReceiptPurchaseImg = (file) => {
  const today = new Date();
  const hour = `${today.getHours()}:${today.getMinutes()}`
  const storageRef = ref(storage, `receiptPurchaseImg/${v4()}.jpg`)
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

export const getProduct = async (id) => {
  getDoc(doc(db, 'products', id))
}

export const getTaxes = async (setTaxes) => {
  const taxesRef = collection(db, "taxes")
  const { docs } = await getDocs(taxesRef)
  const taxesArray = docs.map(item => item.data())
  if (taxesArray.length === 0) return;
  if (taxesArray.length > 0) return setTaxes(taxesArray)
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

export const deleteProduct = (id, user) => {
  console.log({ id, user })
  if (!user || !user?.businessID) { return }
  deleteDoc(doc(db, "businesses", user.businessID, `products`, id))
}


export const AddOrder = async (user, value) => {
  if (!user || !user.businessID) return;
  const providerRef = doc(db, "businesses", user.businessID, 'providers', value.provider.id);
  let data = {
    ...value,
    id: nanoid(6),
    createdAt: Date.now(),
    provider: providerRef,
    state: selectItemByName(orderAndDataState, 'Solicitado')
  }
  const OrderRef = doc(db, "businesses", user.businessID, "orders", data.id)
  console.log(data)
  try {
    await setDoc(OrderRef, { data })
    console.log('Document written ', data)
  } catch (error) {
    console.error("Error adding document: ", error)
  }

}
const UpdateProducts = async (products) => {
  try {
    products.forEach((productData) => {
      productData = productData.product
      const productRef = doc(db, 'products', productData.id)
      const updatedStock = productData.stock.newStock + productData.stock.actualStock
      productData = { ...productData, stock: updatedStock }
      const product = productData

      updateDoc(productRef, { product })
    })
  } catch (error) {
    console.log(error)
  }
}
const UpdateOrder = async (order) => {
  const orderRef = doc(db, 'orders', order.id)
  const providerRef = doc(db, 'providers', order.provider.id)
  const newChange = { data: { ...order, state: selectItemByName(orderAndDataState, 'Entregado'), provider: providerRef } }
  try {
    updateDoc(orderRef, newChange)
  } catch (error) { console.log(error) }
}
export const PassDataToPurchaseList = async (user, data) => {
  if (!user || !user.businessID) return;
  const providerRef = doc(db, 'businesses', user.businessID, 'providers', data.provider.id)
  const purchaseRef = doc(db, 'businesses', user.businessID, 'purchases', data.id)
  await UpdateProducts(data.products)
  await UpdateOrder(data)
  try {
    await setDoc(purchaseRef, {
      data: {
        ...data,
        provider: providerRef,
        state: selectItemByName(orderAndDataState, 'Entregado')
      }
    })
  } catch (error) {
    console.error("Error adding purchase: ", error)
  }
}
export const getPurchaseFromDB = async (user, setPurchases) => {
  if (!user || !user.businessID) return;
  const purchasesRef = collection(db, 'businesses', user?.businessID, 'purchases')
  onSnapshot(purchasesRef, (snapshot) => {
    let purchaseArray = snapshot.docs.map(async (item) => {
      let purchaseData = item.data();
      let providerRef = purchaseData.data.provider;
      let providerDoc = (await getDoc(providerRef)).data();
      if (providerDoc) { // Asegúrate de que providerDoc esté definido
        purchaseData.data.provider = providerDoc.provider;
      } else {
        console.log('providerRef no se pudo obtener:', providerRef);
      }
      return purchaseData
    })
    Promise.all(purchaseArray).then((result) => {
      setPurchases(result)
    }).catch((error) => {
      console.log(error)
    });
  })
}
export const deletePurchase = async (id) => {
  deleteDoc(doc(db, 'purchases', id))
}


export const deleteOrderFromDB = async (id) => {
  deleteDoc(doc(db, `orders`, id))
}

export const getUsers = (setUsers) => {
  const usersRef = collection(db, "users")
  onSnapshot(usersRef, (snapshot) => {
    let usersArray = snapshot.docs.map(async (item) => {
      let userData = item.data()
      let rolRef = userData.user.rol
      let rolDoc = (await getDoc(rolRef)).data()
      userData.user.rol = rolDoc.rol
      return userData
    })
    Promise.all(usersArray).then(result => {
      setUsers(result)
    }).catch(error => {
      console.log(error)
    });
    // setUsers(usersArray)
  })
}
export const createUser = (rolType) => {
  let rolRef = null
  if (rolType === 'admin') {
    rolRef = doc(db, 'roles', 'bVCX7NQPccNlCbGHdpF1')
  }
  if (rolType === 'readOnly') {
    rolRef = doc(db, 'roles', 'IEqNtudsdN5UxaXppKr5')
  }

  if (rolRef !== null) {

    const user = {
      id: nanoid(12),
      name: 'jorge',
      rol: rolRef
    }
    const userRef = doc(db, 'users', user.id)
    setDoc(userRef, { user })
  }
}