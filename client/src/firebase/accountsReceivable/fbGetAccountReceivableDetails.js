// getAccountReceivableDetails.js
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
  } from 'firebase/firestore';
  import { db } from '../firebaseconfig'; // Asegúrate de que la ruta sea correcta
  
  /**
   * Obtiene los detalles completos de una cuenta por cobrar para visualizar en un modal.
   * @param {string} arId - ID de la cuenta por cobrar.
   * @param {string} businessId - ID del negocio del usuario.
   * @returns {object} - Objeto con todos los detalles necesarios.
   */
  export async function getAccountReceivableDetails(arId, businessID) {
    try {
        // Verificar si el businessId coincide
      if (!businessID) {
        throw new Error('No tienes permisos para acceder a esta cuenta por cobrar.');
      }
      // 1. Obtener la cuenta por cobrar principal
      const arRef = doc(collection(db, "businesses", businessID, "accountsReceivable"), arId);
      const arSnap = await getDoc(arRef);
  
      if (!arSnap.exists()) {
        throw new Error('Cuenta por cobrar no encontrada.');
      }
  
      const arData = arSnap.data();
  
      
  
      // 2. Obtener información del cliente
      const clientRef = doc(collection(db, "businesses", businessID, "clients"), arData.clientId);
      const clientSnap = await getDoc(clientRef);
      const clientData = clientSnap.exists() ? clientSnap.data() : null;
  
      // 3. Obtener información de la factura
      const invoiceRef = doc(collection(db, "businesses", businessID, "invoices"), arData.invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);
      const invoiceData = invoiceSnap.exists() ? invoiceSnap.data() : null;
  
      // 4. Obtener todas las cuotas asociadas a la cuenta por cobrar
      const installmentsQuery = query(
        collection(db, "businesses", businessID, "accountsReceivableInstallments"),
        where('arId', '==', arId)
      );
      const installmentsSnap = await getDocs(installmentsQuery);
  
      const installments = [];
      const installmentIds = [];
  
      installmentsSnap.forEach(doc => {
        const installment = { id: doc.id, ...doc.data() };
        installments.push(installment);
        installmentIds.push(doc.id);
      });
  
      // 5. Obtener todos los pagos a plazos relacionados con las cuotas
      let installmentPayments = [];
  
      if (installmentIds.length > 0) {
        // Firestore no permite usar 'in' con más de 10 elementos, así que se divide en lotes si es necesario
        const batches = [];
        const batchSize = 10;
        for (let i = 0; i < installmentIds.length; i += batchSize) {
          const batch = installmentIds.slice(i, i + batchSize);
          batches.push(batch);
        }
  
        for (const batch of batches) {
          const installmentPaymentsQuery = query(
            collection(db, "businesses", businessID, "accountsReceivableInstallmentPayments"),
            where('installmentId', 'in', batch)
          );
          const paymentsSnap = await getDocs(installmentPaymentsQuery);
  
          paymentsSnap.forEach(doc => {
            installmentPayments.push({ id: doc.id, ...doc.data() });
          });
        }
      }
  
      // Obtener todos los paymentIds para obtener los detalles de los pagos
      const paymentIds = installmentPayments.map(payment => payment.paymentId);
      const uniquePaymentIds = [...new Set(paymentIds)];
    
  
      const payments = [];
  
      if (uniquePaymentIds.length > 0) {
        const paymentBatches = [];
        const batchSize = 10;
        for (let i = 0; i < uniquePaymentIds.length; i += batchSize) {
          const batch = uniquePaymentIds.slice(i, i + batchSize);
          paymentBatches.push(batch);
        }
  
        for (const batch of paymentBatches) {
          const paymentsQuery = query(
            collection(db, "businesses", businessID, "accountsReceivablePayments"),
            where('__name__', 'in', batch)
          );
          const paymentsSnap = await getDocs(paymentsQuery);
  
          paymentsSnap.forEach(doc => {
            payments.push({ id: doc.id, ...doc.data() });
          });
        }
      }
  
      // Mapear payments a installmentPayments
      const paymentsMap = {};
      payments.forEach(payment => {
        paymentsMap[payment.id] = payment;
      });
  
      installmentPayments = installmentPayments.map(payment => ({
        ...payment,
        paymentDetails: paymentsMap[payment.paymentId] || null
      }));
  
      // Asignar los pagos a cada cuota
      const installmentsWithPayments = installments.map(installment => ({
        ...installment,
        payments: installmentPayments.filter(p => p.installmentId === installment.id)
      }));
  
      // Estructurar el resultado final
      const result = {
        accountReceivable: {
          id: arId,
          ...arData
        },
        client: clientData,
        invoice: invoiceData,
        installments: installmentsWithPayments
      };
      console.log('result', result)
      return result;
  
    } catch (error) {
      console.error('Error al obtener los detalles de la cuenta por cobrar:', error);
      throw error;
    }
  }
