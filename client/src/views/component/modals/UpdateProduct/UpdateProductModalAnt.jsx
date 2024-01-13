import React from 'react'

export const UpdateProductModalAnt = () => {
    return (
        <Container>
            <Main>
                <Section>
                    <Typography
                        variant='h3'
                    >
                        Información del producto
                    </Typography>
                    <FormGroup layout='1fr'>
                        <InputV4
                            name='productName'
                            label={'Nombre del producto:'}
                            required
                            size={'medium'}
                            type="text"
                            onClear={() => dispatch(setProduct({ ...product, productName: '' }))}
                            errorMessage={errors?.productName}
                            validate={errors?.productName}
                            value={product?.productName || ''}
                            onChange={(e) => dispatch(setProduct({ ...product, productName: e.target.value }))}
                        />
                    </FormGroup>
                    <FormGroup layout='1fr 1fr'>
                        <InputV4
                            label={'Tipo de Producto:'}
                            type="text"
                            name='type'
                            size={'medium'}
                            required
                            value={product?.type || ''}
                            onChange={(e) => dispatch(setProduct({ ...product, type: e.target.value }))}
                        />
                        <InputV4
                            label={'Contenido neto: '}
                            type="text"
                            placeholder='Contenido Neto:'
                            name='netContent'
                            size={'medium'}
                            value={product?.netContent || undefined}
                            onChange={(e) => dispatch(setProduct({ ...product, netContent: e.target.value }))}
                        />
                    </FormGroup>
                    <FormGroup layout='1fr 1fr'>
                        <InputV4
                            label={'Tamaño: '}
                            type="text"
                            name="size"
                            size={'medium'}
                            placeholder='Contenido Neto:'
                            value={product?.size}
                            onChange={(e) => dispatch(setProduct({ ...product, size: e.target.value }))}
                        />
                        <Select
                            labelVariant='label1'
                            title={'Categoría'}
                            data={categories}
                            value={product?.category}
                            onChange={(e) => dispatch(setProduct({ ...product, category: e.target.value?.category?.name }))}
                            displayKey={'category.name'}
                        />
                    </FormGroup>
                </Section>
                <Section>
                    <Typography
                        variant='h3'
                    >
                        Gestión Inventario
                    </Typography>
                    <FormGroup layout='1fr 1fr' >
                        <InventariableButton
                            setProduct={setProduct}
                            product={product}
                        />
                        <InputV4
                            label={'Stock:'}
                            type="number"
                            placeholder='stock'
                            size={'medium'}
                            name='stock'
                            value={product?.stock}
                            onChange={(e) => dispatch(setProduct({ ...product, stock: Number(e.target.value) }))}
                        />
                    </FormGroup>
                </Section>
                <Section>
                    <Typography
                        variant='h3'
                    >
                        Facturación y Precio
                    </Typography>

                    <FormGroup >
                        <div>
                            <ProductVisibilityButton
                                product={product}
                                setProduct={setProduct}
                            />
                            <Select
                                labelVariant='label1'
                                title={'Impuesto'}
                                data={taxesList}
                                required
                                value={"ITBIS " + product?.tax?.ref}
                                onNoneOptionSelected={() => dispatch(setProduct({
                                    ...product,
                                    tax: initTaxes[0].tax
                                }))
                                }
                                onChange={(e) => {
                                    console.log(e.target.value)
                                    dispatch(setProduct({
                                        ...product,
                                        tax: e.target.value?.tax
                                    }))
                                }}
                                displayKey={'tax.ref'}
                            />
                            <InputV4
                                label={'Costo'}
                                type="number"
                                size={'medium'}
                                required
                                value={product?.cost?.unit}
                                onChange={(e) => dispatch(setProduct({ ...product, cost: { ...product.cost, unit: Number(e.target.value), total: Number(e.target.value) } }))}
                            />
                            <InputV4
                                size={'medium'}
                                required
                                label={'Precio + ITBIS'}
                                value={status ? product.price.unit : undefined}
                                type={"number"}
                                errorMessage={errors?.price}
                                validate={errors?.price}
                                onChange={(e) => dispatch(setProduct({ ...product, price: { ...product.price, unit: Number(e.target.value), total: Number(e.target.value) } }))}
                                placeholder='Precio de Venta'
                            />
                        </div>
                        {/* <ProductPaymentDetails product={product} /> */}
                        {/* <PaymentDetailTable /> */}
                    </FormGroup>
                </Section>
            </Main>
            <Aside>
                <FormGroup>
                    <ImgContainer>
                        <Img>
                            <img
                                src={image}
                                style={product?.productImageURL === image ?
                                    { objectFit: "cover" } :
                                    { objectFit: "contain", padding: "2em" }
                                } alt=""
                            />
                        </Img>
                        <Align position='center'>
                            <Button
                                borderRadius='normal'
                                title={status === "update" ? 'Actualizar' : 'Agregar Imagen'}
                                bgcolor='primary'
                                titlePosition='center'
                                onClick={handleImgController}
                            />
                        </Align>
                    </ImgContainer>
                </FormGroup>
                <FormGroup >
                    <BarCodeControl
                        product={product}
                        value={product?.barCode}
                    />
                </FormGroup>
                <FormGroup >
                    <QRCodeControl
                        product={product}
                        value={product?.qrCode}
                    />
                </FormGroup>
            </Aside>
        </Container>
    )
}
