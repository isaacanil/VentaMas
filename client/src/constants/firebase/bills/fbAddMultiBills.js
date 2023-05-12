import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseconfig';

export async function fbAddMultiBills(user, invoices) {
  if (!user || !user?.businessID) {
    console.log("No business ID found. Please contact support."); //TODO: replace with toast
    return;
  }
  const { businessID } = user;
  const invoicesRef = collection(db, "businesses", businessID, "invoices");

  const promises = invoices.map((invoice) => {
    const invoiceRef = doc(invoicesRef, invoice.data.id);
    const {nanoseconds, seconds} = invoice.data.date 
    const date = new Date(seconds * 1000 + nanoseconds / 1000000)
    invoice = {...invoice, data: {...invoice.data, date}}

    return setDoc(invoiceRef, invoice);
  });

  try {
    await Promise.all(promises);
    promises.forEach((promise, index) => {
      console.log(`Producto ${index + 1} añadido con ID: ${invoices[index].data.id}`);
    });
  } catch (error) {
    console.error(`Error al agregar los productos: ${error}`);
  }
}



