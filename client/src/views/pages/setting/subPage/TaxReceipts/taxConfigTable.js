import { useState } from "react"
export const Data = () => {
    const ids = {
        id1: 'CONSUMIDOR FINAL',
        id2: 'CONSUMIDOR FISCAL'
    }
    const [receiptSettings, setReceiptSettings] = useState([
        {
            name: ids.id1,
            type: String,
            serie: Number,
            sequence: '',
            increase: '',
            quantity: ''
        },
        {
            name: ids.id2,
            type: '',
            serie: '',
            sequence: '',
            increase: '',
            quantity: ''
        }
    ])
    const settingDataTaxTable = [
        { name: 'NOMBRE' },
        { name: 'TIPO' },
        { name: 'SERIE' },
        { name: 'SECUENCIA' },
        { name: 'INCREMENTO' },
        { name: 'CANTIDAD' }
    ]
    const row = [
        {
            array: receiptSettings,
            setArray: setReceiptSettings,
            propertyId: ids.id1,
            type: 'number',
            propertyToChangeValue: 'type',
            maxCharacters: 10,
        },
        {
            array: receiptSettings,
            setArray: setReceiptSettings,
            propertyId: ids.id1,
            type: 'number',
            propertyToChangeValue: 'serie',
            maxCharacters: 10,
        },
        {
            array: receiptSettings,
            setArray: setReceiptSettings,
            propertyId: ids.id1,
            type: 'number',
            propertyToChangeValue: 'sequence',
            maxCharacters: 10,
        },
        {
            array: receiptSettings,
            setArray: setReceiptSettings,
            propertyId: ids.id1,
            type: 'number',
            propertyToChangeValue: 'increase',
            maxCharacters: 10,
        },
        {
            array: receiptSettings,
            setArray: setReceiptSettings,
            propertyId: ids.id1,
            type: 'number',
            propertyToChangeValue: 'quantity',
            maxCharacters: 10,
        }
    
    ]
    return {ids, settingDataTaxTable, row, receiptSettings, setReceiptSettings}
}
