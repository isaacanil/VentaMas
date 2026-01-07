// @ts-nocheck
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const LoadingIndicator = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <FontAwesomeIcon icon={faSpinner} spin style={{ marginLeft: '5px' }} />
  );
};
