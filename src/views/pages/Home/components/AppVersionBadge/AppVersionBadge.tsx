import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { fbGetAppVersion } from '../../../../../firebase/app/fbGetAppVersion';

import type { JSX } from 'react';

type FirestoreTimestamp = {
  seconds: number;
  nanoseconds?: number;
};

type AppVersionDoc = {
  version?: FirestoreTimestamp | null;
  [key: string]: unknown;
} | null;

function timestampToVersion(timestamp?: FirestoreTimestamp | null): string {
  if (!timestamp || typeof timestamp.seconds !== 'number') return '';
  const date = new Date(timestamp.seconds * 1000);
  const day = `0${date.getDate()}`.slice(-2);
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `Versión ${day} de ${month} ${year}`;
}

type AppVersionBadgeProps = {
  showLabel?: boolean;
  className?: string;
};

export const AppVersionBadge = ({
  showLabel = true,
  className,
}: AppVersionBadgeProps): JSX.Element => {
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState<AppVersionDoc>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAppVersion = async (): Promise<void> => {
      try {
        const version = await fbGetAppVersion();
        if (isMounted) {
          setAppVersion(version as AppVersionDoc);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAppVersion();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigate = (): void => {
    void navigate('/changelogs/list');
  };

  const versionLabel = timestampToVersion(appVersion?.version);
  const displayLabel = isLoading
    ? 'Cargando versión…'
    : versionLabel || 'Versión no disponible';

  return (
    <BadgeContainer
      aria-live="polite"
      className={className}
      $showLabel={showLabel}
    >
      {showLabel && <BadgeLabel>Estado de la versión</BadgeLabel>}
      <BadgeButton type="button" onClick={handleNavigate} disabled={isLoading}>
        <BadgeDot $active={Boolean(versionLabel)} />
        <BadgeText>{displayLabel}</BadgeText>
      </BadgeButton>
    </BadgeContainer>
  );
};

const BadgeContainer = styled.div<{ $showLabel: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $showLabel }) => ($showLabel ? '0.35rem' : '0')};
  align-items: flex-end;
`;

const BadgeLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: rgb(15 23 42 / 55%);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const BadgeButton = styled.button`
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  padding: 0.35rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(15 23 42 / 85%);
  cursor: pointer;
  background: rgb(255 255 255 / 85%);
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: 999px;
  box-shadow: 0 2px 6px rgb(15 23 42 / 8%);
  transition:
    transform 150ms ease,
    box-shadow 150ms ease,
    border-color 150ms ease;

  &:hover {
    box-shadow: 0 4px 14px rgb(15 23 42 / 12%);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: default;
    box-shadow: none;
    opacity: 0.7;
    transform: none;
  }
`;

const BadgeDot = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  background: ${({ $active }) => ($active ? '#16a34a' : '#9ca3af')};
  border-radius: 50%;
`;

const BadgeText = styled.span`
  white-space: nowrap;
`;
