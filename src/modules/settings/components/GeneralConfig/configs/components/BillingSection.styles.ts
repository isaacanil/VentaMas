import { Typography } from 'antd';
import { m } from 'framer-motion';
import styled from 'styled-components';

export const { Title, Paragraph } = Typography;

export const Section = styled.div`
  padding: 1em;
  border-bottom: 1px solid #e8e8e8;
`;

export const SectionHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  cursor: pointer;

  .header-content {
    flex: 1;
  }

  .fa-icon {
    width: 14px;
    margin-top: 6px;
  }

  &:hover {
    opacity: 0.8;
  }
`;

export const MotionContent = styled(m.div)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`;

export const ChevronMotion = styled(m.div)`
  display: inline-flex;
`;
