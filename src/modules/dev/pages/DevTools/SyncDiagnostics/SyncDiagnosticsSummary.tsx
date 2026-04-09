import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';

import type { DiagnosticsSummary } from '@/domain/warehouse/syncDiagnosticsLogic';

export const SyncDiagnosticsSummary = ({
  summary,
}: {
  summary: DiagnosticsSummary | null;
}) => {
  if (!summary) {
    return null;
  }

  return (
    <Card>
      <Row gutter={16}>
        <Col span={4}>
          <Statistic title="Productos" value={summary.products} />
        </Col>
        <Col span={4}>
          <Statistic title="Batches" value={summary.batches} />
        </Col>
        <Col span={4}>
          <Statistic title="Stocks" value={summary.stocks} />
        </Col>
        <Col span={4}>
          <Statistic
            title="Prod con mismatch"
            value={summary.productMismatches}
            valueStyle={{
              color: summary.productMismatches ? '#cf1322' : '#3f8600',
            }}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="Batches con mismatch"
            value={summary.batchMismatches}
            valueStyle={{
              color: summary.batchMismatches ? '#cf1322' : '#3f8600',
            }}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="Orphans"
            value={summary.orphans}
            valueStyle={{ color: summary.orphans ? '#cf1322' : '#3f8600' }}
          />
        </Col>
      </Row>
    </Card>
  );
};
