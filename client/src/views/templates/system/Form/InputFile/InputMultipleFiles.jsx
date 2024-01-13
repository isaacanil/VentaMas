import { UploadOutlined, FileAddFilled } from '@ant-design/icons';

import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';


import { useState } from 'react';
import * as antd from 'antd';
const { Button, Upload, Form } = antd;


export const InputMultipleFiles = ({ fileList, setFileList }) => {

    console.log("FIle -----", fileList)
    const onChange = ({ fileList: newFileList }) => {

        setFileList(newFileList);
    };
    return (
        <Upload
            m
            action="https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188"
            fileList={fileList}
            onChange={onChange}
            multiple={true}
        >
            <Form.Item
                help="Cargue las evidencias de pago"
            >
                <Button icon={<UploadOutlined />}>Cargar Evidencia</Button>
            </Form.Item>
        </Upload>

    );
};




