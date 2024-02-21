import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { getTax } from "../../utils/pricing";
const businessIDs = [
    "2mJ94xMLICgM2KjPgXrD",
    "EDW44d69fhdvE5QmuL2I",
    "G5dFfupqbgUg8tYEqc9o",
    "JnKRSCFwKSkiSNSiIpOM",
    "Lm8GG6YXQJO3zgR9DkGe",
    "TRNykpxKa580PqGc0GtI",
    "tGrRrpnKl2D1ZezyBVQe",
    "vDR3rHX3GDLVnAnorAYz",
    "vvRKlKT9UOK4fX9FgJxN",
]

export async function fbUpdateProductsToNewFormatForMultipleBusinesses() {
    try {
        console.log("Iniciando la actualización de productos para múltiples negocios...");

        // Verificar que se proporcione un array válido de businessIDs
        if (!Array.isArray(businessIDs) || businessIDs.length === 0) {
            console.log("Array de IDs de negocios no proporcionado o vacío. Abortando la actualización.");
            return;
        }

        // Iterar sobre cada businessID para actualizar sus productos
        for (const businessID of businessIDs) {
            console.log(`Procesando actualización para el negocio con ID: ${businessID}`);

            const productsRef = collection(db, "businesses", businessID, "products");
            const querySnapshot = await getDocs(productsRef);
            console.log("Productos obtenidos de la base de datos.");

            const products = querySnapshot.docs.map((doc) => ({...doc.data(), id: doc.id}));
            console.log(`${products.length} productos encontrados para el negocio ${businessID}.`);

            const batch = writeBatch(db);

            const updatedProducts = newProductSchema(products);
            console.log("Productos mapeados a la nueva estructura.");

            updatedProducts.forEach((product, index) => {
                if (!product.id) return; // Asegurarse de que el producto tenga un id
                const productRef = doc(productsRef, product.id);
                batch.set(productRef, product);
                console.log(`Producto ${index + 1} preparado para la actualización: ${product.name} - ${product.id}`);
            });

            await batch.commit();
            console.log(`Productos actualizados con éxito en la base de datos para el negocio ${businessID}.`);
        }
    } catch (error) {
        console.error("Error actualizando productos para múltiples negocios:", error);
    }
}

function convertDecimalToPercentage(valorDecimal) {
    if (typeof valorDecimal === 'number' && valorDecimal >= 0 && valorDecimal <= 1) {
        console.log(`Convirtiendo valor decimal a porcentaje: ${valorDecimal}`);
        return valorDecimal * 100; // Convierte el valor decimal a porcentaje
    } else {
        console.log("Valor decimal inesperado. Retornando 0 como valor por defecto.");
        return 0; // Retorna 0 como valor por defecto si hay algo inesperado
    }
}

export const newProductSchema = (products) => {
    if (!products) {
        console.error("No se encontraron productos. Abortando la actualización.");
        return [];
    }
    if (!Array.isArray(products)) {
        console.error("Los productos no son un arreglo. Abortando la actualización.");
        return [];
    }

    // Filtrar y excluir el producto con ID "6dssod"
    const filteredProducts = products.filter(({product})=> product.id !== "6dssod");

    return filteredProducts.map(({ product }) => {
        const taxPercentage = convertDecimalToPercentage(product.tax.unit)
        const tax = getTax(product.price.unit, taxPercentage)
        const price = product.price.unit - tax
        return ({
            id: product.id,
            name: product.productName.trim(),
            category: product.category,
            image: product.productImageURL,
            pricing: {
                cost: product.cost.unit,
                price: price, // Usando el precio unitario como precio seleccionado
                listPrice: product?.listPrice ? product.listPrice : product.price.unit, // Usando el costo unitario si no hay precio de lista
                minPrice: product.minimumPrice ? product.minimumPrice : product.price.unit, // Usando el costo unitario si no hay precio mínimo
                avgPrice: product.averagePrice ? product.averagePrice : product.price.unit, // Usando el costo unitario si no hay precio promedio
                tax: convertDecimalToPercentage(product.tax.value) // Asumiendo que quieres usar el valor de 'value' como el porcentaje de impuesto
            },
            promotions: {
                isActive: false, // No hay información sobre promociones en el objeto original, se asume inactivo
                discount: 0, // No hay información sobre el descuento, se asume 0
                start: null, // No hay información de inicio, se asume null
                end: null // No hay información de fin, se asume null
            },
            stock: product.stock,
            barcode: product.barCode,
            qrcode: product.qrCode,
            isVisible: product?.isVisible ? product.isVisible : false, // Asumiendo falso si no hay información sobre si el producto es visible
            trackInventory: product.trackInventory,
            netContent: product.netContent,
            size: product.size.trim(),
            type: product.type.trim(),
            status: "disponible", // Asumiendo "disponible" como estado por defecto
            amountToBuy: product.amountToBuy.unit, // Usando la cantidad unitaria como cantidad a comprar
            createdAt: new Date(), // Convirtiendo timestamp a fecha ISO
            createdBy: "unknown", // No hay información sobre quién creó el producto, se asume desconocido
            updatedAt: new Date(), // Asumiendo la fecha actual para la actualización
        })
    });
};
