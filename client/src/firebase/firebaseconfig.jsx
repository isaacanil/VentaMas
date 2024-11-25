// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

//TODO ***AUTH**************************************
import { getAuth, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
//TODO ***FIRESTORE***********************************
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where, enableIndexedDbPersistence, arrayUnion, arrayRemove, increment, Timestamp, Firestore, runTransaction, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";
//TODO ***STORAGE***********************************
import { getStorage, } from "firebase/storage"

import { useEffect } from "react";
import { nanoid } from "nanoid";
import { useDispatch } from "react-redux";
import { login, logout } from "../features/auth/userSlice";
import { useNavigate } from "react-router-dom";
import { fbGetDocFromReference } from "./provider/fbGetProviderFromReference";
// import { getVertexAI, getGenerativeModel } from "firebase/";

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
export const auth = getAuth(app)

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
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
        })
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
  }
}
export const fbDeletePurchaseReceiptImg = async (data) => {
  const { url } = data
  try {
    if (url) { await deleteImgFromUrl(url) }
  } catch (error) {
  }
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
  }

}
export const deleteIngredientTypePizza = async (ingredient) => {
  const IngredientRef = doc(db, "products", "6dssod");
  try {
    await updateDoc(IngredientRef, {
      ingredientList: arrayRemove(ingredient)
    });
  } catch (error) {
  }
}


async function getNextID(user, name) {
  // Referencia al documento en la ubicación configurada por el nombre
  if (!user || !user.businessID) return;
  const counterRef = doc(db, "businesses", user.businessID, 'metadata', name);

  // Obtener el documento
  const counterSnap = await getDoc(counterRef);

  let nextID = 1;
  if (counterSnap.exists()) {
    // Si el documento existe, incrementar el valor
    nextID = counterSnap.data().currentID + 1;
    await updateDoc(counterRef, { currentID: nextID }); // Usar updateDoc ya que no estamos en una transacción
  } else {
    // Si el documento no existe, crearlo con el valor inicial
    await setDoc(counterRef, { currentID: nextID }); // Usar setDoc ya que no estamos en una transacción
  }
  return nextID;
}

export const AddOrder = async (user, value) => {
  if (!user || !user.businessID) return;
  const nextID = await getNextID(user, 'lastOrdersId');
  const providerRef = doc(db, "businesses", user.businessID, 'providers', value.provider.id);
  let data = {
    ...value,
    orderId: nanoid(12),
    id: nextID,
    dates: {
      ...value.dates,
      createdAt: Timestamp.now(),
    },
    provider: providerRef,
    state: 'state_2'
  }
  const OrderRef = doc(db, "businesses", user.businessID, "orders", data.orderId)
  try {
    await setDoc(OrderRef, { data })
  } catch (error) {
  }

}

export const getPurchaseFromDB = async (user, setPurchases) => {
  if (!user || !user.businessID) return;
  const purchasesRef = collection(db, 'businesses', user?.businessID, 'purchases')
  onSnapshot(purchasesRef, async (snapshot) => {
    const purchasePromises = snapshot.docs
      .map((item) => item.data())
      .sort((a, b) => a.data.id - b.data.id)
      .map(async (item) => {
        let purchaseData = item;
        const providerDoc = await fbGetDocFromReference(purchaseData.data.provider)

        if (providerDoc) { // Asegúrate de que providerDoc esté definido
          purchaseData.data.provider = providerDoc.provider;
        }
        if (purchaseData.data.dates.createdAt) {
          purchaseData.data.dates.createdAt = purchaseData.data.dates.createdAt.toDate().getTime()
        }
        if (purchaseData.data.dates.deliveryDate) {
          purchaseData.data.dates.deliveryDate = purchaseData.data.dates.deliveryDate.toDate().getTime()
        }
        if (purchaseData.data.dates.paymentDate) {
          purchaseData.data.dates.paymentDate = purchaseData.data.dates.paymentDate.toDate().getTime()
        }
        if (purchaseData.data.dates.updatedAt) {
          purchaseData.data.dates.updatedAt = purchaseData.data.dates.updatedAt.toDate().getTime()
        }
        return purchaseData;
      })

    const purchaseArray = await Promise.all(purchasePromises);
    setPurchases(purchaseArray);
  })
}
export const deletePurchase = async (id) => {
  deleteDoc(doc(db, 'purchases', id))
}

export const deleteOrderFromDB = async (user, id) => {
  if (!user || !user.businessID) return;
  const orderRef = doc(db, 'businesses', user.businessID, 'orders', id)
  'state_5'
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
    });
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