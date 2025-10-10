import { Form, Input } from 'antd';
import debounce from 'lodash/debounce';
import { useState, useEffect, useCallback } from 'react';

const { TextArea } = Input;

const NotesInput = ({ initialValue = '', onNoteChange, errors }) => {
    const [localNote, setLocalNote] = useState(initialValue);

    useEffect(() => {
        setLocalNote(initialValue);
    }, [initialValue]);

    const debouncedDispatch = useCallback(
        debounce((value) => {
            onNoteChange(value);
        }, 500),
        [onNoteChange]
    );

    const handleChange = (e) => {
        const { value } = e.target;
        if (value.length <= 300) {
            setLocalNote(value);
            debouncedDispatch(value);
        }
    };

    return (
        <Form.Item
            label="Notas"
        >
            <TextArea
                value={localNote}
                onChange={handleChange}
                placeholder={"Agrega notas adicionales"}
                cols={30}
                rows={4}
                style={{
                    maxWidth: '1000px',
                    resize: 'none',
                }}
            />
        </Form.Item>
    );
};

export default NotesInput;
