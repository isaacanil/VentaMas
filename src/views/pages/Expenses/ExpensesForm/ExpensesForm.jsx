import { Button, Input, Select, Form, DatePicker, Modal } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../constants/icons/icons';
import { useCategoryState } from '../../../../Context/CategoryContext';
import { useFbGetExpensesCategories } from '../../../../firebase/expenses/categories/fbGetExpensesCategories';
import EvidenceUpload from '../../../component/EvidenceUpload/EvidenceUpload';
import Loader from '../../../templates/system/loader/Loader';

import useExpensesForm from './hooks/useExpenseForm';


// Configuración de dayjs
dayjs.extend(customParseFormat);
dayjs.locale('es');

const CategorySelectContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const PAYMENT_METHODS = [
    { value: 'open_cash', label: 'Efectivo de Caja Abierta' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'credit_card', label: 'Tarjeta de Crédito' },
    { value: 'check', label: 'Cheque' },
    { value: 'bank_transfer', label: 'Transferencia' }
];

const ExpensesForm = () => {
    const dispatch = useDispatch();
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
        () => categories
        .filter(({ category }) => category?.name)
        .map(({ category }) => ({ label: category?.name, value: category?.id })),
        [categories],
    );

    return (
        <Modal
            title={isAddMode ? "Registro de Gastos" : "Actualizar Gasto"}
            open={isOpen}
            onCancel={handleReset}
            footer={[
                <Button key="cancel" type="default" onClick={handleReset} icon={<i className="fas fa-times" />}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" onClick={handleSubmit} icon={<i className="fas fa-save" />}>
                    {isAddMode ? "Guardar Gasto" : "Actualizar Gasto"}                </Button>
            ]}
            style={{ top: 10 }}
            width={600}
            destroyOnHidden
            centered
            maskClosable={false}
        >
            <Loader useRedux={false} show={loading.isOpen} message={loading.message} theme={'light'} />

            <Form layout="vertical">
                <Form.Item
                    label="Descripción"
                    required
                    validateStatus={errors.description ? "error" : ""}
                    help={errors.description}
                >
                    <Input.TextArea
                        id='description'
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
                    validateStatus={errors.category ? "error" : ""}
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
                                const selectedCategory = categoryOptions.find(cat => cat.value === value);
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
                    </CategorySelectContainer>
                </Form.Item>

                <Form.Item
                    label="Fecha de Gasto"
                    required
                    validateStatus={errors.dates?.expenseDate ? "error" : ""}
                    help={errors.dates?.expenseDate}
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        placeholder="Seleccione fecha"
                        value={expense.dates.expenseDate ? dayjs(expense.dates.expenseDate) : dayjs()}
                        onChange={date => updateField('dates', 'expenseDate', date.valueOf())}
                    />
                </Form.Item>
                <Form.Item
                    label="Importe"
                    required
                    validateStatus={errors.amount ? "error" : ""}
                    help={errors.amount}
                >
                    <Input
                        id='amount'
                        type='number'
                        value={expense.amount || ''}
                        style={{ width: '200px' }}
                        prefix="$"
                        placeholder="0.00"
                        allowClear
                        onChange={(e) => updateField('', 'amount', Number(e.target.value))}
                    />
                </Form.Item>

                <Form.Item
                    label="NCF (Número de Comprobante Fiscal)"
                >
                    <Input
                        value={expense.invoice?.ncf || ''}
                        placeholder="Ingrese el NCF"
                        onChange={(e) => updateField('invoice', 'ncf', e.target.value)}
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    label="Método de Pago"
                >
                    <Select
                        placeholder="Seleccione el método de pago"
                        options={PAYMENT_METHODS}
                        value={expense.payment?.method || undefined}
                        onChange={(value) => updateField('payment', 'method', value)}
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                {showBank && (
                    <Form.Item
                        label="Banco"
                    >
                        <Input
                            value={expense.payment?.bank || ''}
                            placeholder="Ingrese el banco"
                            onChange={(e) => updateField('payment', 'bank', e.target.value)}
                            allowClear
                        />
                    </Form.Item>
                )}

                {showCashRegister && (
                    <Form.Item
                        label="Cuadre de Caja"
                    >
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
                    rules={[
                        { required: false, message: 'Ingrese un comentario' },
                    ]}
                >
                    <Input.TextArea
                        value={expense.payment?.comment || ''}
                        placeholder="Ingrese comentarios adicionales"
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onChange={(e) => updateField('payment', 'comment', e.target.value)}
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    label="Archivos Adjuntos"
                >
                    <EvidenceUpload
                        files={files}
                        attachmentUrls={attachmentUrls}
                        onAddFiles={handleAddFiles}
                        onRemoveFiles={handleRemoveFiles}
                        showFileList
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ExpensesForm;
