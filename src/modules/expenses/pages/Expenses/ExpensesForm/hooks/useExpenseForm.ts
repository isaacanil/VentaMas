import { message } from 'antd';
import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  selectExpense,
  resetExpense,
  setExpense,
} from '@/features/expense/expenseManagementSlice';
import {
  closeExpenseFormModal,
  selectExpenseFormModal,
} from '@/features/expense/expenseUISlice';
import { fbAddExpense } from '@/firebase/expenses/Items/fbAddExpense';
import { fbUpdateExpense } from '@/firebase/expenses/Items/fbUpdateExpense';
import type { UserIdentity } from '@/types/users';
import type {
  Expense,
  ExpenseAttachment,
  ExpenseAttachmentInput,
} from '@/utils/expenses/types';
import type { EvidenceFileInput } from '@/components/common/EvidenceUpload/types';
import {
  validateExpense,
  type ExpenseValidationErrors,
} from '@/validates/expenseValidate';

import { useOpenCashRegisters } from './useOpenCashRegisters';

interface ExpenseSliceState {
  expense: Expense;
  mode: string;
}

interface ExpenseFormModalState {
  isOpen: boolean;
}

interface LoadingState {
  isOpen: boolean;
  message: string;
}

type AttachmentUrl = Omit<ExpenseAttachment, 'url'> & { url: string };

export default function useExpensesForm(dispatch: any) {
  const user = useSelector(selectUser) as UserIdentity | null;
  const { isOpen } = useSelector(selectExpenseFormModal) as ExpenseFormModalState;
  const { expense, mode } = useSelector(selectExpense) as ExpenseSliceState;
  const isAddMode = mode === 'add';

  const [errors, setErrors] = useState<ExpenseValidationErrors>({});
  const [loading, setLoading] = useState<LoadingState>({
    isOpen: false,
    message: '',
  });
  const [files, setFiles] = useState<ExpenseAttachmentInput[]>([]);
  const expenseAttachments = useMemo<ExpenseAttachment[]>(
    () => expense?.attachments ?? [],
    [expense?.attachments],
  );

  const initialAttachmentUrls = useMemo<AttachmentUrl[]>(() => {
    if (!expenseAttachments.length) {
      return [];
    }

    return expenseAttachments
      .filter((att) => att?.url)
      .map((att) => ({
        ...att,
        url: typeof att.url === 'string' ? att.url : att.url?.url,
      }))
      .filter((att): att is AttachmentUrl => Boolean(att.url));
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
    useState<{ trigger: string; value: AttachmentUrl[] }>(() => ({
      trigger: urlsTrigger,
      value: initialAttachmentUrls,
    }));

  const attachmentUrls =
    urlsStateTrigger === urlsTrigger ? urlsState : initialAttachmentUrls;

  const setUrls = useCallback(
    (
      updater:
        | AttachmentUrl[]
        | ((current: AttachmentUrl[]) => AttachmentUrl[]),
    ) => {
      setUrlsState((prev) => {
        const current =
          prev.trigger === urlsTrigger ? prev.value : initialAttachmentUrls;
        const next = typeof updater === 'function' ? updater(current) : updater;
        return { trigger: urlsTrigger, value: next };
      });
    },
    [initialAttachmentUrls, urlsTrigger],
  );
  const [removedAttachments, setRemoved] = useState<AttachmentUrl[]>([]);

  // Obtener los cuadres de caja abiertos
  const openCashRegisters = useOpenCashRegisters(user?.businessID, isOpen);

  // Calcular propiedades derivadas
  const showBank = ['credit_card', 'check', 'bank_transfer'].includes(
    expense?.payment?.method ?? '',
  );
  const showCashRegister = expense?.payment?.method === 'open_cash';

  // attachmentUrls se inicializan desde `expense.attachments` sin usar `useEffect`

  // Manejar actualización de campos del formulario
  const updateField = useCallback(
    (section: string | null, field: string, value: unknown) => {
      // Evitar guardar strings vacíos, podríamos usar null
      const safeValue = value === '' ? null : value;

      if (!section) {
        dispatch(setExpense({ [field]: safeValue }));
      } else {
        dispatch(
          setExpense({
            [section]: {
              ...(expense as any)[section],
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
    attachmentUrls,
    expense,
    files,
    handleReset,
    isAddMode,
    removedAttachments,
    user,
  ]);

  // Manejar archivos adjuntos
  const handleAddFiles = useCallback((newFiles: EvidenceFileInput[]) => {
    const mappedFiles = newFiles.flatMap((file) => {
      if (!file.file) return [];
      return [
        {
          id: file.id,
          name: file.name,
          type: file.type,
          file: file.file,
        },
      ] satisfies ExpenseAttachmentInput[];
    });
    setFiles((prev) => [...prev, ...mappedFiles]);
  }, []);

  const handleRemoveFiles = useCallback(
    (fileId: string) => {
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
