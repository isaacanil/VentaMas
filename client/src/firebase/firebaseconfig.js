// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from "firebase/firestore";
import { nanoid } from "nanoid";
//TODO ***STORAGE***********************************
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable
} from "firebase/storage"
import { useState } from "react";

//TODO ***FIRESTORE***********************************


//TODO ***AUTH**************************************
export {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth"

import { v4 } from 'uuid'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJd82BkS5bp3lI5MbTJohU8rhZth3_AL4",
  authDomain: "ventamax-75bec.firebaseapp.com",
  projectId: "ventamax-75bec",
  storageBucket: "ventamax-75bec.appspot.com",
  messagingSenderId: "653993214585",
  appId: "1:653993214585:web:f2e6674640557a28220aa8",
  measurementId: "G-9RTQMM0JW2"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app)


//Todo Auth **********************************************************************************




//Todo Product **************************************************************************


/****************** **********************/
export const UploadProdImg = (file) => {

  return new Promise((resolve, reject) => {
    const today = new Date();
    const hour = `${today.getHours()}:${today.getMinutes()}`
    const storageRef = ref(storage, `products/${v4()}.jpg`)
    uploadBytes(storageRef, file)
      .then((snapshot) => {
        getDownloadURL(storageRef)
          .then((url) => {
            //console.log('File available at', url);  
            resolve(url);
          });
      })
  })
}
export const UploadProdData = (
  url, 
  productName,
  cost,
  taxRef,
  stock,
  category,
  netContent,) => {
  const tax = JSON.parse(taxRef)
  const taxValue = () => {
     return {
      ref: tax.ref,
      value: tax.value,
      total: cost * tax.value,
      unit: cost * tax.value,
    }
  }
  let priceValue = () => {
    return {
      unit: Number(cost) + Number(taxValue().unit),
      total: Number(cost) + Number(taxValue().unit)
    }
  }
  console.log(taxValue())
  let product = {
    id: nanoid(6),
    amountToBuy: 1,
    productName: String(productName),
    cost: {
      unit: Number(cost),
      total: Number(cost)
    },
    tax: taxValue(),
    productImageURL: url,
    stock: Number(stock),
    //toma el valor sin inpuesto y le agrega el impuesto seleccionado y redondeado
    netContent: netContent,
    price: priceValue()
    

 }
  new Promise((resolve, reject) => {
    try {
      const productRef = doc(db, "products", product.id)
      setDoc(productRef, { 
        product
      }
      )
      console.log('Document written with ID')
    } catch (error) {
      console.error("Error adding document: ", error)
    }
  })

}
/****************** **********************/
export const getProducts = async (setProduct) => {
  const productRef = collection(db, "products")
  const { docs } = await getDocs(collection(db, "products"));
  const productsArray = docs.map(item => item.data())
  setProduct(productsArray)

}
export const getProduct = async (id, product) => {
  await updateDoc(doc(db, "products", id), {
    product
  }).then()
}
export const getTaxes = async (setTaxe) => {
  const taxeRef = collection(db, "taxes")
  const { docs } = await getDocs(taxeRef)
  const taxeArray = docs.map(item => item.data())
  setTaxe(taxeArray)
}
export const getClients = async (setClient) => {
  // const clientRef = collection(db, "client")
  const { docs } = await getDocs(collection(db, "client"));
  const clientArray = docs.map(item => item.data())
  setClient(clientArray)
}
export const Firestore = async (path, data, id) => {
  await setDoc(doc(db, `${path}`, id), {
    data
  });
}
export const getCat = async (setCategorys) => {
  // const clientRef = collection(db, "client")
  const { docs } = await getDocs(collection(db, "categorys"));
  const categorysArray = docs.map(item => item.data())
  setCategorys(categorysArray)
}
export const UploadCat = async (path, category, id) => {
  await setDoc(doc(db, `${path}`, id), {
    category
  });
}
export const deleteProduct = (id) => {
  deleteDoc(doc(db, `products`, id))
}
export const getItems = async (setBills) => {
  const Ref = collection(db, `bills`);
  const { docs } = await getDocs(Ref);
  const DataArray = docs.map(item => item.data());
  setBills(DataArray);
}

export const QueryByCategory = async (setProductArray, categoryArrayData, categoryStatus) => {

  const productsRef = collection(db, "products")
  const q = query(productsRef, where("product.category", "in", categoryArrayData));
  const {docs} = await getDocs(q);
  const array = docs.map((doc) => doc.data());

  if(categoryStatus){
    setProductArray(array);
  }

}