// InventoryCard.js
import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faBox, faCalendarAlt, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { clearProductExpirySelector, selectProduct } from '../../../../../features/warehouse/productExpirySelectionSlice';
import { addProduct } from '../../../../../features/cart/cartSlice';
import { Modal } from 'antd';
const StyledCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const StyledCardContent = styled.div`
  padding: 1rem;
`;

const StyledCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.5rem;
`;

const StyledCardInfo = styled.div`
  display: flex;
  align-items: center;
`;

const StyledIconWrapper = styled.div`
  width: ${({ size }) => size || '1rem'};
  height: ${({ size }) => size || '1rem'};
  margin-right: ${({ marginRight }) => marginRight || '0.5rem'};
  color: ${({ color }) => color};
`;

const StyledBadge = styled.span`
  background-color: ${({ variant }) => (variant === 'default' ? '#1890ff' : '#faad14')};
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
`;

const StyledCardDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

const StyledLoteDetails = styled.div`
  grid-column: span 2;
  display: flex;
  align-items: center;
`;

const StyledProgressBar = styled.div`
  margin-top: 0.5rem;
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 8px;
  height: 6px;
`;

const StyledProgress = styled.div`
  background-color: #1890ff;
  height: 6px;
  border-radius: 8px;
  width: ${({ width }) => width}%;
`;

const InventoryCard = ({ item }) => {
    const dispatch = useDispatch();
    const product = useSelector(selectProduct);
    const getDateIsoFromTimestamp = (timestamp) => {
        const milliseconds = timestamp?.seconds * 1000;
        const dateObject = new Date(milliseconds);
        return dateObject.toISOString().split('T')[0];
    };

    const handleSelect = () => {
        try{
            Modal.confirm({
                title: 'Confirmación',
                content: `¿Está seguro que desea seleccionar el producto?`,
                okText: 'Sí',
                cancelText: 'No',
                onOk: () => {
                  const newItem = {
                    ...product,
                    batchData: item?.batchData,
                  };
    
                  dispatch(addProduct(newItem));
                  dispatch(clearProductExpirySelector());
                },
                onCancel: () => {
                  // Opcional: manejar acción si se cancela
                },
              });
        }catch(err){
            console.log(err)
        }
       
    }


    return (
        <StyledCard onClick={handleSelect}>
            <StyledCardContent>
                <StyledCardHeader>
                    <StyledCardInfo>
                        <StyledIconWrapper size="1rem" marginRight="0.5rem" color="#1890ff">
                            <FontAwesomeIcon icon={faWarehouse} />
                        </StyledIconWrapper>
                        <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{item.warehouse}</span>
                    </StyledCardInfo>
                    <StyledBadge variant={item.stock > 50 ? "default" : "secondary"}>
                        {item.stock}
                    </StyledBadge>
                </StyledCardHeader>
                <StyledCardDetails>
                    <StyledCardInfo>
                        <StyledIconWrapper size="0.75rem" marginRight="0.25rem" color="#52c41a">
                            <FontAwesomeIcon icon={faBox} />
                        </StyledIconWrapper>
                        {item.shortName ? item.shortName : ''}
                        {item.shelf ? `-${item.shelf}` : ''}
                        {item.row ? `-${item.row}` : ''}
                        {item.segment ? `-${item.segment}` : ''}
                    </StyledCardInfo>
                    {item?.batchData?.expirationDate && (
                        <StyledCardInfo>
                            <StyledIconWrapper size="0.75rem" marginRight="0.25rem" color="#ff4d4f">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                            </StyledIconWrapper>
                            <span>{getDateIsoFromTimestamp(item?.batchData?.expirationDate)}</span>
                        </StyledCardInfo>
                    )}
                    <StyledLoteDetails>
                        <StyledIconWrapper size="0.75rem" marginRight="0.25rem" color="#faad14">
                            <FontAwesomeIcon icon={faChartBar} />
                        </StyledIconWrapper>
                        <span>Lote: {item?.batchData?.shortName}</span>
                    </StyledLoteDetails>
                </StyledCardDetails>
                <StyledProgressBar>
                    <StyledProgress width={Math.min(item.stock, 100)} />
                </StyledProgressBar>
            </StyledCardContent>
        </StyledCard>
    );
};

export default InventoryCard;