import { useVirtualizer } from "@tanstack/react-virtual";
import { Spin } from "antd";
import { debounce } from 'lodash';
import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import ROUTES_NAME from "../../../../../../routes/routesName";
import { CenteredText } from "../../../../../templates/system/CentredText";
import { StatusBar } from "../../StatusBar/StatusBar";

import ItemRow from "./ItemRow";

const columnByWidth = {
    600: 1,
    900: 2,
    1100: 3,
    1500: 4,
    1800: 5,
    2100: 6,
    2400: 7,
    2700: 8,
}

const getColumns = (width) => {
    const columns = Object.keys(columnByWidth).find((w) => w > width);
    return columnByWidth[columns] || 1; // Default a 1 columna si no encuentra coincidencia
};


export const ProductList = ({ products, productsLoading, statusMeta = {} }) => {
    const parentRef = useRef();
    // const [listContainerHeight, setListContainer] = useState();
    const [columns, setColumns] = useState(4);
    const navigate = useNavigate();

    const updateColumns = useCallback(() => {
        if (parentRef.current) {
            setColumns(getColumns(parentRef.current.clientWidth));
            // setListContainer(parentRef.current.clientWidth);
        }
    }, []);

    const debouncedUpdateColumns = useCallback(
        debounce(updateColumns, 250),
        []
    );

    useEffect(() => {
        updateColumns();
        window.addEventListener('resize', debouncedUpdateColumns);
        return () => {
            window.removeEventListener('resize', debouncedUpdateColumns);
            debouncedUpdateColumns.cancel();
        };
    }, []);

    // Configuraciones de la grilla
    const itemCount = products.length; // Total de elementos en la grilla
    const cellHeight = 88; // Altura de cada celda de la grilla
    const totalRows = Math.ceil(itemCount / columns);
    const bottomSpacerRows = 1; // Una fila extra para despejar el status bar

    const rowVirtualizer = useVirtualizer({
        count: totalRows + bottomSpacerRows, // Incluye filas "fantasma" al final
        getScrollElement: () => parentRef.current,
        estimateSize: () => cellHeight, // Altura estimada de cada "fila"
    });

    const handlerProducts = () => {
        const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM
        navigate(INVENTORY_ITEMS);
    }
    return (
        <ProductsListContainer>
            <ProductsScrollArea ref={parentRef}>
                {productsLoading ? (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            width: '100%',
                        }}
                    >
                        <Spin
                            spinning={productsLoading}
                            size="large"
                        >
                        </Spin>
                    </div>
                ) : (
                    <VirtualRowsContainer totalSize={rowVirtualizer.getTotalSize()}>
                        {rowVirtualizer.getVirtualItems().map(virtualRow => (
                            <ItemRow
                                key={virtualRow.key}
                                columns={columns}
                                top={virtualRow.start}
                                height={cellHeight}
                                products={products}
                                virtualRow={virtualRow}
                                totalRows={totalRows}
                            />
                        ))}
                        {
                            (products.length === 0 && !productsLoading) && (
                                <CenteredText
                                    text='No hay Productos'
                                    buttonText={'Gestionar Productos'}
                                    handleAction={handlerProducts}
                                />
                            )
                        }
                    </VirtualRowsContainer>
                )}
            </ProductsScrollArea>
            <FloatingStatusBar products={products} statusMeta={statusMeta} />
        </ProductsListContainer>
    )
}

const ProductsListContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #ccc;
    border-left: none;
    border-right: none;
    background-color: var(--colo2);
    min-height: 0;
    width: 100%;
    position: relative;
  `

const ProductsScrollArea = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.4em;
    overflow: auto;
    position: relative;
  `

const VirtualRowsContainer = styled.div`
    height: ${({ totalSize }) => `${totalSize}px`};
    width: 100%;
    position: relative;
  `;

const FloatingStatusBar = styled(StatusBar)`
    position: absolute;
    bottom: 0.9rem;
    right: 0.9rem;
    margin: 0;
    z-index: 10;
`
