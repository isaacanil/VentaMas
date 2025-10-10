import { Modal, Typography, Button } from 'antd';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { clearNote, selectNote } from '../../../../features/noteModal/noteModalSlice';

const { Title, Paragraph } = Typography;

const NoteModal = () => {
    const dispatch = useDispatch();
    const currentNote = useSelector(selectNote);
    const isOpen = currentNote.isOpen;
    const note = currentNote.note;

    const closeModal = () => {
        dispatch(clearNote());
    };

    return (
        <Modal
            title={'Nota'}
            open={isOpen}
            onCancel={closeModal}
            footer={[
                <Button key="close" type="primary" onClick={closeModal}>
                    Cerrar
                </Button>,
            ]}
        >
            <Paragraph>{note}</Paragraph>
        </Modal>
    );
};

export default NoteModal;
