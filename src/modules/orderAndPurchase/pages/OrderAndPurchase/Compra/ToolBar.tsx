import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { toggleAddPurchaseModal } from '@/features/modals/modalSlice';
import { Button } from '@/components/ui/Button/Button';
import { Tooltip } from '@/components/ui/Button/Tooltip';

export const ToolBar = () => {
  const dispatch = useDispatch();
  const openModal = () => {
    dispatch(toggleAddPurchaseModal());
  };
  return (
    <Container>
      <Wrapper>
        {/* <OrderFilter></OrderFilter> */}
        <Tooltip
          description="Realizar Comprar"
          Children={
            <Button
              borderRadius="normal"
              bgcolor="primary"
              startIcon={<FontAwesomeIcon icon={faPlus} />}
              title={`Comprar`}
              onClick={openModal}
            />
          }
        />
      </Wrapper>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2.5em;
  background-color: rgb(255 255 255);
`;
const Wrapper = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 1em;
`;
