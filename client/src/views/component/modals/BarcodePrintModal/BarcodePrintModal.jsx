

import React, { useRef, useState } from 'react';
import * as antd from 'antd';
const { Modal, Input, Button, Form, Checkbox, Spin } = antd;
import { SelectBarcodePrintModal, toggleBarcodeModal } from '../../../../features/barcodePrintModalSlice/barcodePrintModalSlice';
import { useDispatch, useSelector } from 'react-redux'
import { BarCode } from './Barcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
export const BarcodePrintModal = () => {
    const { isOpen, product } = useSelector(SelectBarcodePrintModal)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const dispatch = useDispatch()
    const barcodeRef = useRef();

    const handlePrint = async () => {
        try {
            setLoading(true);
            if (barcodeRef.current) {
                // Obtén los valores del formulario, incluido el ancho deseado y la cantidad.
                const values = form.getFieldsValue();
                const desiredWidthMM = values.barcodeWidth; // Ancho deseado en milímetros.
                const quantity = parseInt(values.quantity, 10); // Cantidad de veces que se debe duplicar el código de barras.

                const canvas = await html2canvas(barcodeRef.current);
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = canvas.width; // Ancho actual en píxeles.
                const imgHeight = canvas.height; // Alto actual en píxeles.

                const desiredWidthPx = (desiredWidthMM / 25.4) * 96;

                const scale = desiredWidthPx / imgWidth;
                const scaledHeightPx = imgHeight * scale;

                const widthInMM = desiredWidthMM;
                const heightInMM = (scaledHeightPx / 96) * 25.4;

                // Instancia de jsPDF modificada para manejar múltiples páginas según la cantidad.
                const pdf = new jsPDF({
                    orientation: widthInMM > heightInMM ? 'l' : 'p',
                    unit: 'mm',
                    format: [widthInMM, heightInMM]
                });

                // Bucle para añadir la misma imagen en múltiples páginas del PDF según la cantidad.
                for (let i = 0; i < quantity; i++) {
                    if (i > 0) {
                        pdf.addPage([widthInMM, heightInMM], widthInMM > heightInMM ? 'l' : 'p');
                    }
                    pdf.addImage(imgData, 'PNG', 0, 0, widthInMM, heightInMM);
                }

                const pdfBlob = pdf.output('blob');
                const url = URL.createObjectURL(pdfBlob);
                const printWindow = window.open(url, '_blank');
                printWindow.addEventListener('load', function () {
                    printWindow.focus();
                    printWindow.print();
                    URL.revokeObjectURL(url);
                }, { once: true });
            }
        } catch (error) {
            console.error('Error al generar la vista previa de impresión: ', error);
        } finally {
            setLoading(false);
            form.setFieldValue('quantity', 1);
            form.setFieldValue('barcodeWidth', 100);
        }

        // Cierra el modal después de intentar mostrar la vista previa de impresión.
        dispatch(toggleBarcodeModal());
    };

    const handleCancel = () => {
        dispatch(toggleBarcodeModal())
    };

    return (
        <>

            <Modal
                style={{ top: 20 }}
                title="Generar e Imprimir Código de Barras"
                open={isOpen}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Cancelar
                    </Button>,
                    <Button key="submit" type="primary" onClick={handlePrint}>
                        Imprimir Código de Barras
                    </Button>,
                ]}
            >
                <Spin
                    spinning={loading}
                    size="large"
                >
                <Form
                    layout='vertical'
                    initialValues={{
                        product: product,
                        barcodeWidth: 100,
                        quantity: 1
                    }}
                    form={form}
                >
                    <Form.Item
                        label="Producto"
                        name="product"
                        rules={[{ required: true, message: 'Por favor seleccione un producto' }]}
                    >

                        <BarCode ref={barcodeRef} product={product} />

                    </Form.Item>

                    <Form.Item
                        label="Ancho del código de barras"
                        name="barcodeWidth"
                        rules={[{ required: true, message: 'Por favor ingrese el ancho del código de barras' }]}
                    >
                        <Input
                            addonAfter="milímetros"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Cantidad"
                        name="quantity"
                        rules={[{ required: true, message: 'Por favor ingrese el ancho del código de barras' }]}
                    >
                        <Input
                        />
                    </Form.Item>
                </Form>
            </Spin>

        </Modal >
       
        </>
    );
};


