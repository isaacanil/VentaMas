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
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { useCategoryState } from '@/Context/CategoryContext/useCategoryState';
import { selectUser } from '@/features/auth/userSlice';
import { fbDeleteExpenseCategory } from '@/firebase/expenses/categories/fbDeleteExpenseCategory';
import { useFbGetExpensesCategories } from '@/firebase/expenses/categories/fbGetExpensesCategories';
import { fbRestoreExpenseCategory } from '@/firebase/expenses/categories/fbRestoreExpenseCategory';
import { fbUpdateExpenseCategory } from '@/firebase/expenses/categories/fbUpdateExpenseCategory';
import { toValidDate } from '@/utils/date/toValidDate';
import type { UserIdentity } from '@/types/users';
import type { ExpenseCategory, ExpenseCategoryDoc } from '@/utils/expenses/types';

const { Title, Text } = Typography;

const PAGE_SIZE = 8;

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

  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [restoringCategoryId, setRestoringCategoryId] = useState<string | null>(null);

  const expenseCategories = useMemo(() =>
    (categories as ExpenseCategoryDoc[])
      .map(({ category }) => category ?? {})
      .filter((category) => Boolean(category?.name))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
  [categories]);

  useEffect(() => {
    if (!open) {
      setDeletingCategoryId(null);
      setSearchTerm('');
      setCurrentPage(1);
      setShowArchived(false);
      setRestoringCategoryId(null);
    }
  }, [open]);

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

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(filteredCategories.length / PAGE_SIZE),
    );
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredCategories.length, currentPage]);

  const handleArchive = async (categoryId: string) => {
    try {
      setDeletingCategoryId(categoryId);
      await fbDeleteExpenseCategory(user, categoryId);
      notification.success({ message: 'Categoría archivada con éxito.' });
    } catch (error: any) {
      notification.error({
        message: 'No se pudo archivar la categoría.',
        description: error?.message,
      });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleRestore = async (categoryId: string) => {
    try {
      setRestoringCategoryId(categoryId);
      await fbRestoreExpenseCategory(user, categoryId);
      notification.success({ message: 'Categoría restaurada con éxito.' });
    } catch (error: any) {
      notification.error({
        message: 'No se pudo restaurar la categoría.',
        description: error?.message,
      });
    } finally {
      setRestoringCategoryId(null);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setCategory(category);
    configureCategoryModal({
      isOpen: true,
      type: 'update',
      onSubmit: fbUpdateExpenseCategory,
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
    const date = toValidDate(value);
    if (!date) return null;
    return date.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Modal
      open={open}
      title={<Title level={4}>Administrar categorías de gasto</Title>}
      onCancel={onClose}
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
        <Space direction="vertical" size={4}>
          <Text strong>Listado</Text>
          <Text type="secondary">{filteredCategories.length} categorías</Text>
          <Space size={8}>
            <Switch
              checked={showArchived}
              onChange={(checked) => {
                setShowArchived(checked);
                setCurrentPage(1);
              }}
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
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
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
                current: currentPage,
                pageSize: PAGE_SIZE,
                onChange: setCurrentPage,
                showSizeChanger: false,
                simple: true,
              }
            : false
        }
        renderItem={(category) => (
          <List.Item actions={[renderActions(category)]}>
            <Space direction="vertical" size={0}>
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
