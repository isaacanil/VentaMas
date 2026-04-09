import {
  Modal,
  List,
  Typography,
  Input,
  Button,
  Space,
  Popconfirm,
  notification,
  Switch,
  Tag,
} from 'antd';
import { useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { useCategoryState } from '@/Context/CategoryContext/useCategoryState';
import { selectUser } from '@/features/auth/userSlice';
import { fbDeleteExpenseCategory } from '@/firebase/expenses/categories/fbDeleteExpenseCategory';
import { useFbGetExpensesCategories } from '@/firebase/expenses/categories/fbGetExpensesCategories';
import { fbRestoreExpenseCategory } from '@/firebase/expenses/categories/fbRestoreExpenseCategory';
import { fbUpdateExpenseCategory } from '@/firebase/expenses/categories/fbUpdateExpenseCategory';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { toValidDate } from '@/utils/date/toValidDate';
import type { UserIdentity } from '@/types/users';
import type {
  ExpenseCategory,
  ExpenseCategoryDoc,
} from '@/utils/expenses/types';

const { Title, Text } = Typography;

const PAGE_SIZE = 8;

interface ManageCategoriesUiState {
  deletingCategoryId: string | null;
  restoringCategoryId: string | null;
  searchTerm: string;
  currentPage: number;
  showArchived: boolean;
}

type ManageCategoriesUiAction =
  | { type: 'reset' }
  | { type: 'setDeleting'; categoryId: string | null }
  | { type: 'setRestoring'; categoryId: string | null }
  | { type: 'setSearchTerm'; value: string }
  | { type: 'setCurrentPage'; page: number }
  | { type: 'setShowArchived'; value: boolean };

const initialManageCategoriesUiState: ManageCategoriesUiState = {
  deletingCategoryId: null,
  restoringCategoryId: null,
  searchTerm: '',
  currentPage: 1,
  showArchived: false,
};

const manageCategoriesUiReducer = (
  state: ManageCategoriesUiState,
  action: ManageCategoriesUiAction,
): ManageCategoriesUiState => {
  switch (action.type) {
    case 'reset':
      return initialManageCategoriesUiState;
    case 'setDeleting':
      return {
        ...state,
        deletingCategoryId: action.categoryId,
      };
    case 'setRestoring':
      return {
        ...state,
        restoringCategoryId: action.categoryId,
      };
    case 'setSearchTerm':
      return {
        ...state,
        searchTerm: action.value,
        currentPage: 1,
      };
    case 'setCurrentPage':
      return {
        ...state,
        currentPage: action.page,
      };
    case 'setShowArchived':
      return {
        ...state,
        showArchived: action.value,
        currentPage: 1,
      };
    default:
      return state;
  }
};

interface ManageExpenseCategoriesModalProps {
  open: boolean;
  onClose: () => void;
  onAddCategory?: () => void;
}

const ManageExpenseCategoriesModal = ({
  open,
  onClose,
  onAddCategory,
}: ManageExpenseCategoriesModalProps) => {
  const { categories } = useFbGetExpensesCategories();
  const user = useSelector(selectUser) as UserIdentity | null;
  const { setCategory, configureCategoryModal } = useCategoryState();
  const [uiState, dispatchUi] = useReducer(
    manageCategoriesUiReducer,
    initialManageCategoriesUiState,
  );
  const {
    deletingCategoryId,
    searchTerm,
    currentPage,
    showArchived,
    restoringCategoryId,
  } = uiState;

  const expenseCategories = useMemo(
    () =>
      (categories as ExpenseCategoryDoc[])
        .map(({ category }) => category ?? {})
        .filter((category) => Boolean(category?.name))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [categories],
  );

  const handleClose = () => {
    dispatchUi({ type: 'reset' });
    onClose();
  };

  const handleAddCategory = () => {
    if (typeof onAddCategory === 'function') {
      onAddCategory();
    }
  };

  const filteredCategories = useMemo(() => {
    const dataset = showArchived
      ? expenseCategories
      : expenseCategories.filter((category) => !category.isDeleted);

    if (!searchTerm) return dataset;

    const normalizedTerm = searchTerm.toLowerCase().trim();
    return dataset.filter((category) =>
      (category.name ?? '').toLowerCase().includes(normalizedTerm),
    );
  }, [expenseCategories, searchTerm, showArchived]);

  const maxPage = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, maxPage);

  const handleArchive = (categoryId: string) => {
    dispatchUi({ type: 'setDeleting', categoryId });
    void fbDeleteExpenseCategory(user, categoryId).then(
      () => {
        notification.success({ message: 'Categoría archivada con éxito.' });
        dispatchUi({ type: 'setDeleting', categoryId: null });
      },
      (error: any) => {
        notification.error({
          message: 'No se pudo archivar la categoría.',
          description: error?.message,
        });
        dispatchUi({ type: 'setDeleting', categoryId: null });
      },
    );
  };

  const handleRestore = (categoryId: string) => {
    dispatchUi({ type: 'setRestoring', categoryId });
    void fbRestoreExpenseCategory(user, categoryId).then(
      () => {
        notification.success({ message: 'Categoría restaurada con éxito.' });
        dispatchUi({ type: 'setRestoring', categoryId: null });
      },
      (error: any) => {
        notification.error({
          message: 'No se pudo restaurar la categoría.',
          description: error?.message,
        });
        dispatchUi({ type: 'setRestoring', categoryId: null });
      },
    );
  };

  const handleEdit = (category: ExpenseCategory) => {
    setCategory(category as any);
    configureCategoryModal({
      isOpen: true,
      type: 'edit',
      onSubmit: fbUpdateExpenseCategory as any,
    });
  };

  const renderActions = (category: ExpenseCategory) => {
    const categoryId = category.id ?? '';

    if (category.isDeleted) {
      return (
        <Button
          type="link"
          onClick={() => handleRestore(categoryId)}
          loading={restoringCategoryId === categoryId}
          icon={icons.operationModes.accept}
        >
          Restaurar
        </Button>
      );
    }

    return (
      <Space>
        <Button
          type="link"
          onClick={() => handleEdit(category)}
          icon={icons.operationModes.edit}
        >
          Editar
        </Button>
        <Popconfirm
          title="¿Archivar categoría?"
          description="La categoría dejará de estar disponible para nuevos gastos."
          okText="Archivar"
          okButtonProps={{
            danger: true,
            loading: deletingCategoryId === categoryId,
          }}
          cancelText="Cancelar"
          onConfirm={() => handleArchive(categoryId)}
        >
          <Button
            type="link"
            danger
            icon={icons.operationModes.delete}
            loading={deletingCategoryId === categoryId}
          >
            Archivar
          </Button>
        </Popconfirm>
      </Space>
    );
  };

  const formatDate = (value: unknown) => {
    const date = toValidDate(value as any);
    if (!date) return null;
    return formatLocaleDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Modal
      open={open}
      title={<Title level={4}>Administrar categorías de gasto</Title>}
      onCancel={handleClose}
      footer={null}
      style={{ top: '10px' }}
      width={560}
      destroyOnHidden
    >
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
        wrap
      >
        <Space orientation="vertical" size={4}>
          <Text strong>Listado</Text>
          <Text type="secondary">{filteredCategories.length} categorías</Text>
          <Space size={8}>
            <Switch
              checked={showArchived}
              onChange={(checked) =>
                dispatchUi({ type: 'setShowArchived', value: checked })
              }
              size="small"
            />
            <Text type="secondary">Mostrar archivadas</Text>
          </Space>
        </Space>
        <Space>
          <Input.Search
            placeholder="Buscar categoría"
            allowClear
            value={searchTerm}
            onChange={(event) =>
              dispatchUi({
                type: 'setSearchTerm',
                value: event.target.value,
              })
            }
            style={{ minWidth: 200 }}
          />
          <Button
            type="primary"
            icon={icons.operationModes.add}
            onClick={handleAddCategory}
          >
            Nueva categoría
          </Button>
        </Space>
      </Space>

      <List
        bordered
        dataSource={filteredCategories}
        rowKey={(category) => category.id ?? ''}
        locale={{ emptyText: 'Aún no hay categorías registradas.' }}
        pagination={
          filteredCategories.length > PAGE_SIZE
            ? {
                current: safeCurrentPage,
                pageSize: PAGE_SIZE,
                onChange: (page) =>
                  dispatchUi({ type: 'setCurrentPage', page }),
                showSizeChanger: false,
                simple: true,
              }
            : false
        }
        renderItem={(category) => (
          <List.Item actions={[renderActions(category)]}>
            <Space orientation="vertical" size={0}>
              <Space size={8}>
                <Text>{category.name}</Text>
                {category.isDeleted && (
                  <Tag color="red" style={{ marginInlineStart: 0 }}>
                    Archivada
                  </Tag>
                )}
              </Space>
              {category.isDeleted && category.deletedAt && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Archivada el {formatDate(category.deletedAt)}
                </Text>
              )}
            </Space>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default ManageExpenseCategoriesModal;
