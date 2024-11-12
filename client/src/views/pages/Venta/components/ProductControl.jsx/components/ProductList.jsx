import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import ItemRow from "./ItemRow";
import { useNavigate } from "react-router-dom";
import ROUTES_NAME from "../../../../../../routes/routesName";
import { CenteredText } from "../../../../../templates/system/CentredText";
import { Spin } from "antd";
import { debounce } from 'lodash';

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


export const ProductList = ({ products, productsLoading }) => {
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

    const rowVirtualizer = useVirtualizer({
        count: Math.ceil(itemCount / columns), // Número total de "filas" virtuales
        getScrollElement: () => parentRef.current,
        estimateSize: () => cellHeight, // Altura estimada de cada "fila"
    });

    const handlerProducts = () => {
        const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM
        navigate(INVENTORY_ITEMS);
    }
    return (
        <ProductsListContainer
            ref={parentRef}
            // listContainer={listContainerHeight}
        >
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
                        />
                    ))}
                </VirtualRowsContainer>
            )}

            {
                (products.length === 0 && !productsLoading) && (
                    <CenteredText
                        text='No hay Productos'
                        buttonText={'Gestionar Productos'}
                        handleAction={handlerProducts}
                    />
                )
            }
        </ProductsListContainer>
    )
}

const ProductsListContainer = styled.div`
    height:  calc(100vh - 8.41em);
    @media ( width > 800px){
      height: calc(100vh - 5.3em);
    }
    padding: 0.4em;
    gap: 0.4em;
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: auto;
    width: 100%;
    position: relative;
    background-color: var(--color2);
  `
const VirtualRowsContainer = styled.div`
    height: ${({ totalSize }) => `${totalSize}px`};
    width: 100%;
    position: relative;
  `;