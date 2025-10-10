// firebaseProducts.js
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    doc, 
    addDoc, 
    writeBatch, 
    updateDoc 
  } from 'firebase/firestore';

import { db } from '../../../../../../firebase/firebaseconfig';

  
  /**
   * Searches for a product by name in Firebase
   * @param {string} businessID - Business ID
   * @param {string} productName - Product name to search for
   * @returns {Promise<Object|null>} - Returns the product if it exists, null if not
   */
  export const findProductByName = async (businessID, productName) => {
    try {
      const productsRef = collection(db, `businesses/${businessID}/products`);
      
      // Create query to search by exact name
      const q = query(productsRef, where("name", "==", productName));
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Return the first matching document
      return {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      };
    } catch (error) {
      console.error("Error finding product:", error);
      throw error;
    }
  };
  
  /**
   * Updates an existing product in Firebase
   * @param {string} businessID - Business ID
   * @param {string} productID - Product ID
   * @param {Object} productData - Product data to update
   * @returns {Promise<Object>} - Operation result
   */
  export const updateProduct = async (businessID, productID, productData) => {
    try {
      const productRef = doc(db, `businesses/${businessID}/products/${productID}`);
      
      // Update the document
      await updateDoc(productRef, productData);
      
      return {
        success: true,
        message: "Product updated successfully",
        productID
      };
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  };
  
  /**
   * Creates a new product in Firebase
   * @param {string} businessID - Business ID
   * @param {Object} productData - Product data to create
   * @returns {Promise<Object>} - Operation result with the new product ID
   */
  export const createProduct = async (businessID, productData) => {
    try {
      const productsRef = collection(db, `businesses/${businessID}/products`);
      
      // Create a new document with auto ID
      const docRef = await addDoc(productsRef, {
        ...productData,
        createdAt: new Date().toISOString()
      });
      
      return {
        success: true,
        message: "Product created successfully",
        productID: docRef.id
      };
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  };
  
  /**
   * Processes a list of products in batches for better performance
   * @param {string} businessID - Business ID
   * @param {Array} products - List of products to process
   * @param {boolean} updateExisting - If true, updates existing products
   * @returns {Promise<Object>} - Operation results
   */
  export const processProductsInBatches = async (
    businessID, 
    products, 
    updateExisting = true
  ) => {
    if (!businessID) throw new Error("Business ID is required");
    if (!Array.isArray(products)) throw new Error("Products must be an array");
    
    const results = {
      total: products.length,
      updated: 0,
      created: 0,
      skipped: 0,
      errors: []
    };
    
    try {
      // First, get all existing products for name comparison
      const existingProducts = new Map();
      const productsRef = collection(db, `businesses/${businessID}/products`);
      const querySnapshot = await getDocs(productsRef);
      
      querySnapshot.forEach(doc => {
        const product = doc.data();
        existingProducts.set(product.name, {
          id: doc.id,
          ...product
        });
      });
      
      // Process products in batches (max 500 per batch - Firestore limit)
      const batches = [];
      const batchSize = 400;
      
      for (let i = 0; i < products.length; i += batchSize) {
        batches.push(products.slice(i, i + batchSize));
      }
      
      // Process each batch
      for (const batch of batches) {
        const writeBatchRef = writeBatch(db);
        
        for (const product of batch) {
          try {
            const existingProduct = existingProducts.get(product.name);
            
            if (existingProduct) {
              if (updateExisting) {
                // Update existing product
                const productRef = doc(db, `businesses/${businessID}/products/${existingProduct.id}`);
                writeBatchRef.update(productRef, product);
                results.updated++;
              } else {
                // Skip updating
                results.skipped++;
              }
            } else {
              // Create new product
              const newProductRef = doc(collection(db, `businesses/${businessID}/products`));
              writeBatchRef.set(newProductRef, {
                ...product,
                createdAt: new Date().toISOString()
              });
              results.created++;
            }
          } catch (error) {
            results.errors.push({
              product: product.name,
              error: error.message
            });
          }
        }
        
        // Execute the batch
        await writeBatchRef.commit();
      }
      
      return results;
    } catch (error) {
      console.error("Error processing products in batches:", error);
      throw error;
    }
  };