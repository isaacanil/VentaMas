import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  faClock,
  faEnvelope,
  faHourglassEnd,
  faNoteSticky,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Popconfirm, Tooltip } from 'antd';
import { type KeyboardEventHandler } from 'react';
import styled from 'styled-components';

import { getStatusLabel, statusTheme } from '../constants/constants';

import type {
  AuthorizationRequest,
  AuthorizationRequestListItem,
} from '@/views/pages/Authorizations/components/AuthorizationRequests/types';

type ApproveHandler = (id: string) => void | string | Promise<void | string>;

type RejectHandler = (id: string) => void | Promise<void>;

type DetailHandler = (request: AuthorizationRequest) => void;

interface RequestCardProps {
  item: AuthorizationRequestListItem;
  onApprove: ApproveHandler;
  onReject: RejectHandler;
  onOpenDetails: DetailHandler;
}

export const RequestCard = ({
  item,
  onApprove,
  onReject,
  onOpenDetails,
}: RequestCardProps) => {
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
  const disableReject = status !== 'pending';

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
              void onApprove(key);
            }}
          >
            Aprobar
          </ActionButton>
        </Tooltip>
        <Popconfirm
          title="¿Rechazar solicitud?"
          onConfirm={() => {
            void onReject(key);
          }}
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
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #e4eaf5;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgb(15 37 68 / 6%);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: #c0d2f0;
    box-shadow: 0 14px 32px rgb(15 37 68 / 12%);
  }
`;

const CardHeader = styled.header`
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  gap: 12px;
  align-items: center;
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
  color: rgb(0 0 0 / 90%);
`;

const CardSubtitle = styled.span`
  font-size: 12px;
  color: rgb(0 0 0 / 50%);
`;

const StatusPill = styled.span<{ $status: string }>`
  justify-self: end;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $status }) => statusTheme[$status]?.color || '#434343'};
  background: ${({ $status }) => statusTheme[$status]?.bg || '#f0f0f0'};
  border-radius: 999px;
`;

const MetaList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
`;

const MetaItem = styled.li`
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 8px;
  align-items: flex-start;
`;

const MetaIcon = styled(FontAwesomeIcon)`
  margin-top: 2px;
  font-size: 14px;
  color: #8c8c8c;
`;

const MetaContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MetaLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: rgb(0 0 0 / 55%);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const MetaValue = styled.span`
  font-size: 13px;
  color: rgb(0 0 0 / 88%);
`;

const NoteSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: #f9fbff;
  border: 1px solid #e2e8f5;
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

const NoteTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgb(0 0 0 / 60%);
`;

const NoteText = styled.p`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  font-size: 13px;
  line-height: 1.4;
  color: rgb(0 0 0 / 78%);
  -webkit-box-orient: vertical;
`;

const CardActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const ActionButton = styled(Button)`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-weight: 600;
`;
