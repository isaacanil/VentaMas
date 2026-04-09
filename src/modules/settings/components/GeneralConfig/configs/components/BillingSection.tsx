import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Typography } from 'antd';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

const { Title, Paragraph } = Typography;

const Section = styled.div`
  padding: 1em;
  border-bottom: 1px solid #e8e8e8;
`;

const SectionHeader = styled.div`
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

const MotionContent = styled(m.div)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`;

const ChevronMotion = styled(m.div)`
  display: inline-flex;
`;

interface BillingSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  hidden?: boolean;
  sectionId?: string;
}

const BillingSection = ({
  title,
  description,
  children,
  hidden = false,
  sectionId,
}: BillingSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  // useClickOutSide(sectionRef, isExpanded, () => setIsExpanded(false));

  const sectionAttributes = sectionId
    ? { id: sectionId, 'data-config-section': sectionId }
    : {};

  if (hidden) {
    return null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <Section
        ref={sectionRef}
        {...sectionAttributes}
        data-config-expandable="true"
      >
        <SectionHeader
          data-role="config-section-header"
          data-expanded={isExpanded}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronMotion
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FontAwesomeIcon icon={faChevronRight} className="fa-icon" />
          </ChevronMotion>
          <div className="header-content">
            <Title level={4}>{title}</Title>
            <Paragraph>{description}</Paragraph>
          </div>
        </SectionHeader>

        <AnimatePresence>
          {isExpanded && (
            <MotionContent
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: 0.2,
                ease: 'easeInOut',
              }}
            >
              {children}
            </MotionContent>
          )}
        </AnimatePresence>
      </Section>
    </LazyMotion>
  );
};

export default BillingSection;
