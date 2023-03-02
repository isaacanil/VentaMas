import { useState } from 'react';
import styled from 'styled-components';
import { UploadCat } from '../../../../firebase/firebaseconfig';

const AddCategoryModal = ({ initialCategory, onClose, onSave }) => {
  const [category, setCategory] = useState(initialCategory || { id: '', name: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCategory((prevCategory) => ({ ...prevCategory, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (initialCategory) {
      handleUpdate(category);
    } else {
        UploadCat('categorys', category, category.id)
    }
    onClose();
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <h2>{initialCategory ? 'Update Category' : 'Create Category'}</h2>
        <Form onSubmit={handleSubmit}>
          <Input type="text" name="name" placeholder="Category Name" value={category.name} onChange={handleChange} />
          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{initialCategory ? 'Update' : 'Create'}</Button>
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