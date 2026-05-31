import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  ChevronMotion,
  MotionContent,
  Paragraph,
  Section,
  SectionHeader,
  Title,
} from './BillingSection.styles';

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

  const sectionAttributes = sectionId
    ? { id: sectionId, 'data-config-section': sectionId }
    : {};

  if (hidden) {
    return null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <Section {...sectionAttributes} data-config-expandable="true">
        <SectionHeader
          data-role="config-section-header"
          data-expanded={isExpanded}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
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
