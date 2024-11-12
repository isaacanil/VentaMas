import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { icons } from '../../../../constants/icons/icons';
import {
    addAmountToProduct,
    diminishAmountToProduct,
    onChangeValueAmountToProduct,
    addPaymentMethodAutoValue
} from '../../../../features/cart/cartSlice';
import { Alert } from '../Product/Cart/Alert';
import styled from 'styled-components';

export const Counter = ({ amountToBuy, stock, id, item }) => {
    const dispatch = useDispatch();
    const [DeletePrevent, setDeletePrevent] = useState(false);
    const [inputAmount, setInputAmount] = useState(amountToBuy || 1); // Estado para el input

    useEffect(() => {
        setInputAmount(amountToBuy);
    }, [amountToBuy]);
    // Manejador para cambiar el valor del input en tiempo real
    const handleInputChange = (e) => {
        const value = parseInt(e.target.value, 10);

        // Validación en tiempo real si se debe restringir el stock
        if (item.restrictSaleWithoutStock && value > stock) {
            alert(`La cantidad solicitada no puede exceder el stock disponible (${stock} unidades).`);
            setInputAmount(stock);  // Limitar al stock máximo
        } else if (value > 0) {
            setInputAmount(value);  // Solo permitir valores positivos
            dispatch(onChangeValueAmountToProduct({ id, value }));
        }
    };

    // Manejador para aumentar la cantidad
    const handleIncreaseCounter = () => {
        const newValue = inputAmount + 1;
        if (item.restrictSaleWithoutStock && newValue > stock) {
            alert(`No puedes agregar más de ${stock} unidades.`);
        } else {
            setInputAmount(newValue);
            dispatch(addAmountToProduct({ id, value: newValue }));
        }
    };

    // Manejador para disminuir la cantidad
    const handleDiminishCounter = () => {
        if (inputAmount > 1) {
            const newValue = inputAmount - 1;
            setInputAmount(newValue);
            dispatch(diminishAmountToProduct({ id, value: newValue }));
        } else {
            setDeletePrevent(true); // Mostrar alerta si intenta disminuir por debajo de 1
        }
    };

    return (
        <Fragment>
            <Container>
                <ButtonCounter onClick={handleDiminishCounter}>
                    {icons.mathOperations.subtract}
                </ButtonCounter>
                <CounterDisplay
                    type="number"
                    value={inputAmount}
                    onChange={handleInputChange}  // Validación y actualización en tiempo real
                />
                <ButtonCounter
                    onClick={handleIncreaseCounter}
                    disabled={item.restrictSaleWithoutStock && inputAmount >= stock} // Deshabilitar si se alcanza el stock y hay restricción
                >
                    {icons.mathOperations.add}
                </ButtonCounter>
            </Container>
            <Alert
                id={id}
                isOpen={DeletePrevent}
                handleIsOpen={setDeletePrevent}
            />
        </Fragment>
    );
};

const Container = styled.div`
    display: grid;
    grid-template-columns: min-content 1fr min-content;
    align-items: center;
    background-color: var(--White3);
    height: 1.6em;
    padding: 0 0.2em;
    border-radius: 6px;
`;

const ButtonCounter = styled.button`
    border: none;
    outline: none;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background-color: var(--White);
    height: 1.4em;
    width: 1.4em;
    padding: 0.2em;
    &:focus {
        outline: none;
    }
    svg {
        color: var(--Gray6);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CounterDisplay = styled.input`
    border: 1px solid rgba(0, 0, 0, 0);
    width: 100%;
    text-align: center;
    font-size: 17px;
    outline: none;
    background-color: transparent;
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;
