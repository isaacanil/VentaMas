import { useEffect, useState } from "react"
import { db } from "../firebaseconfig"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"

export const useFbGetProviders = (user) => {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
      if (!user || !user?.businessID) return;

      const providersRef = collection(db, 'businesses', user.businessID, 'providers');

      const fetchData = async () => {
          const unsubscribe = onSnapshot(providersRef, (snapshot) => {
              let providersArray = snapshot.docs.map((item) => item.data());
              setProviders(providersArray);
          });

          return () => unsubscribe(); // Limpia la suscripción cuando el componente se desmonte
      };

      fetchData();
      
  }, [user]);

  console.log(providers);
  return { providers };
}