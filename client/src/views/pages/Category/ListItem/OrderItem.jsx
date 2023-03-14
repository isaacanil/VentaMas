import React, { useEffect, useRef, useState } from 'react'
import { IoTrashSharp } from 'react-icons/io5'
import { TbEdit } from 'react-icons/tb'
import styled from 'styled-components'
import { Message } from '../../../templates/system/message/Message'
import { Button, ButtonGroup } from '../../../templates/system/Button/Button'
import { GrRevert, GrEdit, GrClear, GrCheckmark, GrClose } from 'react-icons/gr'
import { useClickOutSide } from '../../../../hooks/useClickOutSide'
import { fbDeleteCategory, updateCategoryDataBD } from '../../../../firebase/firebaseconfig'
import { Tooltip } from '../../../templates/system/Button/Tooltip'
import { useDispatch } from 'react-redux'
import { toggleAddCategory } from '../../../../features/modals/modalSlice'

export const OrderItem = ({ cat, index, Row, Col, activeCategory, setActiveCategory }) => {

  const [category, setCategory] = useState({
    name: cat.name,
    id: cat.id
  });

  const [mode, setMode] = useState(null);
  const [showConfirmBtn, setShowConfirmBtn] = useState(false);
  const EditRef = useRef(null);
  const dispatch = useDispatch();
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
    setActiveCategory(category);


  };

  const handleDelete = (id) => {
    setMode('DELETE');
    setShowConfirmBtn(true);
    setActiveCategory(category);
  };

  useEffect(() => {
    if (activeCategory && activeCategory.id !== category.id) {
      setShowConfirmBtn(false);
    }
  }, [activeCategory]);

  const handleRevert = () => {
    setMode(null);
    setShowConfirmBtn(false);
    setCategory({
      name: cat.name,
      id: cat.id
    });
  };

  const handleAccept = () => {
    switch (mode) {
      case 'DELETE':
        console.log('delete');
        fbDeleteCategory(cat.id);

        break;
      case 'EDIT':
        console.log('edit');
        updateCategoryDataBD(category)

        //  dispatch(toggleAddCategory({ isOpen: true, data: category }))
    
        break;
      case 'REVERT':
        console.log('revert');
        break;
      default:
        break;
    }

    setMode(null);
    setShowConfirmBtn(false);
    setActiveCategory(null);
  };

  const handleReject = () => {
    setCategory({
      name: cat.name,
      id: cat.id
    });
    setMode(null);
    setShowConfirmBtn(false);
  };



  return (
    <Row>
      <CategoryName
        ref={EditRef}
        type="text"
        value={category.name}
        onChange={(e) => setCategory({ ...category, name: e.target.value })}
        readOnly={!showConfirmBtn}
      />
      {/* <CategoryName>
        {category.name}
      </CategoryName> */}

      <Col>
        {showConfirmBtn ? (
          <ButtonGroup>
            <Button
              borderRadius='normal'
              title={<GrClose />}
              width='icon24'
              color='gray-dark'
              onClick={handleReject}
              tooltipDescription='Cancelar'
              tooltipPlacement={'top'}
            />
            <Button
              borderRadius='normal'
              title={<GrCheckmark />}
              width='icon24'
              color='gray-dark'
              onClick={handleAccept}
            />
          </ButtonGroup>
        ) : (
          <ButtonGroup>

            <Button
              borderRadius='normal'
              title={<GrEdit />}
              width='icon24'
              color='gray-dark'
              onClick={handleEdit}
            />
            {/* <Button
              borderRadius='normal'
              title={<GrRevert />}
              width='icon24'
              color='gray-dark'
              onClick={handleRevert}
            /> */}
            <Button
              borderRadius='normal'
              title={<GrClear />}
              width='icon24'
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