import React, { useEffect, useRef, useState } from 'react';
import { MdDelete, MdEdit } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { OPERATION_MODES } from '../../../../../constants/modes';
import { toggleAddProductOutflow } from '../../../../../features/modals/modalSlice';
import { addNotification } from '../../../../../features/notification/NotificationSlice';
import { SelectProductOutflow, setProductOutflowData } from '../../../../../features/productOutflow/productOutflow';
import { fbDeleteProductOutflow } from '../../../../../firebase/ProductOutflow/fbDeleteProductOutflow';
import { fbGetProductOutflow } from '../../../../../firebase/ProductOutflow/fbGetProductOutflow';
import { fbUpdateStock } from '../../../../../firebase/ProductOutflow/fbUpdateStock';
import { useFormatNumber } from '../../../../../hooks/useFormatNumber';
import useScroll from '../../../../../hooks/useScroll';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';
import { Button } from '../../../../templates/system/Button/Button';
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup';
import { FormattedValue } from '../../../../templates/system/FormattedValue/FormattedValue';
import Loader from '../../../../templates/system/loader/Loader';
import { CenteredText } from '../../../../templates/system/CentredText';
import { ProductOutflowDataFormatter, toggleProductOutflowModal } from './toggleProductOutflowModal';


export const ProductOutflow = () => {
  const dispatch = useDispatch()
  const tableRef = useRef(null);
  const [outflowList, setOutflowList] = useState([])
  const outflowProduct = useSelector(SelectProductOutflow)
  const [outflowListLoader, setOutflowListLoader] = useState(true)
  const isScrolled = useScroll(tableRef)
  const handleClick = () => {
    dispatch(toggleAddProductOutflow())
  };
  const handleDeleteProductOutflow = async (item) => {

    try {
      await fbUpdateStock(item.productList, true)
      await fbDeleteProductOutflow(item.id)
      dispatch(addNotification({ type: 'success', message: 'Salida de producto eliminada' }))
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: 'Error al eliminar la salida de producto' }))
    }
  }
  
  useEffect(()=>{
    const productOutflowList = outflowList.find((item) => item?.productList.length === 0)
   
    if(productOutflowList){
    fbDeleteProductOutflow(productOutflowList.id )
    }
  }, [outflowList])
  useEffect(() => {
    if (outflowProduct.mode === OPERATION_MODES.UPDATE.id) {
      outflowList.forEach((doc) => {
        if (doc.id === outflowProduct.data.id) {
          dispatch(setProductOutflowData({ data: doc }))
        }
      });
    }
  }, [outflowList])
  console.log(outflowList)
  useEffect(() => {
    fbGetProductOutflow({ setOutflowList, setOutflowListLoader, dispatch })
  }, [])

  console.log(outflowList)
  return (
    <Container>
      <MenuApp></MenuApp>
      <Header>
        <HeaderWrapper>
          <Title>Registro de salida de productos</Title>
          <Button
            bgcolor={'primary'}
            title={'Nueva Salida'}
            borderRadius={'normal'}
            onClick={handleClick}
          />
        </HeaderWrapper>
      </Header>
      <Table ref={tableRef} >
        <TableHeader isScrolled={isScrolled}>
          <FormattedValue
            type={'subtitle-table'}
            value={'#'}
          />
          <FormattedValue
            type={'subtitle-table'}
            value={'Fechas'}
          />
          <FormattedValue
            type={'subtitle-table'}
            value={'Cantidad de productos'}
          />
          <FormattedValue
            type={'subtitle-table'}
            value={'Acción'}
          />
        </TableHeader>
        <TableItems>
          <Loader
            theme='light'
            useRedux={false}
            show={outflowListLoader}
            message={'Cargando lista de salidas de productos'} />
          {
            outflowListLoader ?
              null :
              outflowList.length > 0 ?
                (
                  outflowList
                    .sort((a, b) => a.date - b.date)
                    .reverse()
                    .map((item, index) => (
                      <Row key={item.id}>
                        <FormattedValue
                          type={'number'}
                          value={(outflowList.length - index)}
                        />
                        <FormattedValue
                          type={'date'}
                          value={item.date}
                        />
                        <span>
                          <FormattedValue
                            type={'number'}
                            value={
                              item.productList.reduce((total, item) => {
                                return total + Number(item.totalRemovedQuantity)
                              }, 0)
                            }
                          />

                        </span>
                        <ButtonGroup>
                          <Button
                            width={'icon32'}
                            title={<MdEdit />}
                            color={'gray-dark'}
                            borderRadius={'normal'}
                            onClick={() =>
                              toggleProductOutflowModal({
                                mode: OPERATION_MODES.UPDATE.id,
                                data: new ProductOutflowDataFormatter(item),
                                dispatch
                              })
                            }
                          />
                          <Button
                            width={'icon32'}
                            title={<MdDelete />}
                            color={'gray-dark'}
                            borderRadius={'normal'}
                            onClick={() => handleDeleteProductOutflow(item)}
                          />
                        </ButtonGroup>
                      </Row>
                    ))
                ) : (
                  <CenteredText
                    text='Crea un nuevo registro de salida de productos'
                    buttonText={'Nueva Salida'}
                    handleAction={handleClick}
                  />
                )
          }
        </TableItems>
      </Table>

    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-rows: min-content auto 1fr;
  grid-gap: 16px;
  height: 100vh;
  background-color: var(--color2);
`;
const Header = styled.div`
  background-color: var(--White);

  width: 100%;
  padding: 16px;
`;
const HeaderWrapper = styled.div`
max-width: 1000px;
width: 100%;
margin: 0 auto;

display: grid;
align-items: center;
grid-template-columns: 1fr auto;
`
const Title = styled.h2`
  margin: 0;
    font-size: 1.1rem;
`;
const NewButton = styled.button`
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #0069d9;
  }
`;
const Table = styled.div`
max-width: 1000px;
width: 100%;
overflow-y: scroll;
margin: 0 auto;
height: calc(100vh - 200px);
background-color: aliceblue;
border: 1px solid rgba(0, 0, 0, 0.0100);
border-radius: var(--border-radius);
background-color: var(--White);
position: relative;


`
const TableItems = styled.div`
  display: grid;
  height: calc(100% - 2.6em);
  align-content: flex-start;


`;
const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 6em 1fr 1fr 5em;
  align-items: center;
  background-color: var(--White);

  padding: 8px;
  font-size: 14px;
  font-weight: bold;
  position: sticky;
    top: 0;
    border: 1px solid rgba(0, 0, 0, 0.000);
    transition: all 0.2s linear;
    ${({ isScrolled }) => isScrolled && `
    border-bottom: 1px solid rgba(0, 0, 0, 0.100);
    background-color: #ffffffdf;
    backdrop-filter: blur(10px);
    `}
  
`;
const Label = styled.div``;
const Row = styled.div`
  display: grid;
  grid-template-columns: 6em  1fr 1fr 5em;
  align-items: center;
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
  transition: all 0.2s linear;
  :hover{
    background-color: #f5f5f5;
  }
`;



