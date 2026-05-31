import { faShield } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  SecurityFeatureBox,
  SecurityFeatureDesc,
  SecurityFeatureHeader,
  SecurityFeatureTitle,
} from './SubscriptionPaymentMethodCard.styles';

interface PaymentSecurityFeatureProps {
  title: string;
  description: string;
}

export const PaymentSecurityFeature = ({
  title,
  description,
}: PaymentSecurityFeatureProps) => (
  <SecurityFeatureBox>
    <SecurityFeatureHeader>
      <FontAwesomeIcon icon={faShield} />
      <SecurityFeatureTitle>{title}</SecurityFeatureTitle>
    </SecurityFeatureHeader>
    <SecurityFeatureDesc>{description}</SecurityFeatureDesc>
  </SecurityFeatureBox>
);
