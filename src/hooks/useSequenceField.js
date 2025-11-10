import { collection, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '../firebase/firebaseconfig';

/**
 * Hook para gestionar taxReceipts desde Firebase Firestore, validar su estructura
 * y manejar la secuencia de NCF.
 *
 * @param {Object} user  Objeto de usuario que contiene businessID
 * @returns {Object} Objeto con taxReceipts, loading, error, updateSequence y formatNCF.
 */
export function useTaxReceiptsFix(user) {
  const [taxReceipts, setTaxReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const businessID = user.businessID;
  const taxReceiptsRef = collection(db, 'businesses', businessID, 'taxReceipts');

  // Define el esquema esperado para validar cada receipt
  const validateReceipt = (rec) => {
    const schema = {
      name: 'string',
      type: 'string',
      serie: 'string',
      sequence: 'number',
      sequenceLength: 'number',
      increase: 'number',
      quantity: 'number',
      description: 'string'
    };
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in rec) || typeof rec[key] !== type) {
        console.error(`Receipt inválido: campo '${key}' debe ser ${type}, se obtuvo ${typeof rec[key]}`);
        return false;
      }
    }
    return true;
  };

  // Escucha en tiempo real cambios en taxReceipts
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      taxReceiptsRef,
      (snapshot) => {
        const receipts = snapshot.docs
          .map(docSnap => docSnap.data().data)
          .map(raw => {
            // Convertir sequence y sequenceLength a número si vienen como string
            const sequenceNum = typeof raw.sequence === 'string'
              ? parseInt(raw.sequence, 10)
              : raw.sequence;
            const lengthNum = typeof raw.sequenceLength === 'string'
              ? parseInt(raw.sequenceLength, 10)
              : raw.sequenceLength;
            return { ...raw, sequence: sequenceNum, sequenceLength: lengthNum };
          })
          .filter(rec => validateReceipt(rec));
        setTaxReceipts(receipts);
        setLoading(false);
      },
      (err) => {
        console.error('Snapshot error:', err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [businessID]);

  /**
   * Actualiza la secuencia de un taxReceipt en Firestore e inserta sequenceLength si no existe.
   *
   * @param {string} docId    ID del documento taxReceipt.
   * @param {number} delta    Cantidad a incrementar (por defecto 1).
   */
  const updateSequence = async (docId, delta = 1) => {
    try {
      const docRef = doc(db, 'businesses', businessID, 'taxReceipts', docId);
      const receiptSnap = await getDoc(docRef);
      if (!receiptSnap.exists()) throw new Error('Receipt not found');
      const raw = receiptSnap.data().data;
      // Convertir a número si es string
      const currentSeq = typeof raw.sequence === 'string'
        ? parseInt(raw.sequence, 10)
        : raw.sequence;
      const lengthNum = typeof raw.sequenceLength === 'string'
        ? parseInt(raw.sequenceLength, 10)
        : raw.sequenceLength;
      const newSequence = currentSeq + delta;

      // Actualiza solo la secuencia y se asegura de escribir también sequenceLength
      await updateDoc(docRef, {
        'data.sequence': newSequence,
        'data.sequenceLength': lengthNum
      });
      // onSnapshot actualizará el estado local automáticamente
    } catch (err) {
      console.error('Error updating sequence:', err);
      setError(err);
    }
  };

  /**
   * Formatea el NCF completo con padding de ceros según sequenceLength.
   *
   * @param {Object} receipt  Objeto taxReceipt con type, serie, sequence y sequenceLength.
   * @returns {string} NCF formateado (p.ej. "B02000001").
   */
  const formatNCF = ({ type, serie, sequence, sequenceLength }) => {
    const seqStr = String(sequence).padStart(sequenceLength, '0');
    return type + serie + seqStr;
  };

  return { taxReceipts, loading, error, updateSequence, formatNCF };
}
