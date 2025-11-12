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

export const AppVersionBadge = ({ showLabel = true, className }: AppVersionBadgeProps): JSX.Element => {
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
    navigate('/changelogs/list');
  };

  const versionLabel = timestampToVersion(appVersion?.version);
  const displayLabel = isLoading ? 'Cargando versión…' : versionLabel || 'Versión no disponible';

  return (
    <BadgeContainer aria-live="polite" className={className} $showLabel={showLabel}>
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
  align-items: flex-end;
  gap: ${({ $showLabel }) => ($showLabel ? '0.35rem' : '0')};
`;

const BadgeLabel = styled.span`
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(15, 23, 42, 0.55);
  font-weight: 600;
`;

const BadgeButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.85);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
    transform: none;
    box-shadow: none;
  }
`;

const BadgeDot = styled.span<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#16a34a' : '#9ca3af')};
  flex-shrink: 0;
`;

const BadgeText = styled.span`
  white-space: nowrap;
`;
