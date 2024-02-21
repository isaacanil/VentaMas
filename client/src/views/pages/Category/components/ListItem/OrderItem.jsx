import React, { useEffect, useRef, useState } from 'react'

import styled from 'styled-components'
import {ButtonGroup } from '../../../../templates/system/Button/Button'

import { useDispatch, useSelector } from 'react-redux'

import { icons } from '../../../../../constants/icons/icons'
import { selectUser } from '../../../../../features/auth/userSlice'
import { fbDeleteCategory } from '../../../../../firebase/categories/fbDeleteCategory'
import { fbUpdateCategory } from '../../../../../firebase/categories/fbUpdateCategory'
import { useClickOutSide } from '../../../../../hooks/useClickOutSide'
import * as antd from 'antd'
export const OrderItem = ({ cat, Row, Col }) => {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);

  const [mode, setMode] = useState(null);

  const [category, setCategory] = useState({
    name: cat.name,
    id: cat.id
  });

  const [showConfirmBtn, setShowConfirmBtn] = useState(false);

  const EditRef = useRef(null);
  const CategoryRef = useRef(null);

  const handleClose = () => {
    setShowConfirmBtn(false);
    setMode(null);
  }
  useEffect(() => {
    setCategory({
      name: cat.name,
      id: cat.id
    })
  }, [cat])

  const handleEdit = () => {
    setCategory({
      name: cat.name,
      id: cat.id
    });
    setMode('EDIT');
    setShowConfirmBtn(true);
    EditRef.current.focus();
    EditRef.current.select();
  };

  const handleDelete = (id) => {
    setMode('DELETE');
    setShowConfirmBtn(true);
    
  };

  const handleAccept = () => {
    switch (mode) {
      case 'DELETE':
        console.log('delete');
        fbDeleteCategory(user, cat.id);
        antd.message.success('Categoría eliminada', 2.5)
        break;
      case 'EDIT':
        console.log('edit');
        fbUpdateCategory(category, user)
        antd.message.success('Categoría actualizada', 2.5)
        break;
    }
    setMode(null);
    setShowConfirmBtn(false);
  };

  const handleReject = () => {
    setCategory({
      name: cat.name,
      id: cat.id
    });
    setMode(null);
    setShowConfirmBtn(false);
  };

  useClickOutSide(CategoryRef, showConfirmBtn, handleClose)

  return (
    <Row ref={CategoryRef}>
      <CategoryName
        ref={EditRef}
        type="text"
        value={category.name}
        onChange={(e) => setCategory({ ...category, name: e.target.value })}
        readOnly={!showConfirmBtn}
      />
      <Col>
        {showConfirmBtn ? (
          <ButtonGroup>
            <Button
              icon={icons.operationModes.cancel}
              onClick={handleReject}
            />
            <Button
              icon={icons.operationModes.accept}
              onClick={handleAccept}
            />
          </ButtonGroup>
        ) : (
          <ButtonGroup>
            <Button
              icon={icons.operationModes.edit}
              onClick={handleEdit}
            />
            <Button
              icon={icons.operationModes.delete}
              onClick={() => handleDelete(cat.id)}
            />
          </ButtonGroup>
        )}
      </Col>
    </Row>
  );
};

const Container = styled.div`
`
const Button = styled(antd.Button)`
font-size: 1.2em;
display: flex;
justify-content: center;
align-items: center;
`

const CategoryName = styled.input`
margin-left: 1em;
border: none;
height: 2em;

:focus{
  outline: 2px solid rgba(0, 0, 0, 0.200);
}
${props => {
    switch (props.readOnly) {
      case true:
        return `
        background-color: #ffffff;
        :focus{
          user-select: none;
          outline: none;
          pointer-events: none;
        }
        ::selection{
          background-color: transparent;
          color: inherit;
        }
        
        `
    }
  }}
  
    `