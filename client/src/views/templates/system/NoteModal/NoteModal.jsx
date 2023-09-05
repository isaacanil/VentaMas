// NoteModal.js
import React from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { clearNote, selectNote, setNote } from '../../../../features/noteModal/noteModalSlice';
import Typography from '../Typografy/Typografy';
import { Button } from '../Button/Button';


const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
    z-index: 1000;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: ${(props) => (props.show ? 'block' : 'none')};
`;

const ModalContent = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  background: white;
  max-width: 500px;
  width: 100%;
  border-radius: 8px;
  min-height: 300px;
  display: grid;
    grid-template-rows: min-content 1fr  min-content;
    gap: 1em;

`;
const ModalHeader = styled.div`

`
const ModalBody = styled.div`
padding: 1em;
background-color: #e6e4e4;
border-radius: var(--border-radius);
`
const ModalFooter = styled.div`
    display: flex;
`


const NoteModal = () => {
    const dispatch = useDispatch();
    const currentNote = useSelector(selectNote);
    const isOpen = currentNote.isOpen;
    const note = currentNote.note;


    const closeModal = () => {
        dispatch(clearNote());
    };

    return (
        <ModalOverlay show={isOpen} onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <Typography variant='h2' >
                        Nota
                    </Typography>
                </ModalHeader>
                <ModalBody>
                    <Typography variant='p' >
                        {note}
                    </Typography>
                </ModalBody>
                <ModalFooter>
                    <Button
                        title={'Cerrar'}
                        onClick={closeModal}
                        borderRadius={'normal'}
                    />
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
};

export default NoteModal;
