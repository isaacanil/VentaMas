import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, ButtonGroup } from '../../../templates/system/Button/Button';
import InputFile from '../../../templates/system/Form/InputFile/InputFile';
import { InputV4 } from '../../../templates/system/Inputs/GeneralInput/InputV4';
import Typography from '../../../templates/system/Typografy/Typografy';
import { icons } from '../../../../constants/icons/icons';
import { Select } from '../../../templates/system/Select/Select';
import { useCategoryState } from '../../../../Context/CategoryContext/CategoryContext';
import { useFbGetExpensesCategories } from '../../../../firebase/expenses/categories/fbGetExpensesCategories';
import { useNavigate } from 'react-router-dom';
import { fbAddExpense } from '../../../../firebase/expenses/Items/fbAddExpense';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { validateExpense } from '../../../../validates/expenseValidate';
import { resetExpense, selectExpense, setExpense } from '../../../../features/expense/expenseManagementSlice';
import { convertMillisToISO } from '../../../../utils/date/formatDate';
import { fbUpdateExpense } from '../../../../firebase/expenses/Items/fbUpdateExpense';
import { useGoBack } from '../../../../hooks/path/useGoBack';
import Loader from '../../../templates/system/loader/Loader';

const initExpense = {
    description: '',//descripción
    amount: 0,//importe
    dates: {
        expenseDate: '',//fecha de gasto
        createdAt: '',
    },
    receiptImageUrl: '',//recibo
    category: "",//categoria
};

const initErrors = {}

const ExpensesForm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(selectUser);

    const { categories } = useFbGetExpensesCategories();
    const { expense, mode } = useSelector(selectExpense);
    const defaultMode = mode === 'add';
    const updateExpense = (newExpense) => dispatch(setExpense(newExpense));
    // const [expense, setExpense] = useState(initExpense);
    const [errors, setErrors] = useState(initErrors);
    
    const [loading, setLoading] = useState({
        isOpen: false,
        message: '',
    });

    const goBack = () => navigate('/expenses/list');
    const [receiptImage, setReceiptImage] = useState(expense.receiptImageUrl ? expense.receiptImageUrl : null);

    const handleReset = () => {
        dispatch(resetExpense());
        setErrors(initErrors);
        receiptImage && setReceiptImage(null);
        goBack();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateExpense(expense);
        if (Object.keys(errors).length > 0) return setErrors(errors);
        try {
            if (defaultMode) {
                await fbAddExpense(user, setLoading, expense, receiptImage);
                handleReset()
            } else {
                await fbUpdateExpense(user, setLoading, expense, receiptImage);
                handleReset()
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleCancel = () => handleReset();

    const { configureAddExpenseCategoryModal } = useCategoryState();

    return (
        <Backdrop>
            <Container>
                <Loader useRedux={false} show={loading.isOpen} message={loading.message} theme={'light'} />
                <Typography variant='h2'>{defaultMode ? `Registro de Gastos` : `Actualizar Gasto`}</Typography>
                <Form onSubmit={handleSubmit} >
                    <Category>
                        <Select
                            required
                            data={categories}
                            displayKey={'category.name'}
                            title={'Categoría'}
                            labelVariant='label2'
                            onChange={(e) => updateExpense({ category: e.target.value?.category?.name })}
                            value={expense?.category}
                        />
                        <Button
                            startIcon={icons.mathOperations.add}
                            title='Categoria'
                            onClick={configureAddExpenseCategoryModal}
                        />
                    </Category>
                    <InputV4
                        id='description'
                        value={expense.description}
                        onChange={(e) => updateExpense({ description: e.target.value })}
                        onClear={() => updateExpense({ description: '' })}
                        label='Descripción: '
                        labelVariant='label2'
                        required
                        marginBottom
                        validate={errors.description}
                        errorMessage={errors.description}
                        size='medium'
                    />
                    <InputV4
                        type="date"
                        value={typeof expense.dates.expenseDate === 'number' ? convertMillisToISO(expense.dates.expenseDate) : expense.dates.expenseDate}
                        onChange={(e) => updateExpense({ dates: { ...expense.dates, expenseDate: e.target.value } })}
                        onClear={() => updateExpense({ dates: { ...expense.dates, expenseDate: '' } })}
                        label='Fecha de Gasto:'
                        labelVariant='label2'
                        marginBottom
                        required
                        size='medium'
                    />
                    <InputV4
                        id='amount'
                        size='medium'
                        type='number'
                        label='Importe:'
                        labelVariant='label2'
                        required
                        value={expense.amount || ''}
                        marginBottom
                        onClear={() => updateExpense({ amount: '' })}
                        onChange={(e) => updateExpense({ amount: Number(e.target.value) })}
                    />
                    <InputFile
                        label='Recibo:'
                        setImg={setReceiptImage}
                        img={receiptImage}
                        showNameFile
                        showImg
                    />
                    <ButtonGroup style={{ marginTop: "16px" }}>
                        <Button
                            type="submit"
                            title='Guardar'
                            bgcolor='primary'
                        />
                        <Button
                            type="button"
                            title='Cancelar'
                            bgcolor='gray'
                            onClick={handleCancel}
                        />
                    </ButtonGroup>
                </Form>
            </Container>
        </Backdrop>
    );
};

export default ExpensesForm;
const Backdrop = styled.div`
    background-color: ${prop => prop.theme.bg.color2};
`
const Container = styled.div`
   padding: 1em;
   width: 100%;
   max-width: 600px;
   height: 100vh;
   background-color: ${prop => prop.theme.bg.shade};
   display: grid;
   align-items: start;
   align-content: start;
   gap: 1em;
   margin: 0 auto;

`;

const Title = styled.h2`
    font-size: 24px;
    margin-bottom: 16px;
`;

const Form = styled.form`
   display: grid;
`;

const Category = styled.div`
    display: grid;
    grid-template-columns: 1fr min-content;
    gap: 0.4em;
    margin-bottom: 16px;
    align-items: end;
`;



