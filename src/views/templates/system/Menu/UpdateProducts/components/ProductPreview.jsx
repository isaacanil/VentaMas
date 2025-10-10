import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

import {
    Card,
    SectionTitle,
    Input,
    OutlineButton,
    SecondaryButton,
    PrimaryButton,
    TableContainer,
    TableHeader,
    TableHeaderCell,
    Alert,
    VirtualizedListContainer
} from '../code/styledComponents';

import ProductRow from './ProductRow';

const ProductPreview = ({
    products,
    originalProducts,
    updatedProducts,
    nameFilter,
    setNameFilter,
    error,
    isUploading,
    userBusinessID,
    onUploadToFirebase,
    onExportToExcel,
    onReset,
    filteredProducts
}) => {
    // Renderizar fila de producto en la lista virtual
    const renderProductRow = ({ index, style }) => {
        const product = filteredProducts[index];
        const original = updatedProducts.length > 0
            ? originalProducts.find(p => p.name === product.name)
            : null;

        return (
            <ProductRow 
                product={product} 
                original={original} 
                index={index}
                style={style}
            />
        );
    };

    return (
        <Card>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <SectionTitle>
                    Products Preview ({filteredProducts.length})
                </SectionTitle>
                <div>
                    <OutlineButton
                        onClick={onExportToExcel}
                        style={{ marginRight: '0.5rem' }}
                    >
                        Export Excel
                    </OutlineButton>
                    <SecondaryButton onClick={onReset}>
                        Reset
                    </SecondaryButton>
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem'
            }}>
                <Input
                    type="text"
                    placeholder="Search by name or code..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    style={{ maxWidth: '250px' }}
                />

                <PrimaryButton
                    onClick={onUploadToFirebase}
                    disabled={isUploading || !userBusinessID}
                >
                    {isUploading ? 'Uploading...' : 'Upload to Firebase'}
                </PrimaryButton>
            </div>

            {error && (
                <Alert type="error">
                    {error}
                </Alert>
            )}

            <TableContainer>
                <TableHeader>
                    <TableHeaderCell flex="0 0 30px" align="center">#</TableHeaderCell>
                    <TableHeaderCell flex="1 0 200px">Product</TableHeaderCell>
                    <TableHeaderCell flex="0 0 60px" align="center">Stock</TableHeaderCell>
                    <TableHeaderCell flex="0 0 100px">Code</TableHeaderCell>
                    <TableHeaderCell flex="0 0 80px" align="right">Cost</TableHeaderCell>
                    <TableHeaderCell flex="0 0 100px" align="right">List Price</TableHeaderCell>
                    <TableHeaderCell flex="0 0 80px" align="right">Min Price</TableHeaderCell>
                    <TableHeaderCell flex="0 0 80px" align="right">Avg Price</TableHeaderCell>
                    {updatedProducts.length > 0 && (
                        <TableHeaderCell flex="0 0 100px" align="right">New Price</TableHeaderCell>
                    )}
                    {/* Price with tax columns grouped to the right */}
                    <TableHeaderCell flex="0 0 100px" align="right">List Price c/ Imp.</TableHeaderCell>
                    <TableHeaderCell flex="0 0 100px" align="right">Min Price c/ Imp.</TableHeaderCell>
                    <TableHeaderCell flex="0 0 100px" align="right">Avg Price c/ Imp.</TableHeaderCell>
                    <TableHeaderCell flex="0 0 60px" align="center">Tax</TableHeaderCell>
                </TableHeader>

                <VirtualizedListContainer>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                itemCount={filteredProducts.length}
                                itemSize={48}
                                width={width}
                            >
                                {renderProductRow}
                            </List>
                        )}
                    </AutoSizer>
                </VirtualizedListContainer>
            </TableContainer>
        </Card>
    );
};

export default ProductPreview;