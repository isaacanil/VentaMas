// Candidate for deletion: no modules currently render this process viewer overlay.
import { AnimatePresence, m } from 'framer-motion';
import styled from 'styled-components';

interface ProcessViewerProps {
  status: string;
  progress: number;
  currentProduct: {
    id: string;
    name: string;
    stock: number;
  } | null;
  error: boolean;
}

export const ProcessViewer = ({
  status,
  progress,
  currentProduct,
  error,
}: ProcessViewerProps) => {
  return (
    <Container>
      <ProcessCard
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <StatusText
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          key={status}
        >
          {status}
        </StatusText>

        <ProgressBar>
          <ProgressFill
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.5 }}
            $error={error}
          />
        </ProgressBar>

        <AnimatePresence mode="wait">
          {currentProduct && (
            <ProductInfo
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
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 50%);
`;

const ProcessCard = styled(m.div)`
  width: 90%;
  max-width: 500px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
`;

const StatusText = styled(m.h2)`
  margin-bottom: 1rem;
  color: #333;
  text-align: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  overflow: hidden;
  background: #eee;
  border-radius: 5px;
`;

const ProgressFill = styled(m.div)<{ $error: boolean }>`
  width: 100%;
  height: 100%;
  background: ${({ $error }: { $error: boolean }) =>
    $error ? '#ff4d4f' : '#4caf50'};
  transform-origin: left center;
`;

const ProductInfo = styled(m.div)`
  padding: 1rem;
  margin-top: 1rem;
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
