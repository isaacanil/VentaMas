import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  faClipboardList,
  faClock,
  faEnvelope,
  faHourglassEnd,
  faListUl,
  faNoteSticky,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, Button, Space, Tooltip, Popconfirm } from 'antd';
import styled from 'styled-components';

import {
  formatDateTime,
  getStatusLabel,
  statusTheme,
} from '../constants/constants';
import { resolveModuleMeta } from '../utils/utils';

import type { AuthorizationRequest } from '@/views/pages/Authorizations/components/AuthorizationRequests/types';

interface DetailModalProps {
  open: boolean;
  detailRequest: AuthorizationRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void | string | Promise<void | string>;
  onReject: (id: string) => void | Promise<void>;
}

export const DetailModal = ({
  open,
  detailRequest,
  onClose,
  onApprove,
  onReject,
}: DetailModalProps) => {
  if (!detailRequest) {
    return null;
  }

  const detailId =
    (typeof detailRequest.key === 'string' && detailRequest.key) ||
    (typeof detailRequest.id === 'string' && detailRequest.id) ||
    '';

  const detailStatus = detailRequest.status ?? 'pending';
  const disableApprove = detailStatus !== 'pending';
  const disableReject =
    detailStatus !== 'pending' || detailStatus === 'rejected';
  const requestedBy = detailRequest.requestedBy || {};
  const moduleMeta = resolveModuleMeta(detailRequest);
  const metadataSource =
    typeof detailRequest.metadata === 'object' &&
      detailRequest.metadata !== null
      ? detailRequest.metadata
      : {};
  const metadataReference =
    typeof metadataSource?.['reference'] === 'string'
      ? metadataSource['reference']
      : '';
  const metadataNote =
    typeof metadataSource?.['note'] === 'string' ? metadataSource['note'] : '';
  const reference =
    detailRequest.reference ||
    metadataReference ||
    detailRequest.invoiceNumber ||
    detailRequest.invoiceId ||
    '-';
  const reasonList = Array.isArray(detailRequest.reasons)
    ? detailRequest.reasons.filter(Boolean)
    : [];
  const requestNote =
    detailRequest.requestNote ??
    detailRequest.note ??
    detailRequest.notes ??
    metadataNote ??
    '';
  const additionalNote = detailRequest.notes ?? '';
  const createdAt = formatDateTime(detailRequest.createdAt);
  const expiresAt = formatDateTime(detailRequest.expiresAt);
  const email = typeof requestedBy.email === 'string' ? requestedBy.email : '';
  const actionsDisabled = !detailId;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={null}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onClose}>Cerrar</Button>
          <Tooltip
            title={
              actionsDisabled || disableApprove
                ? 'Acción no disponible'
                : 'Aprobar'
            }
          >
            <span>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                disabled={actionsDisabled || disableApprove}
                onClick={() => {
                  void onApprove(detailId);
                }}
              >
                Aprobar
              </Button>
            </span>
          </Tooltip>
          <Popconfirm
            title="¿Rechazar solicitud?"
            onConfirm={() => {
              void onReject(detailId);
            }}
            okText="Sí"
            cancelText="No"
            disabled={actionsDisabled || disableReject}
          >
            <Tooltip
              title={
                actionsDisabled || disableReject
                  ? 'Acción no disponible'
                  : 'Rechazar'
              }
            >
              <span>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  disabled={actionsDisabled || disableReject}
                >
                  Rechazar
                </Button>
              </span>
            </Tooltip>
          </Popconfirm>
        </Space>
      }
      width={640}
    >
      <Body>
        <Header>
          <HeaderIcon icon={moduleMeta.icon || faClipboardList} />
          <HeaderContent>
            <HeaderTitle>
              {moduleMeta.title || 'Solicitud de autorización'}
            </HeaderTitle>
            <HeaderSummary>
              {moduleMeta.summary ||
                'Revisa la información antes de tomar una acción.'}
            </HeaderSummary>
          </HeaderContent>
          <StatusBadge $status={detailStatus}>
            {getStatusLabel(detailStatus)}
          </StatusBadge>
        </Header>

        <InfoGrid>
          <InfoCard>
            <InfoIcon icon={moduleMeta.icon || faClipboardList} />
            <InfoContent>
              <InfoLabel>{moduleMeta.referenceLabel || 'Referencia'}</InfoLabel>
              <InfoValue>{reference}</InfoValue>
            </InfoContent>
          </InfoCard>
          <InfoCard>
            <InfoIcon icon={faUser} />
            <InfoContent>
              <InfoLabel>Solicitado por</InfoLabel>
              <InfoValue>{requestedBy.name || '-'}</InfoValue>
            </InfoContent>
          </InfoCard>
          {email && (
            <InfoCard>
              <InfoIcon icon={faEnvelope} />
              <InfoContent>
                <InfoLabel>Correo</InfoLabel>
                <InfoValue>{email}</InfoValue>
              </InfoContent>
            </InfoCard>
          )}
          <InfoCard>
            <InfoIcon icon={faClock} />
            <InfoContent>
              <InfoLabel>Creada</InfoLabel>
              <InfoValue>{createdAt}</InfoValue>
            </InfoContent>
          </InfoCard>
          <InfoCard>
            <InfoIcon icon={faHourglassEnd} />
            <InfoContent>
              <InfoLabel>Expira</InfoLabel>
              <InfoValue>{expiresAt}</InfoValue>
            </InfoContent>
          </InfoCard>
        </InfoGrid>

        <NoteSection>
          <NoteHeader>
            <NoteIcon icon={faNoteSticky} />
            <NoteLabel>Nota de solicitud</NoteLabel>
          </NoteHeader>
          <NoteText>{requestNote || 'Sin nota registrada.'}</NoteText>
        </NoteSection>

        {!!reasonList.length && (
          <ListSection>
            <ListHeader>
              <ListIcon icon={faListUl} />
              <NoteLabel>Motivos asociados</NoteLabel>
            </ListHeader>
            <ReasonList>
              {reasonList.map((reason, index) => (
                <li key={`${reason}-${index}`}>{reason}</li>
              ))}
            </ReasonList>
          </ListSection>
        )}

        {additionalNote && (
          <NoteSection>
            <ListHeader>
              <ListIcon icon={faClipboardList} />
              <NoteLabel>Notas adicionales</NoteLabel>
            </ListHeader>
            <NoteText>{additionalNote}</NoteText>
          </NoteSection>
        )}
      </Body>
    </Modal>
  );
};

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  gap: 16px;
  align-items: center;
