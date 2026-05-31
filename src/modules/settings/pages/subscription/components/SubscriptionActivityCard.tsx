import {
  faChartLine,
  faCircleCheck,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';

import type { PaymentRow } from '../subscription.types';
import {
  formatDate,
  formatMoney,
  getProviderLabel,
  isSuccessfulPaymentStatus,
  normalizePaymentStatus,
} from '../subscription.utils';
import { ActivityItem } from './ActivityItem';
import {
  ActivityEmpty,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from './SubscriptionOverviewCard.styles';

interface SubscriptionActivityCardProps {
  paymentRows: PaymentRow[];
  onViewAll: () => void;
}

export const SubscriptionActivityCard = ({
  paymentRows,
  onViewAll,
}: SubscriptionActivityCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Actividad Reciente</CardTitle>
      <Button
        type="link"
        size="small"
        style={{ padding: 0, height: 'auto', fontSize: '0.78rem' }}
        onClick={onViewAll}
      >
        Ver todo
      </Button>
    </CardHeader>
    <CardBody>
      {paymentRows.length > 0 ? (
        paymentRows.map((item) => {
          const normalizedStatus = normalizePaymentStatus(item.status);
          const itemIcon =
            normalizedStatus === 'pagado'
              ? faCircleCheck
              : normalizedStatus === 'pendiente'
                ? faChartLine
                : faCircleXmark;
          const itemColor =
            normalizedStatus === 'pagado'
              ? '#16a34a'
              : normalizedStatus === 'pendiente'
                ? '#d97706'
                : '#dc2626';
          const title = isSuccessfulPaymentStatus(item.status)
            ? 'Pago procesado exitosamente'
            : normalizedStatus === 'pendiente'
              ? 'Cobro en seguimiento'
              : 'Intento de cobro con incidencia';

          return (
            <ActivityItem
              key={item.key}
              icon={
                <FontAwesomeIcon
                  icon={itemIcon}
                  style={{ color: itemColor, fontSize: '1rem' }}
                />
              }
              title={title}
              description={
                item.description !== '-'
                  ? item.description
                  : `${formatMoney(item.amount, item.currency)} - ${getProviderLabel(item.provider)}`
              }
              time={formatDate(item.createdAt)}
            />
          );
        })
      ) : (
        <ActivityEmpty>
          Aún no hay movimientos de pago registrados en el historial.
        </ActivityEmpty>
      )}
    </CardBody>
  </Card>
);
