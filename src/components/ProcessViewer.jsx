// Candidate for deletion: no modules currently render this process viewer overlay.
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

export const ProcessViewer = ({ status, progress, currentProduct, error }) => {
  return (
    <Container>
      <ProcessCard
        as={motion.div}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <StatusText
          as={motion.h2}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          key={status}
        >
          {status}
        </StatusText>

        <ProgressBar>
          <ProgressFill
            as={motion.div}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            $error={error}
          />
        </ProgressBar>

        <AnimatePresence mode="wait">
          {currentProduct && (
            <ProductInfo
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key={currentProduct.id}
            >
              <h3>{currentProduct.name}</h3>
              <p>Stock: {currentProduct.stock}</p>
            </ProductInfo>
          )}
        </AnimatePresence>
      </ProcessCard>
    </Container>
  );
};

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const ProcessCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StatusText = styled.h2`
  margin-bottom: 1rem;
  text-align: center;
  color: #333;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  background: #eee;
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.$error ? '#ff4d4f' : '#4caf50'};
  width: 0%;
`;

const ProductInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  
  h3 {
    margin: 0;
    color: #333;
  }
  
  p {
    margin: 0.5rem 0 0;
    color: #666;
  }
`;
