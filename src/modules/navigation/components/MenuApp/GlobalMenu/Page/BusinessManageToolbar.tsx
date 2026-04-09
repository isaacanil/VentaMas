import { Button, Dropdown, Modal, message } from 'antd';
import React, { useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import ROUTES_PATH from '@/router/routes/routesName';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import type { MenuProps } from 'antd';
import {
  ensureDefaultWarehouses,
  fetchDefaultWarehouseAuditSummary,
  type AuditSummary,
} from './utils/defaultWarehouseAudit';

const BusinessManagerToolbar = ({ side = 'left' }: ToolbarComponentProps) => {
  const navigate = useNavigate();
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [ensureLoading, setEnsureLoading] = useState(false);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const canAccessBusinessCreation = isFrontendFeatureEnabled('businessCreation');

  const { CREATE_BUSINESS, BUSINESSES } = ROUTES_PATH.DEV_VIEW_TERM;

  const handleOpenModal = () => navigate(CREATE_BUSINESS); // Use the CREATE_BUSINESS route here

  const matchWithUsers = useMatch(BUSINESSES);

  const fetchDefaultWarehouseAudit = async () => {
    setAuditLoading(true);
    const result = await fetchDefaultWarehouseAuditSummary();

    if (result.errorMessage) {
      message.error(result.errorMessage);
    }

    setAuditSummary(result.summary);
    setAuditLoading(false);
  };

  const openAuditModal = () => {
    setAuditModalOpen(true);
    fetchDefaultWarehouseAudit();
  };

  const closeAuditModal = () => {
    setAuditModalOpen(false);
    setAuditSummary(null);
  };

  const handleEnsureDefaultWarehouses = async () => {
    if (!auditSummary || auditSummary.missing === 0) {
      message.info('No hay negocios pendientes.');
      return;
    }

    setEnsureLoading(true);
    const result = await ensureDefaultWarehouses();

    if (result.summary) {
      setAuditSummary(result.summary);
    }

    if (result.successMessage) {
      message.success(result.successMessage);
    }

    if (result.errorMessage) {
      message.error(result.errorMessage);
    }

    setEnsureLoading(false);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'audit-default-warehouses',
      label: 'Revisar negocios sin almacen por defecto',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'audit-default-warehouses') {
      openAuditModal();
    }
  };

  return matchWithUsers ? (
    <Container>
      {side === 'right' && (
        <ToolbarActions>
          {canAccessBusinessCreation ? (
            <Button onClick={handleOpenModal} icon={icons.operationModes.add}>
              Negocio
            </Button>
          ) : null}
          <Dropdown
            menu={{ items: menuItems, onClick: handleMenuClick }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button icon={icons.operationModes.setting2} />
          </Dropdown>
          <Modal
            title="Negocios sin almacen por defecto"
            open={auditModalOpen}
            onCancel={closeAuditModal}
            footer={[
              <Button key="close" onClick={closeAuditModal}>
                Cerrar
              </Button>,
              <Button
                key="ensure"
                type="primary"
                onClick={handleEnsureDefaultWarehouses}
                loading={ensureLoading}
                disabled={
                  auditLoading || !auditSummary || auditSummary.missing === 0
                }
              >
                Crear almacen por defecto
              </Button>,
            ]}
          >
            {auditLoading ? (
              <p>Revisando negocios...</p>
            ) : auditSummary ? (
              <div>
                <p>Negocios revisados: {auditSummary.scanned}</p>
                <p>Sin almacen por defecto: {auditSummary.missing}</p>
                {auditSummary.dryRun ? null : (
                  <>
                    <p>Procesados: {auditSummary.fixed ?? 0}</p>
                    <p>Almacenes creados: {auditSummary.created ?? 0}</p>
                    <p>
                      Almacenes marcados por defecto:{' '}
                      {auditSummary.setDefault ?? 0}
                    </p>
                    {auditSummary.errors ? (
                      <p>Errores: {auditSummary.errors}</p>
                    ) : null}
                  </>
                )}
              </div>
            ) : (
              <p>No hay datos disponibles.</p>
            )}
          </Modal>
        </ToolbarActions>
      )}
    </Container>
  ) : null;
};

export default BusinessManagerToolbar;

const Container = styled.div``;

const ToolbarActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;
