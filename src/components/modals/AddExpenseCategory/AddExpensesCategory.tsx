import { motion, type Variants } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { toggleAddCategory } from '@/features/modals/modalSlice';
import { addNotification } from '@/features/notification/notificationSlice';
import { fbAddCategory } from '@/firebase/categories/fbAddCategory';
import { fbUpdateCategory } from '@/firebase/categories/fbUpdateCategory';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';

const OverlayVariants: Variants = {
  open: {
    opacity: 1,
    pointerEvents: 'all',
  },
  closed: {
    opacity: 0,
    pointerEvents: 'none',
  },
};

const ContainerVariants: Variants = {
  open: { scale: 1 },
  closed: { scale: 0 },
};

interface Category {
  id: string;
  name: string;
}

const EmptyCategory: Category = { id: '', name: '' };

interface AddCategoryModalProps {
  isOpen: boolean;
  categoryToUpdate?: Category | null;
}

const AddCategoryModal = ({
  isOpen,
  categoryToUpdate,
}: AddCategoryModalProps) => {
  const [category, setCategory] = useState<Category>(
    () => categoryToUpdate || EmptyCategory,
  );
  const dispatch = useDispatch();

  const user = useSelector(selectUser);

  const [prevCategoryToUpdate, setPrevCategoryToUpdate] = useState<
    Category | null | undefined
  >(categoryToUpdate);

  // PATRÓN RECOMENDADO REACT: Ajustar estado durante render al cambiar props
  if (categoryToUpdate !== prevCategoryToUpdate) {
    setPrevCategoryToUpdate(categoryToUpdate);
    setCategory(categoryToUpdate || EmptyCategory);
  }

  const onClose = () => {
    dispatch(toggleAddCategory({ isOpen: false, data: null }));
    setCategory(EmptyCategory);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (category.name === '') {
      dispatch(
        addNotification({
          message: 'El nombre de la categoría no puede estar vacío',
          type: 'error',
        }),
      );
      return;
    }

    if (categoryToUpdate) {
      fbUpdateCategory(category, user)
        .then(() => {
          onClose();
        })
        .then(() => {
          dispatch(
            addNotification({
              message: 'Categoría actualizada con éxito',
              type: 'success',
            }),
          );
          return;
        });
    } else {
      fbAddCategory(category, user)
        .then(() => {
          onClose();
        })
        .then(() => {
          dispatch(
            addNotification({
              message: 'Categoría creada con éxito',
              type: 'success',
            }),
          );
        });
    }
  };

  return (
    <ModalOverlay
      variants={OverlayVariants}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      exit="closed"
      transition={{ duration: 0.3 }}
      isOpen={isOpen}
    >
      <ModalContainer
        variants={ContainerVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        exit="closed"
      >
        <h2>{categoryToUpdate ? 'Actualizar Categoría' : 'Crear Categoría'}</h2>
        <Form onSubmit={handleSubmit}>
          <InputV4
            name="name"
            placeholder="Nombre de la Categoría"
            onChange={(e) => setCategory({ ...category, name: e.target.value })}
            size="medium"
            value={category.name}
          />
          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancelar
            </Button>
            {categoryToUpdate ? (
              <Button type="submit">{'Actualizar'}</Button>
            ) : (
              <Button type="submit">{'Crear'}</Button>
            )}
          </ButtonGroup>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default AddCategoryModal;

const ModalOverlay = styled(motion.div)<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 20%);
  backdrop-filter: blur(2px);

  /* opacity: ${(props: any) => (props.isOpen ? 1 : 0)};
  visibility: ${(props: any) => (props.isOpen ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out; */
`;

const ModalContainer = styled(motion.div)`
  width: 400px;
  padding: 1em;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);

  h2 {
    padding: 0;
    margin: 0;
    margin-top: 0;
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
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
`;
