import { Timestamp, doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { DateTime } from "luxon";

const saveLastInvoiceChange = async (user, lastInvoiceChange) => {
    const { id } = lastInvoiceChange.data;
    const previousInvoiceRef = doc(db, 'businesses', user.businessID, "previousInvoices", id);
    await setDoc(previousInvoiceRef, { data: { ...lastInvoiceChange.data, savedAt: Timestamp.now() } });
}

const updateProductsStock = async (user, newInvoiceVersion, previousInvoiceVersion) => {
    const newProductsMap = new Map(newInvoiceVersion.products.map(product => [product.id, product]));
    const prevProductsMap = new Map(previousInvoiceVersion.products.map(product => [product.id, product]));

    // Procesar los productos en la nueva versión de la factura
    for (const [productId, newProduct] of newProductsMap) {
        const prevProduct = prevProductsMap.get(productId);
        let stockChange = 0;

        if (prevProduct) {
            // Si el producto existía antes, calcula el cambio en la cantidad
            stockChange = prevProduct.amountToBuy.total - newProduct.amountToBuy.total;
        } else {
            // Si es un producto nuevo, el cambio es igual a la cantidad comprada (se reduce el stock)
            stockChange = -newProduct.amountToBuy.total;
        }

        // Actualizar el stock en la base de datos
        await updateProductStock(user, productId, stockChange);
    }

    // Procesar los productos que han sido eliminados en la nueva versión
    for (const [productId, prevProduct] of prevProductsMap) {
        if (!newProductsMap.has(productId)) {
            // Si un producto anterior ya no está en la nueva factura, incrementa el stock
            await updateProductStock(user, productId, prevProduct.amountToBuy.total);
        }
    }
}
const updateProductStock = async (user, productId, stockChange) => {
    // Simular la actualización del stock del producto
    console.log(`Simulando la actualización del stock del producto ${productId} en ${stockChange} unidades.`);

    // La siguiente línea está comentada para evitar cambios reales en la base de datos
    const productsRef = doc(db, 'businesses', user.businessID, "products", productId);
    await updateDoc(productsRef, { "product.stock": increment(stockChange) });

    // En su lugar, solo imprimimos un mensaje para simular la actualización
    console.log(`Actualizaría el stock del producto ${productId} en ${stockChange} unidades.`);
};

export const fbUpdateInvoice = async (user, invoice) => {
    const { id } = invoice;
    const invoiceRef = doc(db, 'businesses', user.businessID, "invoices", id);
    try {

        const currentInvoiceSnap = await getDoc(invoiceRef);
        if (currentInvoiceSnap.exists()) {
            const currentInvoice = currentInvoiceSnap.data();
            // Guardar la versión actual en la colección de versiones anteriores
            await saveLastInvoiceChange(user, currentInvoice);

            // Actualizar el stock de los productos 
            await updateProductsStock(user, invoice, currentInvoice.data);

            // Preparar los nuevos datos de la factura
            let invoiceData = {
                ...invoice,
                date: Timestamp.fromMillis(invoice.date),
                updateAt: Timestamp.now()
            }

           
            await updateDoc(invoiceRef, { data: invoiceData });
        }
    } catch (err) {

    }
}