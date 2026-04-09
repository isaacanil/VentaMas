import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  addIngredientTypePizza,
  type IngredientInput,
} from '@/firebase/firebaseconfig';
import { fbGetCustomProduct } from '@/firebase/products/customProduct/fbGetCustomProductTypePizza';
import { Button } from '@/components/ui/Button/Button';
import { PlusIconButton } from '@/components/ui/Button/PlusIconButton';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';
import { IngredientCard } from '@/components/ui/Product/typePizza/IngredientCard';

interface CustomProductIngredient extends IngredientInput {
  name?: string;
}

interface CustomProductDocument {
  ingredientList?: CustomProductIngredient[];
}

interface AddCustomProductModalProps {
  isOpen: boolean;
  handleOpen: () => void;
}

interface IngredientDraft extends IngredientInput {
  name: string;
  cost: number | string;
  id: string;
}

export const AddCustomProductModal = ({
  isOpen,
  handleOpen,
}: AddCustomProductModalProps) => {
  const user = useSelector(selectUser);
  const [product, setProduct] = useState<CustomProductDocument | null>(null);

  useEffect(() => {
    fbGetCustomProduct(user, setProduct);
  }, [user]);

  const [ingredient, setIngredient] = useState<IngredientDraft>({
    name: '',
    cost: 0,
    id: '',
  });

  const settingIngredientId = () => {
    return new Promise((resolve) => {
      resolve(
        setIngredient({
          ...ingredient,
          id: nanoid(),
        }),
      );
    });
  };

  const handleOnChange = () => {
    settingIngredientId().then(() => {
      if (ingredient.cost && ingredient.id && ingredient.name !== '') {
        addIngredientTypePizza(ingredient);

        setIngredient({
          name: '',
          cost: '',
          id: '',
        });
      }
    });
  };

  return isOpen ? (
    <Modal>
      <Head>
        {' '}
        <Container>
          <Button
            bgcolor="error"
            startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
            title="atrás"
            onClick={handleOpen}
          ></Button>
        </Container>
      </Head>
      <Body>
        <TitleSection>
          <h4>Características del Producto</h4>
        </TitleSection>
        <Flex $alignItems="center" $justifyContent="space-between">
          <Group>
            <Col>
              <InputV4
                value={ingredient.name}
                placeholder="Agregar Ingrediente"
                onChange={(e) =>
                  setIngredient({ ...ingredient, name: e.target.value })
                }
              />
            </Col>
            <Col>
              <InputV4
                value={ingredient.cost}
                size="small"
                placeholder="Precio"
                onChange={(e) =>
                  setIngredient({ ...ingredient, cost: e.target.value })
                }
              />
            </Col>
          </Group>
          <Col $justifySelf>
            <PlusIconButton fn={handleOnChange}></PlusIconButton>
          </Col>
        </Flex>
        <Box>
          <List>
            {product?.ingredientList && product.ingredientList.length > 0
              ? product.ingredientList
                  .sort((a, b) => (String(a.name) > String(b.name) ? 1 : -1))
                  .map((item) => (
                    <IngredientCard
                      key={item.id ?? item.name}
                      item={item}
                    ></IngredientCard>
                  ))
              : null}
          </List>
        </Box>
      </Body>
    </Modal>
  ) : null;
};
const Modal = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  grid-template-rows: min-content 1fr;
  width: 100%;
  height: 100%;
  max-height: 600px;
  overflow: hidden;
  background-color: var(--white-3);
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: 10px;
`;
const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.5em;
  padding: 0 0.4em 0 1em;
  color: white;
  background-color: rgb(60 60 60);
`;
const Body = styled.div`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
`;
const TitleSection = styled.div`
  padding: 1em;
`;
const Container = styled.div``;
const Box = styled.div`
  width: 100%;
  height: 100%;
  padding: 0.6em;
`;
const List = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: min-content;
  gap: 0.2em;
  width: 100%;
  height: 100%;
  padding: 0.4em;
  overflow: hidden;
  background-color: #bbb;
  border: 1px solid rgb(0 0 0 / 16.1%);
  border-radius: 10px;
  box-shadow: inset 0 0 10px rgb(0 0 0 / 13.7%);
`;
const Group = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;
interface ColProps {
  $justifySelf?: boolean;
}

const Col = styled.div<ColProps>`
  justify-self: ${(props) => (props.$justifySelf ? 'flex-end' : 'auto')};
`;

interface FlexProps {
  $gap?: string;
  $alignItems?: string;
  $justifyContent?: string;
  $padding?: string;
  $backgroundColor?: string;
}

const Flex = styled.div<FlexProps>`
  display: flex;
  gap: ${(props) => props.$gap ?? '1em'};
  align-items: ${(props) => props.$alignItems ?? 'stretch'};
  justify-content: ${(props) => props.$justifyContent ?? 'flex-start'};
  width: 100%;
  padding: ${(props) => props.$padding ?? '0 1em'};
  background-color: ${(props) => props.$backgroundColor ?? 'transparent'};
`;
