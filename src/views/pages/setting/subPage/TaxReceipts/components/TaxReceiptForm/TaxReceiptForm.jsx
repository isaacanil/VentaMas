import { Button, Form, Input, message, Modal, Switch } from "antd";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { useSelector } from "react-redux";
import { updateTaxReceipt } from "../../../../../../../firebase/taxReceipt/updateTaxReceipt";
import { useEffect } from "react"; // Importar useEffect

export default function TaxReceiptForm({
    editModalVisible,
    setEditModalVisible,
    currentEditItem,
}) {
    const [form] = Form.useForm();
    const user = useSelector(selectUser);

    // useEffect para resetear y establecer los valores del formulario cuando currentEditItem cambie
    useEffect(() => {
        if (currentEditItem) {
            // Crear un objeto con los valores a establecer, asegurando que 'disabled' sea booleano
            const valuesToSet = {
                ...currentEditItem,
                disabled: currentEditItem.disabled === undefined ? true : currentEditItem.disabled,
            };
            form.setFieldsValue(valuesToSet);
        } else {
            form.resetFields(); // Limpiar el formulario si no hay item seleccionado
        }
    }, [currentEditItem, form]); // Dependencias: currentEditItem y form

    const handleSaveEdit = async () => {
        try {
            const values = await form.validateFields();

            // Asegurar que 'disabled' tenga un valor booleano al guardar
            // Esta lógica se mantiene por si el valor cambia durante la edición
            const finalValues = {
                ...values,
                disabled: values.disabled === undefined ? true : values.disabled,
            };

            const data = {
                ...currentEditItem, // Mantener el ID y otros datos originales no editables
                ...finalValues, // Usar los valores finales del formulario
            }
            console.log(data);
            await updateTaxReceipt(user, data);
            message.success('Comprobante fiscal actualizado correctamente');
        }
        catch (error) {
            console.error("Error al guardar el comprobante fiscal:", error);
            message.error('Error al actualizar el comprobante fiscal. Por favor, inténtalo de nuevo más tarde.');
        } finally {
            setEditModalVisible(false);
        }
    }
    return (
        <Modal
            title="Editar Comprobante Fiscal"
            open={editModalVisible}
            onCancel={() => setEditModalVisible(false)}
            footer={[
                <Button key="cancel" onClick={() => setEditModalVisible(false)}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" onClick={handleSaveEdit}>
                    Guardar
                </Button>            ]}
            width={700}
            // Destruir el modal al cerrar para asegurar que el estado del formulario se reinicie
            destroyOnHidden 
        >
            {currentEditItem && (
                <Form
                    form={form}
                    layout="vertical"
                    name="editTaxReceiptForm"
                    // initialValues ya no es estrictamente necesario aquí con el useEffect, 
                    // pero no hace daño dejarlo por si acaso para la primera carga.
                    initialValues={currentEditItem} 
                >
                    <Form.Item
                        name="name"
                        label="Nombre"
                        rules={[{ required: true, message: 'Por favor ingrese el nombre del comprobante' }]}
                    >
                        <Input placeholder="Nombre del comprobante" />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Tipo"
                        rules={[{ required: true, message: 'Por favor ingrese el tipo de comprobante' }]}
                    >
                        <Input placeholder="Tipo" maxLength={2} />
                    </Form.Item>
                    <Form.Item
                        name="serie"
                        label="Serie"
                        rules={[{ required: true, message: 'Por favor ingrese la serie' }]}
                    >
                        <Input placeholder="Serie" maxLength={2} type="number" />
                    </Form.Item>
                    <Form.Item
                        name="sequence"
                        label="Secuencia"
                        rules={[{ required: true, message: 'Por favor ingrese la secuencia' }]}
                    >
                        <Input placeholder="Secuencia" maxLength={10} />
                    </Form.Item>
                    <Form.Item
                        name="increase"
                        label="Incremento"
                        rules={[{ required: true, message: 'Por favor ingrese el incremento' }]}
                    >
                        <Input placeholder="Incremento" type="number" />
                    </Form.Item>
                    <Form.Item
                        name="quantity"
                        label="Cantidad"
                        rules={[{ required: true, message: 'Por favor ingrese la cantidad' }]}
                    >
                        <Input placeholder="Cantidad" type="number" />
                    </Form.Item>

                    <Form.Item
                        name="disabled"
                        label="Estado"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren="Activo"
                            unCheckedChildren="Inactivo"
                        />
                    </Form.Item>
                </Form>
            )}
        </Modal>
    )
}
