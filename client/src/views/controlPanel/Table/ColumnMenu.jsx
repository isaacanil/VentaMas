import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../templates/system/Button/Button';
import styled from 'styled-components';
import { icons } from '../../../constants/icons/icons';
import { AnimatePresence, AnimateSharedLayout, motion } from 'framer-motion';
import { FormattedValue } from '../../templates/system/FormattedValue/FormattedValue';

import { useClickOutSide } from '../../../hooks/useClickOutSide';
export const ColumnMenu = ({ isOpen = false, toggleOpen, columns, columnOrder, setColumnOrder, }) => {
    const [highlightedItems, setHighlightedItems] = useState([]);
    const MenuRef = useRef(null);
    useEffect(() => {
        if (highlightedItems.length > 0) {
            // Quita el resaltado después de 2 segundos.
            const timerId = setTimeout(() => {
                setHighlightedItems([]);
            }, 2000);

            return () => clearTimeout(timerId); // Limpia el temporizador si el componente se desmonta.
        }
    }, [highlightedItems]);

    const moveColumn = (fromIndex, direction) => {
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= columnOrder.length) return; // No mover si está en los límites

        setHighlightedItems([fromIndex, toIndex]);
        const newColumnOrder = [...columnOrder];
        const [movedColumn] = newColumnOrder.splice(fromIndex, 1);

        // Puedes usar una animación aquí para "ocultar" el ítem antes de moverlo
        setTimeout(() => {
            newColumnOrder.splice(toIndex, 0, movedColumn);
            setColumnOrder(newColumnOrder);
            // Actualiza el estado para mostrar el ítem nuevamente
            setVisibleColumns(newColumnOrder);
        }, 1000); // Aquí puedes ajustar el tiempo según lo necesites

        // Actualiza el estado para "ocultar" el ítem
        setVisibleColumns(columnOrder.filter((col, index) => index !== fromIndex));
    };

    useClickOutSide(MenuRef, isOpen, toggleOpen);

    return (
        isOpen && (
            <Backdrop>
                <Menu ref={MenuRef}>
                    <Head>
                        <Info>

                            <FormattedValue value={'Organizar Columnas'} type={'title'} size={'medium'} />
                            <FormattedValue value={'Usa los btn para cambiar la ubicacion'} type={'paragraph'} size={'small'} />
                        </Info>
                        <Button
                            title={icons.operationModes.close}
                            onClick={toggleOpen || alert('agrega una funcion al menu de columnas')}
                        />
                    </Head>
                    <Body>

                        <AnimatePresence>
                            {columnOrder.map((column, index) => (
                                <MenuItem
                                    key={column}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        backgroundColor: highlightedItems.includes(index) ? 'var(--color2)' : 'white',

                                    }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {column?.Header}
                                    <div>
                                        <button onClick={() => moveColumn(index, 'up')}>{icons.arrows.chevronUp}</button>
                                        <button onClick={() => moveColumn(index, 'down')}>{icons.arrows.chevronDown}</button>
                                    </div>
                                </MenuItem>
                            ))}
                        </AnimatePresence>
                    </Body>
                </Menu>
            </Backdrop>
        )

    );
};

const Backdrop = styled(motion.div)`
    position: fixed;
    top: 0;
    bottom:0;
    left: 0;
    right: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 9999999999999999999;

    display: flex;
    justify-content: center;
    align-items: center;
`;
const Head = styled.div`
    display: flex;
    justify-content: space-between;
`
const Info = styled.div``
const Body = styled.div``
const Menu = styled(motion.ul)`
display: grid;
gap: 1.5em;
align-content: flex-start;
  list-style: none;
  padding: 0;
  margin: 5px 0 0;
  padding: 1em;
  border-radius: var(--border-radius);
  background-color: #ffffff;
  border: 1px solid #ccc;
  box-shadow: 0 0 5px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
  height: calc(500px);
`;

const MenuItem = styled(motion.li)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
  }
`;