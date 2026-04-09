import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { toggleViewOrdersNotes } from '@/features/modals/modalSlice';
import { Button } from '@/components/ui/Button/Button';

export const MessageAlert = ({ isOpen, data }: { isOpen: any; data: any }) => {
  const dispatch = useDispatch();

  const closeModal = () =>
    dispatch(toggleViewOrdersNotes({ isOpen: false, data: null }));

  return (
    <Backdrop $isOpen={isOpen === true && data !== null ? true : false}>
      <Container $isOpen={isOpen === true ? true : false}>
        <Body>
          <IconContainer>
            <FontAwesomeIcon icon={faMessage} />
          </IconContainer>
          <MessageContainer>
            <Message>
              {data !== '' && data !== null
                ? data.note
                  ? data.note
                  : 'vacio'
                : null}
            </Message>
          </MessageContainer>
        </Body>
        <Footer>
          <Button
            borderRadius={'normal'}
            title="ok"
            onClick={closeModal}
          ></Button>
        </Footer>
      </Container>
    </Backdrop>
  );
};

const Backdrop = styled.div<{ $isOpen?: boolean }>`
  height: 100%;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 2;
  ${(props: { $isOpen?: any }) => {
    switch (props.$isOpen) {
      case false:
        return `
          transform: scale(0);
          display: none;
        `;
      default:
        break;
    }
  }}
`;
const Container = styled.div<{ $isOpen?: boolean }>`
  background-color: #fff;
  height: min-content;
  max-width: 600px;
  width: 100%;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--box-shadow);
  color: #141414;
  display: grid;
  grid-template-rows: 1fr min-content;
  gap: 1em;
  grid-template-columns: 1fr;
  position: relative;
  align-items: center;
  padding: 0.5em 0;

  ${(props: { $isOpen?: any }) => {
    switch (props.$isOpen) {
      case false:
        return `
          transform: scale(0);
        `;
      default:
        break;
    }
  }}
`;
const Body = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 0.4fr 1fr;
  width: 100%;
  max-width: 100%;
  height: 100%;
  padding: 1em 2em 1em 0;
  overflow: hidden;

  @media (width <= 1000px) {
    grid-template-rows: auto;
    grid-template-columns: 1fr;
    place-content: flex-start center;
    align-items: flex-start;
    height: min-content;
    border-radius: 0;
  }
`;
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0 1em;
`;
const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: min-content;
  font-size: 70px;
  color: var(--font-color-dark-slightly);
`;
const MessageContainer = styled.div`
  width: 100%;
  height: min-content;
  padding: 1em 2em;
  overflow: hidden;
  overflow-wrap: break-word;
`;
const Message = styled.p`
  width: 100%;
`;
