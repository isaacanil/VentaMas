import React from 'react'
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import styled from 'styled-components';
import { separator } from '../../../hooks/separator';


const styles = StyleSheet.create({
    page: {
        backgroundColor: '#E4E4E4',
    },
    section: {
        fontSize: 11,
        marginBottom: 2,
        padding: 10,
        paddingTop: 30,
        paddingHorizontal: 30,
    },
    TimeANDHour: {
        width: 120,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    ProductList: {
        fontSize: 12,


    },
    Title: {
        fontWeight: 'bold'
    },
    ProductListHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginBottom: 10,
        paddingHorizontal: 30,
        flexGrow: 1,


    },
    ProductListBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        flexGrow: 1,


    },
    PaymentInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingHorizontal: 30,
        flexGrow: 1,

    },
    ColumnDescr: {

        flexGrow: 1.2,
        flexShrink: 1,
        flexBasis: 0,
        justifyContent: 'flex-end',

    },
    ColumnIva: {

        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        justifyContent: 'flex-end',

        textAlign: "right",

    },
    ColumnValue: {

        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        textAlign: "right",


    }
});
export const Receipt = ({ data }) => {


    const { products, totalTaxes, totalPurchase, delivery } = data
    console.log(products)
    const today = new Date()
    const [month, day, year] = [today.getMonth() + 1, today.getDate(), today.getFullYear()]
    const [hour, minute, second] = [today.getHours(), today.getMinutes(), today.getSeconds()]
    // const product = [
    //     {
    //         name: 'pan lumijor',
    //         itbis: '0.00',
    //         price: 98.95,
    //     },
    //     {
    //         name: 'pan lumijor',
    //         itbis: '0.00',
    //         price: 98.95,
    //     },
    //     {
    //         name: 'pan lumijor',
    //         itbis: '0.00',
    //         price: 98.95,
    //     },
    //     {
    //         name: 'pan lumijor',
    //         itbis: '0.00',
    //         price: 98.95,
    //     },
    //     {
    //         name: 'pan lumijor',
    //         itbis: '0.00',
    //         price: 98.95,
    //     },
    //     {
    //         name: 'pan lumijor',
    //         itbis: '0.00',
    //         price: 98.95,
    //     },
    //     {
    //         name: 'pan lumijor',
    //         itbis: '0.00',
    //         price: 98.95,
    //     },
    // ]
    return (


        <Document>
            <Page size="EXECUTIVE" style={styles.page} >
                <View style={styles.section} >
                    <Text>[NOMBRE NEGOCIO]</Text>
                    <Text>Tel: [TELEFONO]</Text>
                    <Text>[DIRECCION]</Text>
                    <View style={styles.TimeANDHour}>
                        <Text>{`${day}/${month}/${year}`}</Text>
                        <Text>{`${hour}:${minute}:${second}`}</Text>
                    </View>
                </View>

                <View style={styles.ProductList} >
                    <View style={styles.ProductListHead}>
                        <View style={styles.ColumnDescr}>
                            <Text>DESCRIPCION</Text>
                        </View>
                        <View style={styles.ColumnIva}>
                            <Text>ITBIS</Text>
                        </View>
                        <View style={styles.ColumnValue}>
                            <Text>VALOR</Text>
                        </View>
                    </View>
                    {
                        products.length !== 0 ? (
                            products.map((product, index) => (
                                <div key={index}>
                                    <View style={styles.ProductListBody} >
                                        <View style={styles.ColumnDescr}>
                                            <Text>{product.productName}</Text>
                                        </View>
                                        <View style={styles.ColumnIva}>
                                            <Text>{product.tax.total}</Text>
                                        </View>
                                        <View style={styles.ColumnValue}>
                                            <Text>{separator(product.price.total)}</Text>
                                        </View>
                                    </View>
                                </div>
                            ))
                        ) : null
                    }

                    <View style={styles.PaymentInfo} >
                        <View style={styles.ColumnDescr}>
                            <Text>Envio:</Text>
                        </View>
                        <View style={styles.ColumnIva}>
                            <Text></Text>
                        </View>
                        <View style={styles.ColumnValue}>
                            <Text>{separator(delivery.value)}</Text>
                        </View>
                    </View>
                    <View style={styles.PaymentInfo}>
                        <View style={styles.ColumnDescr}>
                            <Text style={styles.Title}>TOTAL A PAGAR</Text>
                        </View>
                        <View style={styles.ColumnIva}>
                            <Text>{totalTaxes.value}</Text>
                        </View>
                        <View style={styles.ColumnValue}>
                            <Text>{totalPurchase.value.toFixed(2)}</Text>
                        </View>
                    </View>





                </View>

            </Page>
        </Document>

    )
}
const Box = styled.div`
    background-color: red;
    padding: 100px;
`