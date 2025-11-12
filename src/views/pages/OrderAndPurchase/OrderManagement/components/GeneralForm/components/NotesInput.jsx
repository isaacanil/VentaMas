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
        setLocalNote(value);
        debouncedDispatch(value);
    };

    return (
        <Form.Item
            label="Notas (opcional)"
            validateStatus={errors?.note ? "error" : ""}
            help={errors?.note ? "La nota no puede exceder los 300 caracteres" : ""}
        >
            <TextArea
                value={localNote}
                onChange={handleChange}
                status={errors?.note ? "error" : ""}
                cols={30}
                rows={4}
                count={{
                    show: true,
                    max: 300,
                }}
                style={{
                    maxWidth: '1000px',
                    resize: 'none',
                }}
            />
        </Form.Item>
    );
};

export default NotesInput;
