import { Button, Popconfirm, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  faClock,
  faEnvelope,
  faHourglassEnd,
  faNoteSticky,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type KeyboardEventHandler } from 'react';
import styled from 'styled-components';
import { getStatusLabel, statusTheme } from '../constants/constants';
import type {
  AuthorizationRequest,
  AuthorizationRequestListItem,
} from '../types';

type ApproveHandler = (id: string) => void | string | Promise<void | string>;

type RejectHandler = (id: string) => void | Promise<void>;

type DetailHandler = (request: AuthorizationRequest) => void;

interface RequestCardProps {
  item: AuthorizationRequestListItem;
  onApprove: ApproveHandler;
  onReject: RejectHandler;
  onOpenDetails: DetailHandler;
}

export const RequestCard = ({ item, onApprove, onReject, onOpenDetails }: RequestCardProps) => {
  const {
    key,
    moduleMeta,
    reference,
    requestedByName,
    requestedByEmail,
    requestNote,
    createdStr,
    expiresStr,
    status,
    raw,
  } = item;

  const disableApprove = status !== 'pending';
  const disableReject = status !== 'pending' || status === 'rejected';

  const handleCardClick = () => {
    onOpenDetails(raw);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenDetails(raw);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <CardHeader>
        <HeaderIcon icon={moduleMeta.icon} />
        <HeaderInfo>
          <CardTitle>{moduleMeta.title}</CardTitle>
          <CardSubtitle>{moduleMeta.summary}</CardSubtitle>
        </HeaderInfo>
        <StatusPill $status={status}>{getStatusLabel(status)}</StatusPill>
      </CardHeader>

      <MetaList>
        <MetaItem>
          <MetaIcon icon={moduleMeta.icon} />
          <MetaContent>
            <MetaLabel>{moduleMeta.referenceLabel}</MetaLabel>
            <MetaValue>{reference || '-'}</MetaValue>
          </MetaContent>
        </MetaItem>
        <MetaItem>
          <MetaIcon icon={faUser} />
          <MetaContent>
            <MetaLabel>Solicitado por</MetaLabel>
            <MetaValue>{requestedByName || '-'}</MetaValue>
          </MetaContent>
        </MetaItem>
        {requestedByEmail && (
          <MetaItem>
            <MetaIcon icon={faEnvelope} />
            <MetaContent>
              <MetaLabel>Correo</MetaLabel>
              <MetaValue>{requestedByEmail}</MetaValue>
            </MetaContent>
          </MetaItem>
        )}
        <MetaItem>
          <MetaIcon icon={faClock} />
          <MetaContent>
            <MetaLabel>Creada</MetaLabel>
            <MetaValue>{createdStr}</MetaValue>
          </MetaContent>
        </MetaItem>
        <MetaItem>
          <MetaIcon icon={faHourglassEnd} />
          <MetaContent>
            <MetaLabel>Expira</MetaLabel>
            <MetaValue>{expiresStr}</MetaValue>
          </MetaContent>
        </MetaItem>
      </MetaList>

      <NoteSection>
        <NoteHeader>
          <NoteIcon icon={faNoteSticky} />
          <NoteTitle>Nota de solicitud</NoteTitle>
        </NoteHeader>
        <NoteText>{requestNote || 'Sin nota registrada.'}</NoteText>
      </NoteSection>

      <CardActions
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Tooltip title={disableApprove ? 'Acción no disponible' : 'Aprobar'}>
          <ActionButton
            type="primary"
            icon={<CheckOutlined />}
            disabled={disableApprove}
            onClick={(event) => {
              event.stopPropagation();
              onApprove(key);
            }}
          >
            Aprobar
          </ActionButton>
        </Tooltip>
        <Popconfirm
          title="¿Rechazar solicitud?"
          onConfirm={() => onReject(key)}
          okText="Sí"
          cancelText="No"
          disabled={disableReject}
        >
          <Tooltip title={disableReject ? 'Acción no disponible' : 'Rechazar'}>
            <ActionButton
              danger
              icon={<CloseOutlined />}
              disabled={disableReject}
              onClick={(event) => event.stopPropagation()}
            >
              Rechazar
            </ActionButton>
          </Tooltip>
        </Popconfirm>
      </CardActions>
    </Card>
  );
};

const Card = styled.article`
  display: grid;
  grid-template-rows: repeat(3, min-content) 1fr;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e4eaf5;
  background-color: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 37, 68, 0.06);
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #c0d2f0;
    box-shadow: 0 14px 32px rgba(15, 37, 68, 0.12);
  }
`;

const CardHeader = styled.header`
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  align-items: center;
  gap: 12px;
`;

const HeaderIcon = styled(FontAwesomeIcon)`
  font-size: 26px;
  color: #2b6cb0;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
`;

const CardSubtitle = styled.span`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
`;

const StatusPill = styled.span<{ $status: string }>`
  justify-self: end;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $status }) => statusTheme[$status]?.color || '#434343'};
  background: ${({ $status }) => statusTheme[$status]?.bg || '#f0f0f0'};
`;

const MetaList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const MetaItem = styled.li`
  display: grid;
  grid-template-columns: min-content 1fr;
  align-items: flex-start;
  gap: 8px;
`;

const MetaIcon = styled(FontAwesomeIcon)`
  font-size: 14px;
  color: #8c8c8c;
  margin-top: 2px;
`;

const MetaContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MetaLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const MetaValue = styled.span`
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
`;

const NoteSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background-color: #f9fbff;
  border: 1px solid #e2e8f5;
`;

const NoteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NoteIcon = styled(FontAwesomeIcon)`
  font-size: 16px;
  color: #2b6cb0;
`;

const NoteTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
`;

const NoteText = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.78);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const ActionButton = styled(Button)`
  height: 40px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;
