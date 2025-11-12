// File: src/components/TaxReceiptSetting/useTaxReceiptSetting.js
import { message } from 'antd';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useDialog } from '../../../../../../Context/Dialog';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { getTaxReceiptData, selectTaxReceiptEnabled } from '../../../../../../features/taxReceipt/taxReceiptSlice';
import { fbEnabledTaxReceipt } from '../../../../../../firebase/Settings/taxReceipt/fbEnabledTaxReceipt';
import { fbGetTaxReceipt } from '../../../../../../firebase/taxReceipt/fbGetTaxReceipt';
import { fbUpdateTaxReceipt } from '../../../../../../firebase/taxReceipt/fbUpdateTaxReceipt';
import { useCompareArrays } from '../../../../../../hooks/useCompareArrays';
import { serializeFirestoreDocuments } from '../../../../../../utils/serialization/serializeFirestoreData';

export function useTaxReceiptSetting() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { taxReceipt } = fbGetTaxReceipt();
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const [taxReceiptLocal, setTaxReceiptLocal] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const { setDialogConfirm, onClose } = useDialog();
  const arrayAreEqual = useCompareArrays(taxReceiptLocal, taxReceipt);
  useEffect(() => {
    const serializedTaxReceipt = serializeFirestoreDocuments(taxReceipt);
    dispatch(getTaxReceiptData(serializedTaxReceipt));
    setTaxReceiptLocal(serializedTaxReceipt);
  }, [taxReceipt, dispatch]);

  const handleSubmit = () => {
    fbUpdateTaxReceipt(user, taxReceiptLocal);
    message.success('Comprobantes fiscales actualizados correctamente');
  };

  const handleCancel = () => {
    setTaxReceiptLocal(taxReceipt);
  };

  const handleTaxReceiptEnabled = () => {
    if (taxReceiptEnabled) {
      setDialogConfirm({
        title: '¿Deshabilitar comprobantes?',
        isOpen: true,
        type: 'warning',
        message: 'Si deshabilitas los comprobantes, no se mostrarán en el punto de venta.',
        onConfirm: () => {
          fbEnabledTaxReceipt(user);
          onClose();
        }
      });
    } else {
      fbEnabledTaxReceipt(user);
    }
  };

  const handleAddNewTaxReceipt = () => {
    const existing = new Set(taxReceiptLocal.map(r => r.data.serie));
    let suffix = 3;
    let serie = String(suffix).padStart(2, '0');
    while (existing.has(serie)) {
      suffix++;
      serie = String(suffix).padStart(2, '0');
    }
    const newReceipt = {
      data: { name: 'NUEVO COMPROBANTE', type: 'B', serie, sequence: '0000000000', increase: 1, quantity: 2000 }
    };
    setTaxReceiptLocal([...taxReceiptLocal, newReceipt]);
    message.success('Nuevo comprobante agregado. No olvides guardar los cambios.');
  };

  const handleOpenAddPredefinedReceipt = () => {
    setIsAddModalVisible(true);
  };
  const handleCloseAddPredefinedReceipt = () => setIsAddModalVisible(false);

  const handleAddPredefinedReceipts = newReceipts => {
    const existingSeries = new Set(taxReceiptLocal.map(r => r.data.serie));
    const existingNames = new Set(taxReceiptLocal.map(r => r.data.name));
    const unique = [];
    const dupNames = [];
    const dupSeries = [];

    newReceipts.forEach(r => {
      if (existingNames.has(r.data.name)) dupNames.push(r.data.name);
      else if (existingSeries.has(r.data.serie)) dupSeries.push(r.data.serie);
      else {
        existingNames.add(r.data.name);
        existingSeries.add(r.data.serie);
        unique.push(r);
      }
    });

    let warn = '';
    if (dupNames.length) warn += `Se omitieron nombres duplicados: ${dupNames.join(', ')}. `;
    if (dupSeries.length) warn += `Se omitieron series duplicadas: ${dupSeries.join(', ')}.`;
    if (warn) message.warning(warn);

    if (unique.length) {
      setTaxReceiptLocal([...taxReceiptLocal, ...unique]);
      message.success(`${unique.length} comprobante(s) añadidos correctamente. No olvides guardar los cambios.`);
    } else {
      message.error('No se agregaron comprobantes. Todos ya existen.');
    }
  };

  return {
    taxReceiptLocal,
    setTaxReceiptLocal,
    taxReceiptEnabled,
    isAddModalVisible,
    arrayAreEqual,
    handleSubmit,
    handleCancel,
    handleTaxReceiptEnabled,
    handleAddNewTaxReceipt,
    handleOpenAddPredefinedReceipt,
    handleCloseAddPredefinedReceipt,
    handleAddPredefinedReceipts
  };
}
