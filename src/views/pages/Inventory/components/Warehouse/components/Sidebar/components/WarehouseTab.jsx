import { PlusOutlined } from '@ant-design/icons';
import { Tree, Button, Tooltip } from 'antd';
import { AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { useTransformedWarehouseData } from '../../../../../../../../firebase/warehouse/warehouseNestedServise';
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

const WarehouseTab = memo(() => {
    const navigate = useNavigate();
    const { warehouseId, shelfId, rowId, segmentId } = useParams();
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [isWarehouseFormVisible, setIsWarehouseFormVisible] = useState(false);
    const [isShelfFormVisible, setIsShelfFormVisible] = useState(false);
    const [isRowFormVisible, setIsRowFormVisible] = useState(false);
    const [isSegmentFormVisible, setIsSegmentFormVisible] = useState(false);

    // Usar el hook optimizado que carga toda la jerarquía
    const { data: warehouseData, loading } = useTransformedWarehouseData();

    // Convertir la estructura transformada a formato Tree de Ant Design
    const treeData = useMemo(() => {
        const buildTree = (nodes) => {
            if (!Array.isArray(nodes)) return [];
            
            return nodes.map(node => {
                const treeNode = {
                    title: node.name,
                    key: `${node.type}-${node.id}`,
                };

                if (node.children && node.children.length > 0) {
                    treeNode.children = buildTree(node.children);
                }

                return treeNode;
            });
        };

        return buildTree(warehouseData);
    }, [warehouseData]);

    // Memoizar el callback de selección
    const handleSelect = useCallback((selectedKeys, info) => {
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
    }, [navigate, warehouseId, shelfId, rowId, segmentId]);

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
                    treeData={treeData}
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
});

WarehouseTab.displayName = 'WarehouseTab';

export default WarehouseTab;
