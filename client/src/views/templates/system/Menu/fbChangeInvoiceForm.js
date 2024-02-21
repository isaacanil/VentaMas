import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../../../firebase/firebaseconfig";
import { DateTime } from "luxon"; // Asegúrate de añadir esta importación

async function getInvoiceFromYesterday(invoiceRef) {
    const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');
    const startOfDay = yesterday.toJSDate();
    const endOfDay = yesterday.endOf('day').toJSDate();

    const q = query(invoiceRef, where("data.date", ">=", startOfDay), where("data.date", "<=", endOfDay), orderBy("data.date"), limit(1));

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]; // Accediendo directamente al primer documento
        console.log(`${doc.id} =>`, doc.data());
    } else {
        console.log("No se encontró ninguna factura de ayer.");
    }
}

async function getInvoiceFromTwoWeeksAgo(invoiceRef) {
    const twoWeeksAgo = DateTime.now().minus({ weeks: 2 }).startOf('day');
    const startOfDay = twoWeeksAgo.toJSDate();
    const endOfDay = twoWeeksAgo.endOf('day').toJSDate();

    const q = query(invoiceRef, where("data.date", ">=", startOfDay), where("data.date", "<=", endOfDay), orderBy("data.date"), limit(1));

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]; // Accediendo directamente al primer documento
        console.log(`${doc.id} antes =>`, doc.data());
        console.log(`${doc.id} ahora =>`, transformOldDataToNewStructure(doc.data()));
    } else {
        console.log("No se encontró ninguna factura de hace dos semanas.");
    }
}

export const fbChangeInvoiceForm = async () => {
    const invoiceRef = collection(db, "businesses/X63aIFwHzk3r0gmT8w6P/invoices");
    await getInvoiceFromTwoWeeksAgo(invoiceRef);
    await getInvoiceFromYesterday(invoiceRef);
};

function transformOldDataToNewStructure(oldData) {
    // Copiar datos generales directamente, asumiendo que no necesitan transformación
    const newData = {
        ...oldData,
        data: {
            ...oldData.data,
            products: oldData.data.products.map(product => ({
                // Mapear campos existentes directamente
                trackInventory: product.trackInventory,
                barcode: product.barCode || "", // Asumir un valor por defecto si no existe
                name: product.productName,
                status: "disponible", // Asumir un estado por defecto
                createdBy: "unknown", // Asumir un creador por defecto
                createdAt: product.date || { seconds: Date.now() / 1000, nanoseconds: 0 }, // Asumir fecha actual si no existe
                isVisible: product.isVisible,
                image: product.productImageURL || "",
                netContent: product.netContent || "",
                size: product.size,
                type: product.type,
                updatedAt: product.date || { seconds: Date.now() / 1000, nanoseconds: 0 }, // Asumir fecha actual si no existe
                stock: product.stock,
                amountToBuy: product.amountToBuy.total,
                id: product.id,
                category: product.category,
                qrcode: product.qrCode || "",
                // Transformar estructura de precios y costos
                pricing: {
                    price: product.price.unit,
                    avgPrice: product.averagePrice || product.price.unit, // Asumir el precio unitario si el promedio no está disponible
                    minPrice: product.minimumPrice,
                    tax: product.tax.unit,
                    cost: product.cost.unit,
                    listPrice: product.listPrice,
                },
                // Agregar estructura de promociones con valores predeterminados
                promotions: {
                    end: null,
                    start: null,
                    discount: 0,
                    isActive: false,
                },
            })),
        },
    };

    // Eliminar campos que no existen en la nueva estructura o que se manejan de forma diferente
    delete newData.data.totalPurchaseWithoutTaxes; // Ejemplo de campo a eliminar

    return newData;
}


