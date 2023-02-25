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
import { useDispatch } from "react-redux";
import { login, logout } from "../features/auth/userSlice";
import { useNavigate } from "react-router-dom";
import { orderAndDataState, selectItemByName } from "../constants/orderAndPurchaseState";
import { SaveImg, UploadImgLoading, UploadProgress } from "../features/uploadImg/uploadImageSlice";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app)





//Todo Product **************************************************************************
export const AuthStateChanged = (dispatch) => {
  onAuthStateChanged(auth, (userAuth) => {
    setTimeout(() => {
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
    }, 1000)
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
export const UploadProdImgData = async (id, url) => {
  const imgRef = doc(db, "prodImages", id);
  try {
    await setDoc(imgRef, {
      id: id,
      url: url

    });
  } catch (error) {
    console.log(error)
  }
}
export const deleteImgFromUrl = async (url) => {
  const fileRef = ref(storage, url)
  try {
      await deleteObject(fileRef)
      console.log(id)
  } catch (error) {
      console.log(error)
  }
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
  const {url} = data
  try {
    if(url){await deleteImgFromUrl(url)}
      console.log(url)
  } catch (error) {
      console.log(error)
  }
}
export const ProductsImg = (SetAllImg) => {
  const imageRef = collection(db, "prodImages");
  const q = query(imageRef);
  onSnapshot(q, (querySnapshot) => {
    const img = [];
    querySnapshot.forEach((doc) => {
      img.push(doc.data());
    });
    SetAllImg(img)
  });
}
export const createProvider = async (provider) => {
  console.log(provider)
  try {
    const providerRef = doc(db, 'providers', provider.id)
    await setDoc(providerRef, { provider })
  } catch (error) {
    console.error("Error adding document: ", error)
  }
}
export const updateProvider = async (provider) => {
  const providerRef = doc(db, 'providers', provider.id)
  await updateDoc(providerRef, { provider })
    .then(() => { console.log('product from firebase', provider) })
}
export const deleteProvider = async (id) => {
  const providerRef = doc(db, "providers", id)
  try {
    await deleteDoc(providerRef)
    console.log(id)
  } catch (error) {
    console.log(error)
  }
}
export const getProviders = async (setProviders) => {
  const providersRef = collection(db, "providers")
  const q = query(providersRef, orderBy("provider.name", "asc"))
  onSnapshot(q, (snapshot) => {
    let providersArray = snapshot.docs.map(item => item.data())
    setProviders(providersArray)
  })
}
export const updateClient = async (client) => {
  console.log('product from firebase', client)
  const clientRef = doc(db, 'client', client.id)
  await updateDoc(clientRef, { client })
    .then(() => { console.log('product from firebase', client) })
}
export const createClient = async (client) => {
  console.log(client)
  try {
    const clientRef = doc(db, 'client', client.id)
    await setDoc(clientRef, { client })
  } catch (error) {
    console.error("Error adding document: ", error)
  }
}
export const getClients = async (setClients) => {
  const clientRef = collection(db, "client")
  const q = query(clientRef, orderBy("client.name", "asc"))
  onSnapshot(q, (snapshot) => {
    let clientArray = snapshot.docs.map(item => item.data())
    console.log(clientArray)
    setClients(clientArray)
  })
}
export const deleteClient = async (id) => {
  console.log(id)
  const counterRef = doc(db, "client", id)
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
export const getCat = async (setCategories) => {
  const categoriesRef = collection(db, "categorys")
  const q = query(categoriesRef, orderBy("category.name"))
  onSnapshot(q, (snapshot) => {
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
export const getBills = async (setBills, time) => {
  //const date = Timestamp.fromDate(time.startDate)
  const start = new Date(time.startDate);
  const end = new Date(time.endDate);
  console.log('firebase: ', start, end)
  const Ref = collection(db, `bills`);
  const q = query(Ref, where("data.date", ">=", start), where("data.date", "<=", end), orderBy("data.date", "desc"));
  const { docs } = await getDocs(q);
  const arrayBills = docs.map(item => item.data());
  setBills(arrayBills)
}
export const AddBills = (data) => {
  //const clientRef = doc(db, "client", "4O-0")
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
export const UpdateMultipleDocs = (products) => {
  products.forEach((productData) => {
    const productRef = doc(db, "products", productData.id);
    updateDoc(productRef, {
      product: {
        ...productData,
        amountToBuy: { unit: 1, total: 1 },
        price: { unit: productData.price.unit, total: productData.price.unit },
        cost: { unit: productData.cost.unit, total: productData.cost.unit },
      },
    })
      .then(() => {
        console.log("Document successfully updated!");
      })
      .catch((error) => {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
  })
}
export const QueryByCategory = async (setProductArray, categoryArrayData, categoryStatus) => {
  const productsRef = collection(db, "products")
  const q = query(productsRef, where("product.category", "in", categoryArrayData), orderBy("product.productName", "desc"), orderBy("product.order", "asc"));
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
export const AddOrder = async (value) => {
  const providerRef = doc(db, 'providers', value.provider.id)
  let data = {
    ...value,
    id: nanoid(6),
    createdAt: Date.now(),
    provider: providerRef,
    state: selectItemByName(orderAndDataState, 'Solicitado')
  }
  const OrderRef = doc(db, "orders", data.id)
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
export const PassDataToPurchaseList = async (data) => {
  const providerRef = doc(db, 'providers', data.provider.id)
  const purchaseRef = doc(db, 'purchases', data.id)
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
export const getPurchaseFromDB = async (setPurchases) => {
  const purchasesRef = collection(db, 'purchases')
  onSnapshot(purchasesRef, (snapshot) => {
    let purchaseArray = snapshot.docs.map(async (item) => {
      let purchaseData = item.data();
      let providerRef = purchaseData.data.provider;
      let providerDoc = (await getDoc(providerRef)).data();
      purchaseData.data.provider = providerDoc.provider;
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
export const getOrders = (setOrder) => {
  const orderRef = collection(db, "orders")
  const q = query(orderRef, where("data.state.name", "==", "Solicitado"))
  onSnapshot(q, (snapshot) => {
    let orderArray = snapshot.docs.map(async (item) => {
      let orderData = item.data()
      let providerRef = orderData.data.provider;
      let providerDoc = (await getDoc(providerRef)).data()
      orderData.data.provider = providerDoc.provider
      return orderData
    })
    Promise.all(orderArray).then(result => {
      setOrder(result)
    }).catch(error => {
      console.log(error)
    });
  })
}
export const deleteOrderFromDB = async (id) => {
  deleteDoc(doc(db, `orders`, id))
}
export const createTaxReceiptDataBD = async () => {
  const counterRef = doc(db, "counter", "c1")
  const taxReceipts = {
    data: [
      {
        name: 'CONSUMIDOR FINAL',
        type: 'B',
        serie: 2,
        sequence: 1,
        increase: 1,
        quantity: 2000
      },
      {
        name: 'CREDITO FISCAL',
        type: 'B',
        serie: 1,
        sequence: 1,
        increase: 1,
        quantity: 2000
      }
    ]
  }
  try {
    await setDoc(counterRef, taxReceipts)
    console.log(counterRef)
  } catch (err) {
    console.log(err)
  }
}
export const updateTaxReceiptDataBD = async (taxReceipt) => {
  console.log('entrando......................................')
  const counterRef = doc(db, "counter", "c1")
  try {
    updateDoc(counterRef,
      { data: taxReceipt }
    );
    console.log('listo, to bien')
  } catch (err) {
    console.log('todo mal')
  }
}
export const updateCategoryDataBD = async (category) => {

  const counterRef = doc(db, "categories", category.id)
  try {
    updateDoc(counterRef,
      { category }
    );
    console.log('listo, to bien')
  } catch (err) {
    console.log('todo mal')
  }
}
export const deleteTaxReceiptDataBD = () => {
  const counterRef = doc(db, "counter", "c1")
  deleteDoc(counterRef);
}
export const readTaxReceiptDataBD = (setTaxReceiptDataBD) => {
  const countersRef = collection(db, "counter")
  onSnapshot(countersRef, (data) => {
    let counterArray = data.docs.map(item => item.data())
    let [obj] = counterArray
    console.log(obj.data)
    setTaxReceiptDataBD(obj.data)
  });

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