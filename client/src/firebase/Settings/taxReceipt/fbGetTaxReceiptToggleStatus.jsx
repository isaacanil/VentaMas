import { doc, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "../../firebaseconfig";
import { toggleTaxReceiptSettings } from "../../../features/taxReceipt/taxReceiptSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../../features/auth/userSlice";
import { setTaxReceiptEnabled } from "../../../features/cart/cartSlice";

export const usefbTaxReceiptToggleStatus = () => {
    const user = useSelector(selectUser)
    const dispatch = useDispatch();
    useEffect(() => {
      if (!user || !user?.businessID) return;
  
      const settingRef = doc(db, 'businesses', user.businessID, 'settings', 'taxReceipt');
      
      // Usar onSnapshot para escuchar cambios en tiempo real
      const unsubscribe = onSnapshot(settingRef, (docSnap) => {
          if (docSnap.exists()) {
              dispatch(toggleTaxReceiptSettings(docSnap.data().taxReceiptEnabled));
              dispatch(setTaxReceiptEnabled(docSnap.data().taxReceiptEnabled));
          } else {
              dispatch(toggleTaxReceiptSettings(false));
              dispatch(setTaxReceiptEnabled(false));
          }
      }, (error) => {
          console.error("Ocurrió un error al obtener el comprobante fiscal:", error);
      });
  
      // Limpiar la suscripción cuando el componente se desmonta
      return () => unsubscribe();
    }, [user, dispatch]); // Dependencias del efecto
  }

