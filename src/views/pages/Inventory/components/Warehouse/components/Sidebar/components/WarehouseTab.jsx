import { PlusOutlined } from '@ant-design/icons';
import { Tree, Button, Tooltip } from 'antd';
import { AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { useListenRowShelves } from '../../../../../../../../firebase/warehouse/RowShelfService';
import { useListenAllSegments } from '../../../../../../../../firebase/warehouse/segmentService';
import { useListenShelves } from '../../../../../../../../firebase/warehouse/shelfService';
import { useListenWarehouses } from '../../../../../../../../firebase/warehouse/warehouseService';
import RowForm from '../../../forms/RowShelfForm/RowShelfForm';
import SegmentForm from '../../../forms/SegmentForm/SegmentForm';
import { ShelfForm } from '../../../forms/ShelfForm/ShelfForm';
import { WarehouseForm } from '../../../forms/WarehouseForm/WarehouseForm';

const TabContent = styled.div`
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TreeContainer = styled.div`
  flex: 1;
  overflow-y: auto;

  .ant-tree {
    background: transparent;
  }

  .ant-tree-treenode {
    padding: 4px 0;
    
    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  .ant-tree-node-content-wrapper {
    flex: 1;
  }
`;

const ActionButton = styled(Button)`
  width: 100%;
`;

const WarehouseTab = () => {
    const navigate = useNavigate();
    const { warehouseId, shelfId, rowId, segmentId } = useParams();
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [isWarehouseFormVisible, setIsWarehouseFormVisible] = useState(false);
    const [isShelfFormVisible, setIsShelfFormVisible] = useState(false);
    const [isRowFormVisible, setIsRowFormVisible] = useState(false);
    const [isSegmentFormVisible, setIsSegmentFormVisible] = useState(false);

    const { warehouses } = useListenWarehouses();
    const { shelves } = useListenShelves(warehouseId);
    const { rows } = useListenRowShelves(shelfId);
    const { segments } = useListenAllSegments(rowId);

    const buildTreeData = () => {
        return warehouses.map(warehouse => ({
            title: warehouse.name,
            key: `warehouse-${warehouse.id}`,
            children: shelves
                .filter(shelf => shelf.warehouseId === warehouse.id)
                .map(shelf => ({
                    title: shelf.name,
                    key: `shelf-${shelf.id}`,
                    children: rows
                        .filter(row => row.shelfId === shelf.id)
                        .map(row => ({
                            title: row.name,
                            key: `row-${row.id}`,
                            children: segments
                                .filter(segment => segment.rowId === row.id)
                                .map(segment => ({
                                    title: segment.name,
                                    key: `segment-${segment.id}`,
                                }))
                        }))
                }))
        }));
    };

    const handleSelect = (selectedKeys, info) => {
        const [type, id] = selectedKeys[0]?.split('-') || [];
        let path = '/inventory/warehouses';

        if (type === 'warehouse') {
            path += `/warehouse/${id}`;
            if (shelfId) {
                path += `/shelf/${shelfId}`;
                if (rowId) {
                    path += `/row/${rowId}`;
                    if (segmentId) {
                        path += `/segment/${segmentId}`;
                    }
                }
            }
        } else if (type === 'shelf') {
            path += `/warehouse/${warehouseId}/shelf/${id}`;
            if (rowId) {
                path += `/row/${rowId}`;
                if (segmentId) {
                    path += `/segment/${segmentId}`;
                }
            }
        } else if (type === 'row') {
            path += `/warehouse/${warehouseId}/shelf/${shelfId}/row/${id}`;
            if (segmentId) {
                path += `/segment/${segmentId}`;
            }
        } else if (type === 'segment') {
            path += `/warehouse/${warehouseId}/shelf/${shelfId}/row/${rowId}/segment/${id}`;
        }

        navigate(path);
        setSelectedKeys(selectedKeys);
    };

    return (
        <TabContent>
            <ActionButton
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setIsWarehouseFormVisible(true)}
            >
                Agregar Almacén
            </ActionButton>

            <TreeContainer>
                <Tree
                    treeData={buildTreeData()}
                    selectedKeys={selectedKeys}
                    onSelect={handleSelect}
                    showLine={{ showLeafIcon: false }}
                />
            </TreeContainer>

            <AnimatePresence>
                {isWarehouseFormVisible && (
                    <WarehouseForm
                        visible={isWarehouseFormVisible}
                        onClose={() => setIsWarehouseFormVisible(false)}
                    />
                )}
                {isShelfFormVisible && (
                    <ShelfForm
                        visible={isShelfFormVisible}
                        onClose={() => setIsShelfFormVisible(false)}
                        warehouseId={warehouseId}
                    />
                )}
                {isRowFormVisible && (
                    <RowForm
                        visible={isRowFormVisible}
                        onClose={() => setIsRowFormVisible(false)}
                        shelfId={shelfId}
                    />
                )}
                {isSegmentFormVisible && (
                    <SegmentForm
                        visible={isSegmentFormVisible}
                        onClose={() => setIsSegmentFormVisible(false)}
                        rowId={rowId}
                    />
                )}
            </AnimatePresence>

            {warehouseId && (
                <Tooltip title="Agregar Estante">
                    <ActionButton
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => setIsShelfFormVisible(true)}
                    >
                        Agregar Estante
                    </ActionButton>
                </Tooltip>
            )}

            {shelfId && (
                <Tooltip title="Agregar Fila">
                    <ActionButton
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => setIsRowFormVisible(true)}
                    >
                        Agregar Fila
                    </ActionButton>
                </Tooltip>
            )}

            {rowId && (
                <Tooltip title="Agregar Segmento">
                    <ActionButton
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => setIsSegmentFormVisible(true)}
                    >
                        Agregar Segmento
                    </ActionButton>
                </Tooltip>
            )}
        </TabContent>
    );
};

export default WarehouseTab;
