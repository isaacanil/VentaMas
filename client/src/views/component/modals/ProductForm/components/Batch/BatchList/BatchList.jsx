"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { List, Button, Modal, notification, Tag, Switch } from "antd";
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { BatchForm } from "../BatchForm";
import { Form } from "antd";
import { deleteBatch, listenAllBatches } from "../../../../../../../firebase/warehouse/batchService";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { ChangeProductData, selectUpdateProductData } from "../../../../../../../features/updateProduct/updateProductSlice";
import { fbUpdateProduct } from "../../../../../../../firebase/products/fbUpdateProduct";

// Styled Components
const StyledContainer = styled.div`

  min-height: 100vh;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const StyledTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 24px;
`;

const BatchList = () => {
  const { product, status } = useSelector(selectUpdateProductData);
  const [batches, setBatches] = useState([]);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  useEffect(() => {
    let unsubscribe;

    const fetchData = async () => {

      try {
        if (!user || !product?.id) return;
        unsubscribe = await listenAllBatches(user, product?.id, setBatches);
      } catch (error) {
        console.error("Error al obtener lotes:", error);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, product]);


  const handleDelete = async (batchId) => {
    try {
      await deleteBatch(user, batchId);
      Modal.confirm({
        title: "¿Estás seguro de eliminar este lote?",
        icon: <ExclamationCircleOutlined />,
        content: "Esta acción no se puede deshacer.",
        okText: "Sí, eliminar",
        okType: "danger",
        cancelText: "Cancelar",
        onOk() {
          notification.success({
            message: "Lote Eliminado",
            description: "El lote ha sido eliminado exitosamente.",
          });
        },
      });
    } catch (error) {
      console.error("Error al eliminar lote:", error);
    }

  };

  const handleBatchSwitch = async (checked) => {
    dispatch(ChangeProductData({ product: { hasBatch: checked } }));
    try{
      await fbUpdateProduct({...product, hasBatch: checked}, dispatch, user);
    }catch(error){
      console.error("Error al cambiar el estado de la fecha de expiración:", error);
    }
  };

  return (
    <StyledContainer>
      <Form.Item
        label="Producto con lotes"
        valuePropName="checked"
      >
        <Switch
          checked={product.hasBatch}
          onChange={handleBatchSwitch}
          style={{ marginRight: 8 }}
        />
      </Form.Item>
      
      {product.hasBatch && (
        <div>
          <Header>
            <StyledTitle>Lista de Lotes</StyledTitle>
            <BatchForm
            />
          </Header>
          <List
            dataSource={batches}
            renderItem={item => (
              <List.Item
                key={item.key}
                actions={[
                  <BatchForm
                    mode="update"
                    initialData={item}
                    justIcon={true}
                  />,
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={<strong>{item.shortName}</strong>}
                  description={
                    <>
                      <div>Cantidad: <Tag color="blue">{item.quantity}</Tag></div>
                      {/* <div>Fecha de Expiración: {DateTime.fromISO(item.expirationDate).toLocaleString(DateTime.DATE_MED)}</div> */}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </div>)
      }
    </StyledContainer>
  );
};

export default BatchList;
