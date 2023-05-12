import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { toggleAddCategory } from '../../../../features/modals/modalSlice';
import { selectUser } from '../../../../features/auth/userSlice';
import { fbUpdateCategory } from '../../../../firebase/categories/fbUpdateCategory';
import { fbAddCategory } from '../../../../firebase/categories/fbAddCategory';


const EmptyCategory = { id: '', name: '' };
const AddCategoryModal = ({ isOpen, categoryToUpdate }) => {
  const [category, setCategory] = useState(categoryToUpdate || EmptyCategory);
  const [categoryHaveName, setCategoryHaveName] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (categoryToUpdate) {
      setCategory(categoryToUpdate);
    }
  }, [categoryToUpdate]);

  const user = useSelector(selectUser)

  const onClose = () => {
    dispatch(toggleAddCategory({ isOpen: false, data: null }));
    setCategory(EmptyCategory);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (categoryToUpdate) {
      fbUpdateCategory(category, user)
        .then(() => { onClose(); })
    } else {
      fbAddCategory(category, user);
      onClose();
    }

  };
  console.log(category);

  return (
    <ModalOverlay isOpen={isOpen}>
      <ModalContainer>
        <h2>{categoryToUpdate ? 'Update Category' : 'Create Category'}</h2>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            placeholder="Category Name"
            value={category.name}
            onChange={(e) => setCategory({ ...category, name: e.target.value })}
          />
          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            {categoryToUpdate ? (
              <Button type="submit">{'Update'}</Button>
            ) : (
              <Button type="submit">{'Create'}</Button>
            )}
          </ButtonGroup>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default AddCategoryModal;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  visibility: ${(props) => (props.isOpen ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;

`;

const ModalContainer = styled.div`
  width: 400px;
  background-color: white;
  padding: 1em;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  h2{
    margin-top: 0;
    margin-bottom: 1em;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
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