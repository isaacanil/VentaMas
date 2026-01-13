// @ts-nocheck
import {
  AlignLeftOutlined,
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  FireOutlined,
  SyncOutlined,
} from '@/constants/icons/antd';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { functions } from '@/firebase/firebaseconfig';
import { CashCountMetaData } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData';


const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CashCountAudit = () => {
  const currentUser = useSelector(selectUser);
  const [business, setBusiness] = useState('');
  const [user, setUser] = useState('');
  const [cashCountId, setCashCountId] = useState('');
  const [cashCounts, setCashCounts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [businessUsers, setBusinessUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [cashCountDoc, setCashCountDoc] = useState(null);
  const [recalc, setRecalc] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [mode, setMode] = useState('manual'); // manual | auto
  const [autoRuns, setAutoRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedAutoCashCount, setSelectedAutoCashCount] = useState('');
  const [autoRange, setAutoRange] = useState(null);
  const [threshold, setThreshold] = useState(0);

  useEffect(() => {
    if (currentUser?.businessID) {
      setBusiness((prev) => prev || currentUser.businessID);
      setUser((prev) => prev || currentUser.uid);
    }
  }, [currentUser?.businessID, currentUser?.uid]);

  useEffect(() => {
    if (!business) return undefined;
    const ref = collection(
      db,
      'businesses',
      business,
      'cashCounts',
    );
    const q = query(ref, orderBy('cashCount.createdAt', 'desc'), limit(25));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((doc) => {
        const data = doc.data()?.cashCount || {};
        return {
          id: doc.id,
          number: data.incrementNumber,
          state: data.state,
        };
      });
      setCashCounts(items);
      if (!cashCountId && items.length > 0) {
        setCashCountId(items[0].id);
      }
    });
    return () => unsubscribe();
  }, [business, cashCountId]);

  useEffect(() => {
    const ref = collection(db, 'businesses');
    const q = query(ref, limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((doc) => {
        const data = doc.data() || {};
        const name =
          data.business?.name || data.name || data.businessName || doc.id;
        return { id: doc.id, name };
      });
      setBusinesses(items);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!business) return;
    setLoadingUsers(true);
    (async () => {
      try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(query(usersRef, limit(500)));
        const list = snap.docs.map((d) => d.data());
        const filtered = list.filter((u) => {
          const dataBiz =
            u?.user?.businessID ||
            u?.user?.businessId ||
            u?.businessID ||
            u?.businessId;
          return dataBiz === business;
        });
        setBusinessUsers(filtered);
        if (!user && filtered.length > 0) {
          const first = filtered[0]?.user?.id || filtered[0]?.user?.uid;
          if (first) setUser(first);
        }
      } catch (err) {
        console.error('Error loading users for business', err);
        setBusinessUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [business, user]);

  useEffect(() => {
    const loadData = async () => {
      if (!business || !cashCountId) return;
      setLoadingData(true);
      setDataError(null);
      try {
        const ccRef = doc(db, 'businesses', business, 'cashCounts', cashCountId);
        const ccSnap = await getDoc(ccRef);
        if (!ccSnap.exists()) {
          throw new Error('No se encontró el cuadre seleccionado');
        }
        const ccData = ccSnap.data()?.cashCount || {};
        setCashCountDoc(ccData);

        const invoicesSnap = await getDocs(
          query(
            collection(db, 'businesses', business, 'invoices'),
            where('data.cashCountId', '==', cashCountId),
          ),
        );
        const invoices = invoicesSnap.docs.map((d) => d.data());

        const expensesSnap = await getDocs(
          query(
            collection(db, 'businesses', business, 'expenses'),
            where('expense.payment.cashRegister', '==', cashCountId),
          ),
        );
        const expenses = expensesSnap.docs.map((d) => d.data()?.expense);

        const openingTs = ccData?.opening?.date;
        const closingTs = ccData?.closing?.date;
        const start = openingTs?.toMillis
          ? openingTs.toMillis()
          : openingTs instanceof Date
            ? openingTs.getTime()
            : null;
        const end = closingTs?.toMillis
          ? closingTs.toMillis()
          : closingTs instanceof Date
            ? closingTs.getTime()
            : Date.now();

        const cashierId =
          ccData?.opening?.employee?.id ||
          ccData?.opening?.employee?.uid ||
          ccData?.opening?.employee?._key?.path?.segments?.slice(-1)[0] ||
          null;

        let arPayments = [];
        if (cashierId && start) {
          try {
            const paymentsSnap = await getDocs(
              query(
                collection(
                  db,
                  'businesses',
                  business,
                  'accountsReceivablePayments',
                ),
                where('createdUserId', '==', cashierId),
                where('createdAt', '>=', Timestamp.fromMillis(start)),
                where('createdAt', '<=', Timestamp.fromMillis(end)),
              ),
            );
            arPayments = paymentsSnap.docs.map((d) => d.data());
          } catch (err) {
            console.warn('No se pudieron cargar pagos CxC:', err);
          }
        }

        const meta = CashCountMetaData(
          ccData,
          invoices || [],
          expenses || [],
          arPayments || [],
        );
        setRecalc(meta);

        setAuditLog((prev) => {
          const key = `${business}/${cashCountId}`;
          const nextEntry = {
            key,
            business,
            cashCountId,
            cashier: user || cashierId || null,
            stored: ccData,
            recalculated: meta,
            at: Date.now(),
          };
          const existingIndex = prev.findIndex((item) => item.key === key);
          if (existingIndex >= 0) {
            const clone = [...prev];
            clone[existingIndex] = nextEntry;
            return clone;
          }
          return [nextEntry, ...prev].slice(0, 20);
        });
      } catch (err) {
        console.error(err);
        setDataError(err.message);
        setCashCountDoc(null);
        setRecalc(null);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [business, cashCountId, user]);

  const businessOptions = useMemo(() => {
    const base = businesses.map((b) => ({
      value: b.id,
      label: b.name || b.id,
    }));
    if (
      currentUser?.businessID &&
      !base.some((b) => b.value === currentUser.businessID)
    ) {
      base.unshift({
        value: currentUser.businessID,
        label: currentUser.businessID,
      });
    }
    return base;
  }, [businesses, currentUser?.businessID]);
  const autoBusinessOptions = useMemo(
    () => [{ value: 'ALL', label: 'Todos los negocios' }, ...businessOptions],
    [businessOptions],
  );

  useEffect(() => {
    if (mode === 'auto' && !business) {
      setBusiness('ALL');
    }
    if (mode === 'manual' && business === 'ALL' && currentUser?.businessID) {
      setBusiness(currentUser.businessID);
    }
  }, [mode, business, currentUser?.businessID]);

  const userOptions = useMemo(() => {
    if (!Array.isArray(businessUsers)) return [];
    return businessUsers.map((u) => ({
      value: u.user?.id || u.user?.uid || u.id,
      label: [
        u.user?.name || u.user?.username || 'Usuario',
        u.user?.id || u.user?.uid || '',
      ]
        .filter(Boolean)
        .join(' · '),
    }));
  }, [businessUsers]);

  const cashCountOptions = useMemo(() => {
    return cashCounts.map((cc) => ({
      value: cc.id,
      label: cc.number ? `#${cc.number} (${cc.state || 'n/a'})` : cc.id,
    }));
  }, [cashCounts]);

  const autoRunOptions = useMemo(
    () =>
      autoRuns.map((run) => ({
        value: run.id,
        label: `${run.businessId} · ${new Date(run.createdAt).toLocaleString()} (${run.status || 'pending'})`,
      })),
    [autoRuns],
  );

  const autoCashCountOptions = useMemo(() => {
    if (!selectedRun) return [];
    const run = autoRuns.find((r) => r.id === selectedRun);
    if (!run?.items) return [];
    return run.items
      .filter((item) => Math.abs(Number(item.discrepancy || item.delta || 0)) > 0)
      .map((item) => ({
        value: item.cashCountId,
        label: `${item.businessId || run.businessId} · ${item.cashCountId} · Δ ${fmt(item.discrepancy || item.delta)}`,
      }));
  }, [selectedRun, autoRuns]);

  const handleRunAuto = async () => {
    const biz = business || 'ALL';
    if (!business) setBusiness('ALL');
    setLoadingRuns(true);
    try {
      const callable = httpsCallable(functions, 'runCashCountAudit');
      const payload = {
        businessId: biz === 'ALL' ? 'ALL' : biz,
        allBusinesses: biz === 'ALL',
        from: autoRange?.[0]?.valueOf?.() || null,
        to: autoRange?.[1]?.valueOf?.() || null,
        threshold: Number(threshold) || 0,
      };
      const { data } = await callable(payload);
      const run = {
        id: data?.runId || `run-${Date.now()}`,
        businessId: data?.businessId || business,
        businessIds: data?.businessIds || (biz === 'ALL' ? ['ALL'] : [biz]),
        status: data?.status || 'done',
        createdAt: data?.createdAt || Date.now(),
        items: data?.discrepancies || [],
      };
      setAutoRuns((prev) => [run, ...prev]);
      setSelectedRun(run.id);
      setSelectedAutoCashCount(run.items?.[0]?.cashCountId || '');
      if ((run.items || []).length === 0) {
        message.info('No se encontraron cuadres con discrepancia en el rango.');
      } else {
        message.success(`Se encontraron ${run.items.length} cuadres con discrepancia.`);
      }
    } catch (err) {
      console.error(err);
      message.error(err?.message || 'Error al lanzar auditoría automática');
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleSelectAutoItem = (cashCountId) => {
    setSelectedAutoCashCount(cashCountId);
    const run = autoRuns.find((r) => r.id === selectedRun);
    const item = run?.items?.find((i) => i.cashCountId === cashCountId);
    if (item?.businessId) {
      setBusiness(item.businessId);
    } else if (run?.businessId) {
      setBusiness(run.businessId);
    }
    if (cashCountId) {
      setCashCountId(cashCountId);
      setMode('manual');
    }
  };

  return (
    <PageWrapper>
      <Hero>
        <div>
          <Title level={2}>Cash count audit</Title>
        </div>
        <SummaryCard>
          <Title level={4}>Contexto</Title>
          <Space orientation="vertical" size={6}>
            <Inline>
              <Text type="secondary">Negocio</Text>
              {business ? (
                <Tag color="blue" variant="filled">
                  {business}
                </Tag>
              ) : (
                <Text type="secondary">Sin negocio</Text>
              )}
            </Inline>
            <Inline>
              <Text type="secondary">Cajero</Text>
              {user ? (
                <Tag color="processing" variant="filled">
                  {user}
                </Tag>
              ) : (
                <Text type="secondary">Sin cajero</Text>
              )}
            </Inline>
            <Inline>
              <Text type="secondary">Cuadre</Text>
              {cashCountId ? (
                <Tag color="purple" variant="filled">
                  {cashCountId}
                </Tag>
              ) : (
                <Text type="secondary">Sin cuadre</Text>
              )}
            </Inline>
          </Space>
        </SummaryCard>
      </Hero>

      <FiltersCard>
        <Inline $gap={12}>
          <Field>
            <FieldLabel>Modo</FieldLabel>
            <Space>
              <Button
                type={mode === 'manual' ? 'primary' : 'default'}
                icon={<AlignLeftOutlined />}
                onClick={() => setMode('manual')}
              >
                Manual
              </Button>
              <Button
                type={mode === 'auto' ? 'primary' : 'default'}
                icon={<ApiOutlined />}
                onClick={() => {
                  setMode('auto');
                  if (!business) setBusiness('ALL');
                }}
              >
                Autom&aacute;tico
              </Button>
            </Space>
          </Field>
        </Inline>

        <Divider />

        {mode === 'manual' ? (
          <Inline $gap={18}>
            <Field>
              <FieldLabel>Negocio</FieldLabel>
              <Select
                value={business}
                onChange={setBusiness}
                options={businessOptions}
                style={{ minWidth: 200 }}
                showSearch
                optionFilterProp="label"
              />
            </Field>
            <Field>
              <FieldLabel>Cajero</FieldLabel>
              <Select
                value={user}
                onChange={setUser}
                options={userOptions}
                style={{ minWidth: 200 }}
                loading={loadingUsers}
                placeholder={business ? 'Selecciona cajero' : 'Selecciona negocio primero'}
                showSearch
                optionFilterProp="label"
                disabled={!business}
                notFoundContent={
                  business
                    ? 'Sin usuarios en el negocio'
                    : 'Selecciona un negocio'
                }
              />
            </Field>
            <Field>
              <FieldLabel>Cuadre</FieldLabel>
              <Select
                value={cashCountId}
                onChange={setCashCountId}
                options={cashCountOptions}
                style={{ minWidth: 240 }}
                showSearch
                optionFilterProp="label"
              />
            </Field>
          </Inline>
        ) : (
          <Inline $gap={18}>
            <Field>
              <FieldLabel>Negocio</FieldLabel>
              <Select
                value={business}
                onChange={setBusiness}
                options={autoBusinessOptions}
                style={{ minWidth: 200 }}
                showSearch
                optionFilterProp="label"
              />
            </Field>
            <Field>
              <FieldLabel>Ejecutar auditor&iacute;a autom&aacute;tica</FieldLabel>
              <Space>
                <Button type="primary" icon={<ApiOutlined />} loading={loadingRuns} onClick={handleRunAuto}>
                  Lanzar job
                </Button>
                <Button icon={<SyncOutlined />} loading={loadingRuns} onClick={handleRunAuto}>
                  Actualizar jobs
                </Button>
              </Space>
            </Field>
            <Field>
              <FieldLabel>Rango de fechas</FieldLabel>
              <RangePicker
                style={{ minWidth: 260 }}
                value={autoRange}
                onChange={setAutoRange}
              />
            </Field>
            <Field>
              <FieldLabel>Umbral (abs) DOP</FieldLabel>
              <InputNumber
                min={0}
                value={threshold}
                onChange={setThreshold}
                style={{ width: 140 }}
              />
            </Field>
          </Inline>
        )}

        <Divider />

        {mode === 'manual' ? (
          <Space size="middle" wrap>
            <Button icon={<SyncOutlined />}>Recalcular</Button>
            <Button type="primary" icon={<BranchesOutlined />}>
              Abrir reporte detallado
            </Button>
          </Space>
        ) : (
          <Inline $gap={18}>
            <Field>
              <FieldLabel>Jobs de auditor&iacute;a</FieldLabel>
              <Select
                value={selectedRun}
                onChange={setSelectedRun}
                options={autoRunOptions}
                style={{ minWidth: 260 }}
                placeholder="Selecciona un job"
                loading={loadingRuns}
              />
            </Field>
            <Field>
              <FieldLabel>Cuadres con discrepancia</FieldLabel>
              <Select
                value={selectedAutoCashCount}
                onChange={handleSelectAutoItem}
                options={autoCashCountOptions}
                style={{ minWidth: 240 }}
                placeholder="Selecciona un cuadre"
                disabled={!selectedRun}
              />
            </Field>
          </Inline>
        )}
      </FiltersCard>

      {mode === 'manual' ? (
        <>
          <ComparisonGrid>
            <DataCard>
              <CardHeader>
                <Space>
                  <CheckCircleOutlined />
                  <Text strong>Datos guardados (Firestore)</Text>
                </Space>
                {loadingData && <Tag icon={<SyncOutlined spin />}>Cargando</Tag>}
              </CardHeader>
              {dataError ? (
                <ErrorText>{dataError}</ErrorText>
              ) : cashCountDoc ? (
                <Metrics>
                  <MetricRow>
                    <Label>Total tarjeta</Label>
                    <Value>{fmt(cashCountDoc?.totalCard)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total transferencia</Label>
                    <Value>{fmt(cashCountDoc?.totalTransfer)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total facturado (snapshot)</Label>
                    <Value>{fmt(cashCountDoc?.totalCharged)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total cobrado CxC</Label>
                    <Value>{fmt(cashCountDoc?.totalReceivables)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total sistema</Label>
                    <Value>{fmt(cashCountDoc?.totalSystem)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total registro</Label>
                    <Value>{fmt(cashCountDoc?.totalRegister)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Discrepancia</Label>
                    <Value>{fmt(cashCountDoc?.totalDiscrepancy)}</Value>
                  </MetricRow>
                </Metrics>
              ) : (
                <Text type="secondary">
                  Selecciona un negocio y cuadre para ver los datos guardados.
                </Text>
              )}
            </DataCard>

            <DataCard>
              <CardHeader>
                <Space>
                  <FireOutlined />
                  <Text strong>Recalculado (CashRegisterClosure)</Text>
                </Space>
                {loadingData && <Tag icon={<SyncOutlined spin />}>Recalculando</Tag>}
              </CardHeader>
              {dataError ? (
                <ErrorText>{dataError}</ErrorText>
              ) : recalc ? (
                <Metrics>
                  <MetricRow>
                    <Label>Total tarjeta</Label>
                    <Value>{fmt(recalc.totalCard)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total transferencia</Label>
                    <Value>{fmt(recalc.totalTransfer)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total facturado (snapshot)</Label>
                    <Value>{fmt(recalc.totalCharged)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total cobrado CxC</Label>
                    <Value>{fmt(recalc.totalReceivables)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total sistema</Label>
                    <Value>{fmt(recalc.totalSystem)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total registro</Label>
                    <Value>{fmt(recalc.totalRegister)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Discrepancia</Label>
                    <Value>{fmt(recalc.totalDiscrepancy)}</Value>
                  </MetricRow>
                </Metrics>
              ) : (
                <Text type="secondary">
                  Selecciona un negocio y cuadre para recalcular.
                </Text>
              )}
            </DataCard>
          </ComparisonGrid>

          {auditLog.length > 0 && (
            <HistoryCard>
              <CardHeader>
                <Space>
                  <BranchesOutlined />
                  <Text strong>Resultados recientes</Text>
                </Space>
              </CardHeader>
              <HistoryGrid>
                {auditLog.map((entry) => (
                  <HistoryItem key={entry.key}>
                    <Label>
                      {entry.business} · {entry.cashCountId}
                    </Label>
                    <MetricRow>
                      <Label>Discrepancia guardada</Label>
                      <Value>{fmt(entry.stored?.totalDiscrepancy)}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Discrepancia recalculada</Label>
                      <Value>{fmt(entry.recalculated?.totalDiscrepancy)}</Value>
                    </MetricRow>
                    <MetaText>
                      Cajero: {entry.cashier || '—'} · {new Date(entry.at).toLocaleString()}
                    </MetaText>
                  </HistoryItem>
                ))}
              </HistoryGrid>
            </HistoryCard>
          )}
        </>
      ) : (
        <ComparisonGrid>
          <DataCard>
            <CardHeader>
              <Space>
                <ApiOutlined />
                <Text strong>Resultados autom&aacute;ticos</Text>
              </Space>
              {loadingRuns && <Tag icon={<SyncOutlined spin />}>Cargando</Tag>}
            </CardHeader>
            {selectedRun && selectedAutoCashCount ? (
              (() => {
                const run = autoRuns.find((r) => r.id === selectedRun);
                const item = run?.items?.find((i) => i.cashCountId === selectedAutoCashCount);
                return item ? (
                  <>
                    <MetricRow>
                      <Label>Job</Label>
                      <Value>{selectedRun}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Cuadre</Label>
                      <Value>{selectedAutoCashCount}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Discrepancia detectada</Label>
                      <Value>{fmt(item.delta)}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Guardada</Label>
                      <Value>{fmt(item.discrepancyStored)}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Recalculada</Label>
                      <Value>{fmt(item.discrepancyRecalc)}</Value>
                    </MetricRow>
                    <Space>
                      <Button type="primary" onClick={() => handleSelectAutoItem(selectedAutoCashCount)}>
                        Abrir en modo manual
                      </Button>
                    </Space>
                  </>
                ) : (
                  <Text type="secondary">Selecciona un cuadre con discrepancia.</Text>
                );
              })()
            ) : (
              <Text type="secondary">
                Selecciona un job y luego un cuadre con discrepancia para verlo.
              </Text>
            )}
          </DataCard>
        </ComparisonGrid>
      )}
    </PageWrapper>
  );
};

const fmt = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(num);
};

const PageWrapper = styled.div`
  display: grid;
  gap: 16px;
  padding: 16px;
  background: #f7f9fc;
  min-height: 100vh;
  color: #1f2937;
`;

const Hero = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: start;
`;

const SummaryCard = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 20px rgb(0 0 0 / 6%);
`;

const FiltersCard = styled(Card)`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgb(0 0 0 / 6%);
  color: #1f2937;

  .ant-card-body {
    padding: 16px;
  }
`;

const Inline = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ $gap = 8 }) => (typeof $gap === 'number' ? `${$gap}px` : $gap)};
  justify-content: flex-start;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
  min-width: 180px;
`;

const FieldLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #6b7280;
`;

const ComparisonGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
`;

const DataCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 20px rgb(0 0 0 / 8%);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Metrics = styled.div`
  display: grid;
  gap: 8px;
`;

const MetricRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.4);
`;

const Label = styled.span`
  font-size: 13px;
  color: #4b5563;
`;

const Value = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const ErrorText = styled.span`
  color: #b91c1c;
`;

const HistoryCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 20px rgb(0 0 0 / 6%);
`;

const HistoryGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const HistoryItem = styled.div`
  display: grid;
  gap: 6px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.5);
`;

const MetaText = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

export default CashCountAudit;
