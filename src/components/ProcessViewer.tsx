import { AnimatePresence } from 'framer-motion';

import {
  Container,
  ProductInfo,
  ProcessCard,
  ProgressBar,
  ProgressFill,
  StatusText,
} from './ProcessViewer.styles';

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

const PROCESS_CARD_MOTION = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.3 },
};

const STATUS_TEXT_MOTION = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

const PROGRESS_FILL_TRANSITION = { duration: 0.5 };

const PRODUCT_INFO_MOTION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const ProcessViewer = ({
  status,
  progress,
  currentProduct,
  error,
}: ProcessViewerProps) => {
  return (
    <Container>
      <ProcessCard {...PROCESS_CARD_MOTION}>
        <StatusText {...STATUS_TEXT_MOTION} key={status}>
          {status}
        </StatusText>

        <ProgressBar>
          <ProgressFill
            animate={{ scaleX: progress / 100 }}
            transition={PROGRESS_FILL_TRANSITION}
            $error={error}
          />
        </ProgressBar>

        <AnimatePresence mode="wait">
          {currentProduct && (
            <ProductInfo {...PRODUCT_INFO_MOTION} key={currentProduct.id}>
              <h3>{currentProduct.name}</h3>
              <p>Stock: {currentProduct.stock}</p>
            </ProductInfo>
          )}
        </AnimatePresence>
      </ProcessCard>
    </Container>
  );
};
