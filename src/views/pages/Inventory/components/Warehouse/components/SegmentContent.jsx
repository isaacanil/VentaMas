import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as antd from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import styled from "styled-components";


import { openSegmentForm } from "../../../../../../features/warehouse/segmentModalSlice";
import { selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";

import { ProductsSection } from "./ProductsSection";
import { DetailContainer, DetailItem } from "./WarehouseContent";

const { Button, Tag } = antd;

// Estilos personalizados usando styled-components
const Container = styled.div`
  display: grid;
  gap: 1em;
`;

const SegmentInfo = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const InfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5em;
  color: #333;
`;

const Body = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

export default function SegmentContent() {
  // Estado para almacenar los productos asociados con el segmento
  const dispatch = useDispatch();
  const {segmentId} = useParams();
  const location = { id: segmentId, type: 'segment' };
  const {selectedSegment : segment} = useSelector(selectWarehouse);
  

  // Manejar la acción de editar la información del segmento
  const handleUpdateSegment = (segment) => {
    dispatch(openSegmentForm(segment));
  };


  return (
    <Container>
      <SegmentInfo>
        <InfoHeader>
          <SectionTitle>Información del Segmento</SectionTitle>
          <Button
            type="default"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={() => handleUpdateSegment(segment)}
          >
            Editar
          </Button>
        </InfoHeader>
        <DetailContainer>
          <DetailItem>
            <strong>Nombre:</strong> {segment?.name || "N/A"}
          </DetailItem>
          <DetailItem>
            <strong>Nombre Corto:</strong> {segment?.shortName || "N/A"}
          </DetailItem>
          <DetailItem>
            <strong>Capacidad:</strong> <Tag >{segment?.capacity || "N/A"}</Tag>
          </DetailItem>
          <DetailItem>
            <strong>Descripción:</strong> {segment?.description || "N/A"}
          </DetailItem>
   
        </DetailContainer>
       
        {/* Agregar más detalles si es necesario */}
      </SegmentInfo>

      <Body>
        <ProductsSection location={location} />
      </Body>

    </Container>
  );
}
