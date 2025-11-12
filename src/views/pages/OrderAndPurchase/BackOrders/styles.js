import { motion } from 'framer-motion';
import styled from 'styled-components';

export const Container = styled.div`
  height: 100vh;
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  overflow: hidden;
  background: #f9fafb;
`;

export const Content = styled.div`
  padding: 1em 24px 24px;
  background: #f9fafb;
  overflow-y: auto;

  --color-bg-main: #f9fafb;
  --color-bg-card: #ffffff;
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-tertiary: #6b7280;
  --color-border: #e5e7eb;
  --color-pending: #4b5563;
  --color-reserved: #1f2937;
  --color-completed: #111827;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.05);
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
`;

export const Header = styled.div`
  margin-bottom: var(--spacing-lg);
`;

export const HeaderStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

export const StatBox = styled.div`
  background: var(--color-bg-card);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);

  .stat-label {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: ${(props) => props.color || 'var(--color-text-primary)'};
  }
`;

export const FiltersWrapper = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
`;

export const ProductGroupsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 0.6em;
`;

export const ProductGroup = styled(motion.div)`
  background-color: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  /* height: fit-content; */
  height: ${(props) => (props.isCollapsed ? 'fit-content' : 'auto')};
`;

export const ProductGroupHeader = styled.div`
  padding: 0em;
  border-bottom: 1px solid var(--color-border);
  background-color: #fff;

  h2 {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xs);
  }
`;

export const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.4em;
  padding: 16px;
  background: #fff;
`;

export const BackorderCard = styled(motion.div)`
  background: #ffffff;
  transition: all 0.2s ease;
  border: 1px solid var(--color-border);

  &:hover {
    background: #fafafa;
    transform: translateY(-1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
`;

export const CardTop = styled.div`
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
`;

export const ProductName = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  background: ${(props) =>
    props.status === 'pending'
      ? '#fff7e6'
      : props.status === 'reserved'
        ? '#e6f7ff'
        : '#f6ffed'};
  border: 1px solid
    ${(props) =>
      props.status === 'pending'
        ? '#ffd591'
        : props.status === 'reserved'
          ? '#91d5ff'
          : '#b7eb8f'};
  color: ${(props) =>
    props.status === 'pending'
      ? '#d46b08'
      : props.status === 'reserved'
        ? '#1890ff'
        : '#52c41a'};
  white-space: nowrap;
`;

export const CardContent = styled.div`
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .quantity {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .date {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
`;

export const QuantityGrid = styled.div`
  display: grid;

  gap: var(--spacing-sm);
`;

export const QuantityBox = styled.div`
  text-align: center;
  padding: var(--spacing-sm);
  background: #ffffff;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);

  .label {
    font-size: 11px;
    color: var(--color-text-tertiary);
    margin-bottom: 2px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 16px;
    font-weight: 600;
    color: ${(props) =>
      props.highlight ? 'var(--color-pending)' : 'var(--color-text-primary)'};
    letter-spacing: -0.5px;
  }
`;

export const ProgressBar = styled.div`
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;

  .fill {
    height: 100%;
    background: ${(props) =>
      props.progress >= 80
        ? '#22c55e'
        : props.progress >= 50
          ? '#f59e0b'
          : '#d1d5db'};
    width: ${(props) => props.progress}%;
    transition: all 0.3s ease;
  }
`;

export const CardFooter = styled.div`
  padding: var(--spacing-sm) var(--spacing-md);
  background: #fafafa;
  font-size: 11px;
  color: var(--color-text-tertiary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border);

  .action {
    color: var(--color-text-secondary);
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-text-primary);
    }
  }
`;

export const LoadingPlaceholder = styled.div`
  height: ${(props) => props.height || '20px'};
  background: linear-gradient(90deg, #f5f5f5 0%, #eeeeee 50%, #f5f5f5 100%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: var(--radius-sm);

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

export const GroupProgress = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: ${(props) =>
    props.progress >= 80
      ? '#f0fdf4'
      : props.progress >= 50
        ? '#fefce8'
        : '#fff'};
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: ${(props) =>
    props.progress >= 80
      ? '#166534'
      : props.progress >= 50
        ? '#854d0e'
        : 'var(--color-text-secondary)'};
`;

export const TrendIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;

  &.positive {
    color: #16a34a;
  }
  &.negative {
    color: #dc2626;
  }
  &.neutral {
    color: var(--color-text-tertiary);
  }
`;