`;

const HeaderIcon = styled(FontAwesomeIcon)`
  padding: 10px;
  font-size: 32px;
  color: #2b6cb0;
  background: #e6f4ff;
  border-radius: 14px;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgb(0 0 0 / 90%);
`;

const HeaderSummary = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgb(0 0 0 / 55%);
`;

const StatusBadge = styled.span<{ $status: string }>`
  justify-self: end;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $status }) => statusTheme[$status]?.color || '#434343'};
  background: ${({ $status }) => statusTheme[$status]?.bg || '#f0f0f0'};
  border-radius: 999px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
`;

const InfoCard = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  background: #fbfdff;
  border: 1px solid #edf2fb;
  border-radius: 12px;
`;

const InfoIcon = styled(FontAwesomeIcon)`
  margin-top: 2px;
  font-size: 16px;
  color: #2b6cb0;
`;

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: rgb(0 0 0 / 55%);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: rgb(0 0 0 / 85%);
`;

const NoteSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: #f9fbff;
  border: 1px solid #edf2fb;
  border-radius: 12px;
`;

const NoteHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const NoteIcon = styled(FontAwesomeIcon)`
  font-size: 16px;
  color: #2b6cb0;
`;

const NoteLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgb(0 0 0 / 60%);
`;

const NoteText = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgb(0 0 0 / 75%);
  white-space: pre-wrap;
`;

const ListSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ListHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ListIcon = styled(FontAwesomeIcon)`
  font-size: 14px;
  color: #8c8c8c;
`;

const ReasonList = styled.ul`
  padding-left: 18px;
  margin: 0;
  font-size: 13px;
  color: rgb(0 0 0 / 75%);
`;
