import { Button, Tooltip } from "antd";
import React from "react";
import { useDispatch } from "react-redux";

import { openFileCenter } from "../../../features/files/fileSlice";
import { truncateString } from "../../../utils/text/truncateString";

export function ShowFiles({ value }) {
    const dispatch = useDispatch();
    const handleShowFiles = () => {
        dispatch(openFileCenter(value))
    }

    const tooltipContent = value?.length ? (
        <div style={{ maxWidth: '300px' }}>
            <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px', paddingBottom: '4px' }}>
                Total archivos: {value.length}
            </div>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
                {value.map(file => (
                    <li key={file.id} style={{ marginBottom: '4px' }}>
                        {truncateString(file.name, 24)}
                    </li>
                ))}
            </ol>
        </div>
    ) : 'Sin archivos';

    return (
        <Tooltip title={tooltipContent} placement="topLeft">
            <Button onClick={handleShowFiles} disabled={!value?.length}>
                ver
            </Button>
        </Tooltip>
    )
}