import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { toggleAddCategory } from '../../../../features/modals/modalSlice';
import { selectUser } from '../../../../features/auth/userSlice';
import { fbUpdateCategory } from '../../../../firebase/categories/fbUpdateCategory';
import { fbAddCategory } from '../../../../firebase/categories/fbAddCategory';
import { addNotification } from '../../../../features/notification/NotificationSlice';
import { InputV4 } from '../../../templates/system/Inputs/GeneralInput/InputV4';
import { motion } from 'framer-motion';
import { useCategoryState } from '../../../../Context/CategoryContext/CategoryContext';
import { useClickOutSide } from '../../../../hooks/useClickOutSide';

const OverlayVariants = {
  open: {
    opacity: 1,
    pointerEvents: 'all',
  },
  closed: {
    opacity: 0,
    pointerEvents: 'none',
  }
}

const ContainerVariants = {
  open: { scale: 1 },
  closed: { scale: 0 }
}

const AddCategoryModal = () => {
  const { category, setCategory, categoryState, onSubmit, onClose } = useCategoryState();
  const { type, isOpen } = categoryState;

  const inputRef = useRef(null);

  useEffect(() => {
      if (inputRef.current) {
          inputRef.current.focus();
      }
  }, []);

  const dispatch = useDispatch();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (category.name === '') {
      dispatch(addNotification({
        message: 'El nombre de la categoría no puede estar vacío',
        type: 'error',
      }))
      return
    }
    onSubmit();
    dispatch(addNotification({
      message: type === 'create' ? 'Categoría creada con éxito' : 'Categoría actualizada con éxito',
      type: 'success',
    })
    )
  };

  useClickOutSide(inputRef, isOpen, onClose);

  return (
    <ModalOverlay
      variants={OverlayVariants}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      exit="closed"
      transition={{ duration: 0.3 }}
      isOpen={isOpen}
    >
      <ModalContainer
        ref={inputRef}
        variants={ContainerVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        exit="closed"
      >
        <h2>{type === 'create' ? 'Crear Categoría' : 'Actualizar Categoría'}</h2>
        <Form onSubmit={handleSubmit}>
          <InputV4
            name='name'
            placeholder='Nombre de la Categoría'
            onChange={(e) => setCategory({ ...category, name: e.target.value })}
            size='medium'
            ref={inputRef}
            value={category.name}
            autoFocus={true}
          />
          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{'Crear'}</Button>
          </ButtonGroup>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default AddCategoryModal;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000000;
  /* opacity: ${(props) => (props.isOpen ? 1 : 0)};
  visibility: ${(props) => (props.isOpen ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out; */

`;

const ModalContainer = styled(motion.div)`
  width: 400px;
  background-color: white;
  padding: 1em;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  h2{
    margin-top: 0;
    padding: 0;
    margin: 0;
    margin-bottom: 1em;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;



const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
`;

// if (categoryToUpdate) {
//   fbUpdateCategory(category, user)
//     .then(() => { onClose(); })
//     .then(() => {
//       dispatch(addNotification({
//         message: 'Categoría actualizada con éxito',
//         type: 'success',
//       }))
//       return
//     })
// } else {
//   fbAddCategory(category, user)
//     .then(() => { onClose(); })
//     .then(() => {
//       dispatch(addNotification({
//         message: 'Categoría creada con éxito',
//         type: 'success',
//       }))
//     });
// }