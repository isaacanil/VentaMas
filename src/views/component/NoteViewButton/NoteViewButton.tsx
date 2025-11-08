import { Button, Tooltip } from "antd";
import React from 'react';
import { useDispatch } from "react-redux";


import { setNote } from "../../../features/noteModal/noteModalSlice";

export function NoteButton({ value }: { value: any }) {
    const dispatch = useDispatch();
    const hasNote = Boolean(value);

    return (
        <Tooltip title={value || 'Sin nota'}>
            <Button
                onClick={() => dispatch(setNote({ note: value, isOpen: true }))}
                disabled={!hasNote}
            >
                ver
            </Button>
        </Tooltip>
    );
}