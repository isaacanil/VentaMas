import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Typography } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';


const { Title, Paragraph } = Typography;

const Section = styled.div`
  padding: 1em;
  border-bottom: 1px solid #e8e8e8;
`;

const SectionHeader = styled.div`
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .header-content {
    flex: 1;
  }

  .fa-icon {
    margin-top: 6px;
    width: 14px;
  }

  &:hover {
    opacity: 0.8;
  }
`;

const MotionContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`;

const BillingSection = ({ title, description, children, hidden = false }) => {
  if (hidden) return null;
  const [isExpanded, setIsExpanded] = useState(false);
  const sectionRef = useRef(null);
  
  // useClickOutSide(sectionRef, isExpanded, () => setIsExpanded(false));

  return (
    <Section ref={sectionRef}>
      <SectionHeader 
        isExpanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FontAwesomeIcon icon={faChevronRight} className="fa-icon" />
        </motion.div>
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
              ease: "easeInOut"
            }}
          >
            {children}
          </MotionContent>
        )}
      </AnimatePresence>
    </Section>
  );
};

export default BillingSection;