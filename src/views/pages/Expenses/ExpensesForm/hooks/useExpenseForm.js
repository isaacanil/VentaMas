// src/features/expense/ExpensesForm/useExpensesForm.js
import { message } from 'antd';
import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../features/auth/userSlice';
import {
  selectExpense,
  resetExpense,
  setExpense,
} from '../../../../../features/expense/expenseManagementSlice';
import {
  closeExpenseFormModal,
  selectExpenseFormModal,
} from '../../../../../features/expense/expenseUISlice';
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
  const expenseAttachments = useMemo(
    () => expense?.attachments ?? [],
    [expense?.attachments],
  );

  const initialAttachmentUrls = useMemo(() => {
    if (!expenseAttachments.length) {
      return [];
    }

    return expenseAttachments
      .filter((att) => att?.url)
      .map((att) => ({
        ...att,
        url: typeof att.url === 'string' ? att.url : att.url?.url,
      }));
  }, [expenseAttachments]);

  const expenseKey =
    expense?.id ??
    expense?.expenseId ??
    expense?._id ??
    (isAddMode ? 'add' : 'edit');

  const attachmentsKey = useMemo(() => {
    if (!expenseAttachments.length) return '';
    return expenseAttachments
      .map((att) => {
        const id = att?.id ?? att?.name ?? '';
        const url =
          typeof att?.url === 'string' ? att.url : att?.url?.url ?? '';
        return `${id}:${url}`;
      })
      .join('|');
  }, [expenseAttachments]);

  const urlsTrigger = `${isOpen}-${expenseKey}-${attachmentsKey}`;
  const [{ trigger: urlsStateTrigger, value: urlsState }, setUrlsState] =
    useState(() => ({ trigger: urlsTrigger, value: initialAttachmentUrls }));

  const attachmentUrls =
    urlsStateTrigger === urlsTrigger ? urlsState : initialAttachmentUrls;

  const setUrls = useCallback(
    (updater) => {
      setUrlsState((prev) => {
        const current =
          prev.trigger === urlsTrigger ? prev.value : initialAttachmentUrls;
        const next = typeof updater === 'function' ? updater(current) : updater;
        return { trigger: urlsTrigger, value: next };
      });
    },
    [initialAttachmentUrls, urlsTrigger],
  );
  const [removedAttachments, setRemoved] = useState([]);

  // Obtener los cuadres de caja abiertos
  const openCashRegisters = useOpenCashRegisters(user?.businessID, isOpen);

  // Calcular propiedades derivadas
  const showBank = ['credit_card', 'check', 'bank_transfer'].includes(
    expense?.payment?.method,
  );
  const showCashRegister = expense?.payment?.method === 'open_cash';

  // attachmentUrls se inicializan desde `expense.attachments` sin usar `useEffect`

  // Manejar actualización de campos del formulario
  const updateField = useCallback(
    (section, field, value) => {
      // Evitar guardar strings vacíos, podríamos usar null
      const safeValue = value === '' ? null : value;

      if (!section) {
        dispatch(setExpense({ [field]: safeValue }));
      } else {
        dispatch(
          setExpense({
            [section]: {
              ...expense[section],
              [field]: safeValue,
            },
          }),
        );
      }
    },
    [dispatch, expense],
  );

  // Resetear formulario
  const handleReset = useCallback(() => {
    dispatch(resetExpense());
    dispatch(closeExpenseFormModal());
    setErrors({});
    setFiles([]);
    setUrls([]);
    setRemoved([]);
  }, [dispatch, setUrls]);

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
          files,
        );
      } else {
        await fbUpdateExpense(
          user,
          setLoading,
          { ...expense, attachments: attachmentUrls },
          files,
          removedAttachments,
        );
      }
      handleReset();
    } catch (err) {
      console.error('Error saving expense:', err);
      message.error('Error al guardar el gasto. Inténtelo de nuevo más tarde.');
    }
  }, [
    expense,
    files,
    isAddMode,
    handleReset,
    removedAttachments,
    attachmentUrls,
    user,
  ]);

  // Manejar archivos adjuntos
  const handleAddFiles = useCallback((newFiles) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFiles = useCallback(
    (fileId) => {
      if (files.some((file) => file.id === fileId)) {
        setFiles((prev) => prev.filter((file) => file.id !== fileId));
      } else {
        const removedFile = attachmentUrls.find((file) => file.id === fileId);
        if (removedFile) {
          const isFirebaseUrl = removedFile.url.includes(
            'firebasestorage.googleapis.com',
          );
          if (isFirebaseUrl) {
            setRemoved((prev) => [...prev, removedFile]);
          }
        }
        setUrls((prev) => prev.filter((file) => file.id !== fileId));
      }
    },
    [files, attachmentUrls, setUrls],
  );

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
