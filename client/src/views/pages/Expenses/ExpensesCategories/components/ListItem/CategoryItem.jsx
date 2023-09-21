import React, { useEffect, useRef, useState } from 'react'

import styled from 'styled-components'
import { Button, ButtonGroup } from '../../../../../templates/system/Button/Button'

import { useDispatch, useSelector } from 'react-redux'

import { selectUser } from '../../../../../../features/auth/userSlice'
import { fbDeleteCategory } from '../../../../../../firebase/categories/fbDeleteCategory'
import { fbUpdateCategory } from '../../../../../../firebase/categories/fbUpdateCategory'
import { useClickOutSide } from '../../../../../../hooks/useClickOutSide'

import { icons } from '../../../../../../constants/icons/icons'
import { fbDeleteExpenseCategory } from '../../../../../../firebase/expenses/categories/fbDeleteExpenseCategory'
import { fbUpdateExpenseCategory } from '../../../../../../firebase/expenses/categories/fbUpdateExpenseCategory'

export const CategoryItem = ({ cat, Row, Col }) => {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);

  const [mode, setMode] = useState(null);

  const [category, setCategory] = useState({
    ...cat,
  });

  const [showConfirmBtn, setShowConfirmBtn] = useState(false);

  const EditRef = useRef(null);
  const CategoryRef = useRef(null);

  const handleClose = () => {
    setShowConfirmBtn(false);
    setMode(null);
  }
  useEffect(() => { setCategory({ ...cat, }) }, [cat])

  const handleEdit = () => {
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
        fbDeleteExpenseCategory(user, cat.id);
        break;
      case 'EDIT':
        console.log('edit');
        fbUpdateExpenseCategory(user, category)
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
              borderRadius='normal'
              title={icons.operationModes.cancel}
              width='icon32'
              color='gray-dark'
              onClick={handleReject}
              tooltipDescription='Cancelar'
              tooltipPlacement={'top'}
            />
            <Button
              borderRadius='normal'
              title={icons.operationModes.accept}
              width='icon32'
              color='gray-dark'
              onClick={handleAccept}
            />
          </ButtonGroup>
        ) : (
          <ButtonGroup>
            <Button
              borderRadius='normal'
              title={icons.operationModes.edit}
              width='icon32'
              color='gray-dark'
              onClick={handleEdit}
            />
            <Button
              borderRadius='normal'
              title={icons.operationModes.delete}
              width='icon32'
              color='gray-dark'
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