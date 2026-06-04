import { Progress } from 'antd';

import { ProgressBar, Stats } from '../LoginImageConfig.styles';

type LoginImageProgressProps = {
  compressedSize: number | null;
  loadingAction: boolean;
  originalSize: number | null;
  progress: number;
};

export const LoginImageProgress = ({
  compressedSize,
  loadingAction,
  originalSize,
  progress,
}: LoginImageProgressProps) => {
  if (!loadingAction || progress <= 0) return null;

  return (
    <ProgressBar>
      <Progress percent={Math.round(progress)} />
      {originalSize !== null && compressedSize !== null && (
        <Stats>
          <p>Original: {originalSize.toFixed(1)} KB</p>
          <p>Optimizado: {compressedSize.toFixed(1)} KB</p>
          <p>
            Reducción:{' '}
            {(((originalSize - compressedSize) / originalSize) * 100).toFixed(
              1,
            )}
            %
          </p>
        </Stats>
      )}
    </ProgressBar>
  );
};
