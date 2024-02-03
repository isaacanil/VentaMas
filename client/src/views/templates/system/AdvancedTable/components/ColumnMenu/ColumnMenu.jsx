import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, AnimateSharedLayout, motion } from 'framer-motion';

import { useClickOutSide } from '../../../../../../hooks/useClickOutSide';
//import { Button } from '../../../Button/Button';
import { FormattedValue } from '../../../FormattedValue/FormattedValue';
import { icons } from '../../../../../../constants/icons/icons';

import * as antd from 'antd';

const { Modal, List, Tooltip, Form, Tabs, Button, Typography } = antd;
const { TabPane } = Tabs;

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

    useEffect(() => {
        localStorage.setItem('columnOrder', JSON.stringify(columnOrder));
    }, [columnOrder]);

    const removeColumn = (accessor) => {
        // Primero, actualiza el estado de la columna a 'deleted'
        const updatedColumns = columnOrder.map(col =>
            col.accessor === accessor ? { ...col, status: 'deleted' } : col
        );

        // Luego, mueve la columna eliminada al final del arreglo
        const columnToRemove = updatedColumns.find(col => col.accessor === accessor);
        const columnsWithoutRemoved = updatedColumns.filter(col => col.accessor !== accessor);
        const newColumnOrder = [...columnsWithoutRemoved, columnToRemove];

        setColumnOrder(newColumnOrder);
    }

    // const restoreColumn = (accessor) => {
    //     const updatedColumns = columnOrder.map(col => col.accessor === accessor ? { ...col, status: 'active' } : col);
    //     setColumnOrder(updatedColumns);
    // };

    const restoreAllColumns = () => {
        const updatedColumns = columnOrder.map(col => ({ ...col, status: 'active' }));
        setColumnOrder(updatedColumns);
    };
    const initialColumnOrder = columns.map((col, index) => ({
        ...col,
        originalPosition: index,
        status: 'active' // Asegúrate de que todas las columnas comiencen con el estado 'active'
    }));

    const restoreColumn = (accessor) => {
        // Encuentra la columna eliminada y su posición original
        const columnToRestoreIndex = columnOrder.findIndex(col => col.accessor === accessor);
        const columnToRestore = columnOrder[columnToRestoreIndex];
        const { originalPosition } = columnToRestore;
      
        // Crea una nueva lista de columnas sin la columna eliminada
        let updatedColumns = columnOrder.filter(col => col.accessor !== accessor);
      
        // Inserta la columna en su posición original
        updatedColumns.splice(originalPosition, 0, {
          ...columnToRestore,
          status: 'active'
        });
      
        // Asegúrate de que no haya elementos con el mismo accessor después de la posición original
        updatedColumns = updatedColumns.filter((col, index) => {
          return !(col.accessor === accessor && index > originalPosition);
        });
      
        setColumnOrder(updatedColumns);
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
        return columnOrder.filter(column => column.status === 'deleted');
    };
    const disableMoveUp = (index) => {
        // Deshabilita el botón de subir si es el primer elemento o si el anterior es no reordenable
        return index === 0 || columnOrder[index - 1].reorderable === false;
    };

    const disableMoveDown = (index) => {
        // Deshabilita el botón de bajar si es el último elemento o si el siguiente es no reordenable
        return index === columnOrder.length - 1 || columnOrder[index + 1].reorderable === false;
    };

    useClickOutSide(MenuRef, isOpen, toggleOpen);
    const tabPanes = [
        {
            key: '1',
            tab: 'Columnas Activas',
            content: (
                <MenuItems>
                    <AnimatePresence>
                        {columnOrder
                            .filter(col => col.status === 'active')
                            .map((column, index) => (
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
                                                    icon={icons.arrows.chevronUp}
                                                    type='text'
                                                    disabled={disableMoveUp(index)}
                                                />
                                                <Button
                                                    onClick={() => moveColumn(index, 'down')}
                                                    icon={icons.arrows.chevronDown}
                                                    type='text'
                                                    disabled={disableMoveDown(index)}
                                                />
                                                <Button
                                                    onClick={() => removeColumn(column.accessor)}
                                                    icon={icons.operationModes.close}
                                                    danger

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
            )
        },
        {
            key: '2',
            tab: 'Columnas Ocultas',
            content: (

                <MenuItems>
                    {getDeletedColumns().map(column => (
                        <MenuItem key={column.accessor}>
                            <span>{column.Header} (eliminada)</span>
                            <Button

                                onClick={() => restoreColumn(column.accessor)}
                            >
                                Restaurar
                            </Button>
                        </MenuItem>
                    ))}
                </MenuItems>
            )
        }
    ];
    return (
        <Modal
            open={isOpen}
            title={"Configuración de las columnas"}
            onCancel={toggleOpen}
            style={{
                top: 10
            }}
            footer={
                null
            }
        >
            <Body>
                <Tabs defaultActiveKey="1">
                    {tabPanes.map(pane => (
                        <TabPane tab={pane.tab} key={pane.key}>
                            {pane.content}
                        </TabPane>
                    ))}
                </Tabs>
            </Body>
            <br />
            <Typography.Title level={5} >Revertir Cambios</Typography.Title>
            <Typography.Paragraph >Restablece el orden original de las columnas y reactiva las columnas eliminadas</Typography.Paragraph>
            <Footer>
           

                <Button
                    title={''}
                    onClick={resetColumnOrder}
                >
                    Restaurar
                </Button>
                
            </Footer>

        </Modal>



    );
};


const Footer = styled.div`
display: grid;
grid-template-columns: 1fr;
gap: 1em;
`

const Body = styled.div`
    display: grid;
    gap: 1em;
`

const MenuItems = styled(motion.ul)`
    list-style: none;
    padding: 0.2em;
    margin: 0;
    width: 100%;
    background-color: #F5F5F5;
    min-height: 300px;
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

