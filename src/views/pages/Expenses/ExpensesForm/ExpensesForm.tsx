import { Button, Input, Select, Form, Modal } from 'antd';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';
import { icons } from '@/constants/icons/icons';
import { useCategoryState } from '@/Context/CategoryContext/useCategoryState';
import { useFbGetExpensesCategories } from '@/firebase/expenses/categories/fbGetExpensesCategories';
import { toMillis } from '@/utils/date/toMillis';
import { EXPENSE_PAYMENT_METHODS } from '@/utils/expenses/constants';
import type { ExpenseCategoryDoc } from '@/utils/expenses/types';
import EvidenceUpload from '@/views/component/EvidenceUpload/EvidenceUpload';
import Loader from '@/views/templates/system/loader/Loader';

import ManageExpenseCategoriesModal from './components/ManageExpenseCategoriesModal';
import useExpensesForm from './hooks/useExpenseForm';

const CategorySelectContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
`;

const ExpensesForm = () => {
  const dispatch = useDispatch();
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const { categories } = useFbGetExpensesCategories();
  const { configureAddExpenseCategoryModal } = useCategoryState();

  const {
    expense,
    isAddMode,
    isOpen,
    errors,
    loading,
    files,
    attachmentUrls,
    openCashRegisters,
    showBank,
    showCashRegister,
    updateField,
    handleReset,
    handleSubmit,
    handleAddFiles,
    handleRemoveFiles,
  } = useExpensesForm(dispatch);

  const categoryOptions = useMemo(
    () =>
      (categories as ExpenseCategoryDoc[])
        .filter(({ category }) => category?.name && !category?.isDeleted)
        .map(({ category }) => ({
          label: category?.name ?? '',
          value: category?.id ?? '',
        })),
    [categories],
  );

  const expenseDateValue = toMillis(expense.dates?.expenseDate);

  return (
    <Modal
      title={isAddMode ? 'Registro de Gastos' : 'Actualizar Gasto'}
      open={isOpen}
      onCancel={handleReset}
      footer={[
        <Button
          key="cancel"
          type="default"
          onClick={handleReset}
          icon={<i className="fas fa-times" />}
        >
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          icon={<i className="fas fa-save" />}
        >
          {isAddMode ? 'Guardar Gasto' : 'Actualizar Gasto'}
        </Button>,
      ]}
      style={{ top: 10 }}
      width={600}
      destroyOnHidden
      centered
      maskClosable={false}
    >
      <Loader
        useRedux={false}
        show={loading.isOpen}
        message={loading.message}
        theme={'light'}
      />

      <Form layout="vertical">
        <Form.Item
          label="Descripción"
          required
          validateStatus={errors.description ? 'error' : ''}
          help={errors.description}
        >
          <Input.TextArea
            id="description"
            value={expense.description}
            placeholder="Describa el motivo del gasto"
            autoSize={{ minRows: 1, maxRows: 4 }}
            onChange={(e) => updateField('', 'description', e.target.value)}
            allowClear
          />
        </Form.Item>
        <Form.Item
          label="Categoría"
          required
          validateStatus={errors.category ? 'error' : ''}
          help={errors.category}
        >
          <CategorySelectContainer>
            <Select
              placeholder="Seleccione una categoría"
              showSearch
              optionFilterProp="label"
              options={categoryOptions}
              value={expense?.categoryId}
              onChange={(value) => {
                const selectedCategory = categoryOptions.find(
                  (cat) => cat.value === value,
                );
                if (selectedCategory) {
                  // Guardar tanto el ID como el nombre de la categoría
                  updateField('', 'categoryId', value);
                  updateField('', 'category', selectedCategory.label);
                }
              }}
            />
            <Button
              type="primary"
              icon={icons.operationModes.add}
              title="Añadir nueva categoría"
              onClick={configureAddExpenseCategoryModal}
            />
            <Button
              icon={icons.operationModes.setting}
              title="Administrar categorías"
              onClick={() => setIsManageCategoriesOpen(true)}
            />
          </CategorySelectContainer>
        </Form.Item>

        <Form.Item
          label="Fecha de Gasto"
          required
          validateStatus={errors.dates?.expenseDate ? 'error' : ''}
          help={errors.dates?.expenseDate}
        >
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="Seleccione fecha"
            value={
              Number.isFinite(expenseDateValue)
                ? DateTime.fromMillis(expenseDateValue as number)
                : DateTime.now()
            }
            onChange={(date) =>
              updateField('dates', 'expenseDate', date ? date.toMillis() : null)
            }
          />
        </Form.Item>
        <Form.Item
          label="Importe"
          required
          validateStatus={errors.amount ? 'error' : ''}
          help={errors.amount}
        >
          <Input
            id="amount"
            type="number"
            value={expense.amount || ''}
            style={{ width: '200px' }}
            prefix="$"
            placeholder="0.00"
            allowClear
            onChange={(e) => updateField('', 'amount', Number(e.target.value))}
          />
        </Form.Item>

        <Form.Item label="NCF (Número de Comprobante Fiscal)">
          <Input
            value={expense.invoice?.ncf || ''}
            placeholder="Ingrese el NCF"
            onChange={(e) => updateField('invoice', 'ncf', e.target.value)}
            allowClear
          />
        </Form.Item>

        <Form.Item label="Método de Pago">
          <Select
            placeholder="Seleccione el método de pago"
            options={EXPENSE_PAYMENT_METHODS}
            value={expense.payment?.method || undefined}
            onChange={(value) => updateField('payment', 'method', value)}
            style={{ width: '100%' }}
          />
        </Form.Item>

        {showBank && (
          <Form.Item label="Banco">
            <Input
              value={expense.payment?.bank || ''}
              placeholder="Ingrese el banco"
              onChange={(e) => updateField('payment', 'bank', e.target.value)}
              allowClear
            />
          </Form.Item>
        )}

        {showCashRegister && (
          <Form.Item label="Cuadre de Caja">
            <Select
              placeholder="Seleccione el cuadre de caja"
              options={openCashRegisters}
              value={expense.payment?.cashRegister || undefined}
              onChange={(value) => updateField('payment', 'cashRegister', value)}
              style={{ width: '100%' }}
              notFoundContent="No hay cuadres de caja abiertos"
            />
          </Form.Item>
        )}

        <Form.Item
          label="Comentario"
          rules={[{ required: false, message: 'Ingrese un comentario' }]}
        >
          <Input.TextArea
            value={expense.payment?.comment || ''}
            placeholder="Ingrese comentarios adicionales"
            autoSize={{ minRows: 2, maxRows: 4 }}
            onChange={(e) => updateField('payment', 'comment', e.target.value)}
            allowClear
          />
        </Form.Item>

        <Form.Item label="Archivos Adjuntos">
          <EvidenceUpload
            files={files}
            attachmentUrls={attachmentUrls}
            onAddFiles={handleAddFiles}
            onRemoveFiles={handleRemoveFiles}
            showFileList
          />
        </Form.Item>
      </Form>
      <ManageExpenseCategoriesModal
        open={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onAddCategory={configureAddExpenseCategoryModal}
      />
    </Modal>
  );
};

export default ExpensesForm;
