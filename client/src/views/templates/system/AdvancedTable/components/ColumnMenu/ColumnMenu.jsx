import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, AnimateSharedLayout, motion } from 'framer-motion';

import { useClickOutSide } from '../../../../../../hooks/useClickOutSide';
import { Button } from '../../../Button/Button';
import { FormattedValue } from '../../../FormattedValue/FormattedValue';
import { icons } from '../../../../../../constants/icons/icons';

export const ColumnMenu = ({ isOpen = false, toggleOpen, columns, columnOrder, setColumnOrder, resetColumnOrder }) => {
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

    const removeColumn = (accessor) => {
        setColumnOrder(prev => prev.filter(col => col.accessor !== accessor));
    };

    const restoreColumn = (accessor) => {
        const restoredColumn = columns.find(column => column.accessor === accessor);
        const originalIndex = columns.findIndex(column => column.accessor === accessor);
        setColumnOrder(prevOrder => [
            ...prevOrder.slice(0, originalIndex),
            restoredColumn,
            ...prevOrder.slice(originalIndex)
        ]);
    };
    const restoreAllColumns = () => {
        const missingColumns = columns.filter(
            column => !columnOrder.find(orderColumn => orderColumn.accessor === column.accessor)
        );

        const newColumnOrder = [...columnOrder];
        missingColumns.forEach(missingColumn => {
            const originalIndex = columns.findIndex(column => column.accessor === missingColumn.accessor);
            newColumnOrder.splice(originalIndex, 0, missingColumn);
        });

        setColumnOrder(newColumnOrder);
    };

    const moveColumn = (fromIndex, direction) => {
        if (columnOrder[fromIndex].reorderable === false) return; // No mover si no es reordenable = false

        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= columnOrder.length) return; // No mover si está en los límites

        if (columnOrder[toIndex].reorderable === false) return;  // Si la columna a la que se va a mover no es reordenable, no permitir el movimiento
        const newColumnOrder = [...columnOrder];
        const [movedColumn] = newColumnOrder.splice(fromIndex, 1);
        setHighlightedItems([movedColumn.accessor]);

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
    const getDeletedColumns = () => {
        return columns.filter(
            column => !columnOrder.some(orderColumn => orderColumn.accessor === column.accessor)
        );
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
                        <MenuItems>
                            <AnimatePresence>
                                {columnOrder.map((column, index) => (
                                    <MenuItem
                                        key={column.accessor} // Utiliza el accessor como clave
                                        reorderable={column.reorderable === false}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            backgroundColor: highlightedItems.includes(column.accessor) ? 'var(--color2)' : 'white',

                                        }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {column?.Header}
                                        <div>
                                            {column.reorderable !== false && (
                                                <>
                                                    <Button
                                                        onClick={() => moveColumn(index, 'up')}
                                                        title={icons.arrows.chevronUp}
                                                        width={'icon24'}
                                                    />
                                                    <Button
                                                        onClick={() => moveColumn(index, 'down')}
                                                        title={icons.arrows.chevronDown}
                                                        width={'icon24'}

                                                    />
                                                    <Button
                                                        onClick={() => removeColumn(column.accessor)}
                                                        title={icons.operationModes.discard}
                                                        borderRadius={'light'}
                                                        color={'error'}
                                                        width={'icon24'}
                                                    />
                                                    {/* <button onClick={() => moveColumn(index, 'up')}>{icons.arrows.chevronUp}</button> */}
                                                    {/* <button onClick={() => moveColumn(index, 'down')}>{icons.arrows.chevronDown}</button> */}
                                                    {/* <button onClick={() => removeColumn(column.accessor)}>{icons.operationModes.discard}</button> */}
                                                </>
                                            )}
                                        </div>
                                    </MenuItem>
                                ))}
                            </AnimatePresence>
                        </MenuItems>
                        <MenuItems>
                            {getDeletedColumns().map(column => (
                                <MenuItem key={column.accessor}>
                                    <span>{column.Header} (eliminada)</span>
                                    <Button
                                        title='Restaurar'
                                        onClick={() => restoreColumn(column.accessor)}
                                    />
                                </MenuItem>
                            ))}
                        </MenuItems>
                    </Body>
                    <Footer>
                        <Button
                            title={'Restablecer orden de columnas'}
                            onClick={resetColumnOrder}
                        />
                        <Button
                            title={'Recuperar columnas Eliminadas'}
                            onClick={restoreAllColumns}
                        />
                    </Footer>
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
const Footer = styled.div`
`
const Info = styled.div``
const Body = styled.div`
    display: grid;
    gap: 1em;
`
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
const MenuItems = styled(motion.ul)`
    list-style: none;
    padding: 0.2em;
    margin: 0;
    width: 100%;
    background-color: #F5F5F5;
`;
const MenuItem = styled(motion.li)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background-color: ${props => props.reorderable ? '#f5f4f4 !important' : 'white '};
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
 div{
    display: flex;
    gap: 0.2em;
    
 }
`;

