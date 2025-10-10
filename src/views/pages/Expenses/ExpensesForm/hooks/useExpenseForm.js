// src/features/expense/ExpensesForm/useExpensesForm.js
import { message } from 'antd';
import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../features/auth/userSlice';
import { selectExpense, resetExpense, setExpense } from '../../../../../features/expense/expenseManagementSlice';
import { closeExpenseFormModal, selectExpenseFormModal } from '../../../../../features/expense/expenseUISlice';
import { fbAddExpense } from '../../../../../firebase/expenses/Items/fbAddExpense';
import { fbUpdateExpense } from '../../../../../firebase/expenses/Items/fbUpdateExpense';
import { validateExpense } from '../../../../../validates/expenseValidate';

import { useOpenCashRegisters } from './useOpenCashRegisters';

export default function useExpensesForm(dispatch) {
  const user = useSelector(selectUser);
  const { isOpen } = useSelector(selectExpenseFormModal);
  const { expense, mode } = useSelector(selectExpense);
  const isAddMode = mode === 'add';

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({ isOpen: false, message: '' });
  const [files, setFiles] = useState([]);
  const [attachmentUrls, setUrls] = useState([]);
  const [removedAttachments, setRemoved] = useState([]);

  // Obtener los cuadres de caja abiertos
  const openCashRegisters = useOpenCashRegisters(user?.businessID, isOpen);

  // Calcular propiedades derivadas
  const showBank = ['credit_card', 'check', 'bank_transfer'].includes(expense?.payment?.method);
  const showCashRegister = expense?.payment?.method === 'open_cash';

  // Cargar los archivos adjuntos existentes
  useEffect(() => {
    if (!expense?.attachments?.length) {
      setUrls([]);
      return;
    }

    const remotes = expense.attachments
      .filter(att => att.url)
      .map(att => ({ ...att, url: typeof att.url === 'string' ? att.url : att.url.url }));

    setUrls(remotes);
  }, [expense?.attachments]);

  // Manejar actualización de campos del formulario
  const updateField = useCallback(
    (section, field, value) => {
      // Evitar guardar strings vacíos, podríamos usar null
      const safeValue = value === '' ? null : value;

      if (!section) {
        dispatch(setExpense({ [field]: safeValue }));
      } else {
        dispatch(setExpense({
          [section]: {
            ...expense[section],
            [field]: safeValue
          }
        }));
      }
    },
    [dispatch, expense]
  );

  // Resetear formulario
  const handleReset = useCallback(() => {
    dispatch(resetExpense());
    dispatch(closeExpenseFormModal());
    setErrors({});
    setFiles([]);
    setUrls([]);
    setRemoved([]);
  }, [dispatch]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async () => {
    const validationErrors = validateExpense(expense);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isAddMode) {
        await fbAddExpense(
          user,
          setLoading,
          { ...expense, attachments: attachmentUrls },
          files
        );
      } else {
        await fbUpdateExpense(
          user,
          setLoading,
          { ...expense, attachments: attachmentUrls },
          files,
          removedAttachments
        );
      }
      handleReset();
    } catch (err) {
      console.error("Error saving expense:", err);
      message.error('Error al guardar el gasto. Inténtelo de nuevo más tarde.');
    }
  }, [expense, files, isAddMode, handleReset, removedAttachments, attachmentUrls, user]);

  // Manejar archivos adjuntos
  const handleAddFiles = useCallback((newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFiles = useCallback((fileId) => {
    if (files.some(file => file.id === fileId)) {
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } else {
      const removedFile = attachmentUrls.find(file => file.id === fileId);
      if (removedFile) {
        const isFirebaseUrl = removedFile.url.includes('firebasestorage.googleapis.com');
        if (isFirebaseUrl) {
          setRemoved(prev => [...prev, removedFile]);
        }
      }
      setUrls(prev => prev.filter(file => file.id !== fileId));
    }
  }, [files, attachmentUrls]);

  return {
    // Estados
    user,
    expense,
    isAddMode,
    isOpen,
    errors,
    loading,
    files,
    attachmentUrls,
    openCashRegisters,

    // Propiedades derivadas
    showBank,
    showCashRegister,

    // Métodos
    updateField,
    handleReset,
    handleSubmit,
    handleAddFiles,
    handleRemoveFiles,
  };
}
