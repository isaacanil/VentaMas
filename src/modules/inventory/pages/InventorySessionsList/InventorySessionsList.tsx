import { Button, Select, Space, Skeleton } from 'antd';
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { DateTime } from 'luxon';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { DatePicker as RangeDatePicker } from '@/components/common/DatePicker/DatePicker';
import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { formatDate, formatLocaleDate, toMillis } from '@/utils/date/dateUtils';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { AdvancedTableProps } from '@/components/ui/AdvancedTable/AdvancedTable';
import type {
  InventoryEditorInfo,
  InventorySession,
  InventoryUser,
  TimestampLike,
} from '@/utils/inventory/types';

type EmbeddedUser = {
  realName?: string;
  name?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
};

type InventorySessionDoc = InventorySession & {
  id: string;
  status?: string;
  createdAt?: TimestampLike;
  createdBy?: string | null;
  createdByName?: string | null;
  user?: EmbeddedUser | null;
};

type SessionRow = InventorySessionDoc & {
  key: string;
  editorsList: InventoryEditorInfo[];
  createdByDisplay: string;
  createdByLoading: boolean;
  editorsLoading: boolean;
} & Record<string, unknown>;

type NameCache = Record<string, string>;
type FlagMap = Record<string, boolean>;
type SessionEditorsMap = Record<string, InventoryEditorInfo[]>;

type DateRangeValue = [DateTime | null, DateTime | null] | null;

type InventoryUserProfile = InventoryUser & {
  uid?: string;
  id?: string;
  realName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  userId?: string;
  user_id?: string;
};

export default function InventorySessionsList() {
  const user = useSelector(selectUser) as InventoryUserProfile | null;
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InventorySessionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  // const [activeEditors, setActiveEditors] = useState({}) // removido: conteo de usuarios activos en tiempo real
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [userNameCache, setUserNameCache] = useState<NameCache>({});
  const userNameCacheRef = useRef<NameCache>(userNameCache);
  const [sessionEditors, setSessionEditors] = useState<SessionEditorsMap>({}); // { sessionId: Array<{uid,name}> }
  const [resolvingUIDs, setResolvingUIDs] = useState<FlagMap>({}); // { [uid]: true }
  const [loadingEditorsBySession, setLoadingEditorsBySession] = useState<FlagMap>({}); // { [sessionId]: true }

  const formatUserDisplay = useCallback((raw: string | number | null | undefined) => {
    if (!raw) return '';
    const val = String(raw).trim();
    if (val.includes('@') || /\s/.test(val)) return val;
    if (val.length > 18) {
      return `${val.slice(0, 6)}…${val.slice(-4)}`;
    }
    return val;
  }, []);

  const buildDocRef = useCallback((parts: string[]) => {
    const [first, ...rest] = parts;
    if (!first) {
      throw new Error('Invalid document path');
    }
    return doc(db, first, ...rest);
  }, []);

  const fetchUserDisplayName = useCallback(
    async (uid: string, businessID: string) => {
      const tryPaths = [
        ['businesses', businessID, 'users', uid],
        ['businesses', businessID, 'staff', uid],
        ['users', uid],
        ['profiles', uid],
      ];
      for (const parts of tryPaths) {
        try {
          const ref = buildDocRef(parts);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() || {};
            const nested = data.user || {};
            const realName = (nested.realName || data.realName || '').trim();
            const resolved =
              realName ||
              nested.name ||
              nested.displayName ||
              data.displayName ||
              data.name ||
              uid;
            return formatUserDisplay(resolved);
          }
        } catch {
          /* ignore lookup errors */
        }
      }
      return formatUserDisplay(uid);
    },
    [buildDocRef, formatUserDisplay],
  );

  const pickEmbeddedUserName = useCallback(
    (u: EmbeddedUser | null | undefined, fallbackUid?: string | null) => {
    if (!u) return '';
    const candidates = [u.realName, u.name, u.displayName, u.fullName, u.email];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return fallbackUid || '';
  }, []);

  const resolveMissingCreatorNames = useCallback(
    async (list: InventorySessionDoc[]) => {
      if (!user?.businessID) return;
      const updates = [];
      for (const s of list) {
        const uid = s.createdBy;
        if (!uid) continue;
        const embeddedName = pickEmbeddedUserName(s.user, uid);
        if (embeddedName && embeddedName !== s.createdByName) {
          try {
            const sessionRef = doc(
              db,
              'businesses',
              user.businessID,
              'inventorySessions',
              s.id,
            );
            await updateDoc(sessionRef, { createdByName: embeddedName });
          } catch {
            /* ignore */
          }
          updates.push({ ...s, createdByName: embeddedName });
          continue;
        }
        let display = userNameCacheRef.current[uid];
        if (!display) {
          setResolvingUIDs((prev) => ({ ...prev, [uid]: true }));
          try {
            display = await fetchUserDisplayName(uid, user.businessID as string);
          } finally {
            setResolvingUIDs((prev) => {
              const { [uid]: _, ...rest } = prev;
              return rest;
            });
          }
          setUserNameCache((prev) => ({ ...prev, [uid]: display }));
        }
        if (display && s.createdByName !== display) {
          try {
            const sessionRef = doc(
              db,
              'businesses',
              user.businessID,
              'inventorySessions',
              s.id,
            );
            await updateDoc(sessionRef, { createdByName: display });
          } catch {
            /* ignore */
          }
          updates.push({ ...s, createdByName: display });
        }
      }
      if (updates.length) {
        setSessions((prev) =>
          prev.map((p) => {
            const u = updates.find((x) => x.id === p.id);
            return u || p;
          }),
        );
      }
    },
    [fetchUserDisplayName, pickEmbeddedUserName, user?.businessID],
  );

  useEffect(() => {
    userNameCacheRef.current = userNameCache;
  }, [userNameCache]);
  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all | open | closed
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRangeValue>([
    DateTime.local().startOf('month'),
    DateTime.local().endOf('month'),
  ]); // rango por defecto: mes actual
  // Cargar sesiones (sin listeners por subcolección de editingUsers)
  useEffect(() => {
    if (!user?.businessID) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collection(
      db,
      'businesses',
      user.businessID,
      'inventorySessions',
    );
    const qSessions = query(ref, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      qSessions,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<InventorySessionDoc, 'id'>),
        }));
        setSessions(list);
        const open = list.find((s) => s.status === 'open');
        setOpenSessionId(open ? open.id : null);
        setLoading(false);
        resolveMissingCreatorNames(list);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [user?.businessID, resolveMissingCreatorNames]);

  // Cargar editores (usuarios que actualizaron algún conteo) por sesión (lazy, sólo una vez por sesión)
  useEffect(() => {
    if (!user?.businessID || !sessions?.length) return;
    const pending = sessions.filter((s) => !sessionEditors[s.id]);
    if (!pending.length) return;

    pending.forEach(async (s) => {
      try {
        setLoadingEditorsBySession((prev) => ({ ...prev, [s.id]: true }));
        const countsRef = collection(
          db,
          'businesses',
          user.businessID,
          'inventorySessions',
          s.id,
          'counts',
        );
        const snap = await getDocs(countsRef);
        const editorsMap = new Map<string, InventoryEditorInfo>();
        snap.forEach((d) => {
          const data = d.data() as {
            updatedBy?: string;
            updatedByName?: string;
          };
          const uid = data.updatedBy;
          if (!uid) return;
          if (!editorsMap.has(uid)) {
            const rawName = data.updatedByName || userNameCache[uid] || uid;
            const name = formatUserDisplay(rawName);
            editorsMap.set(uid, { uid, name });
            // Cache nombre si aún no
            setUserNameCache((prev) =>
              prev[uid] ? prev : { ...prev, [uid]: name },
            );
          }
        });
        setSessionEditors((prev) => ({
          ...prev,
          [s.id]: Array.from(editorsMap.values()),
        }));
      } catch {
        /* ignore */
      } finally {
        setLoadingEditorsBySession((prev) => {
          const { [s.id]: _, ...rest } = prev;
          return rest;
        });
      }
    });
  }, [sessions, user?.businessID, sessionEditors, userNameCache, formatUserDisplay]);



  const _fetchUserDisplayNameLegacy = async (
    uid: string,
    businessID: string,
  ) => {
    // Única ruta confirmada: users/{uid}. Se dejan otras rutas como fallback por si existen en algunos tenants.
    const tryPaths = [
      ['businesses', businessID, 'users', uid],
      ['businesses', businessID, 'staff', uid],
      ['users', uid],
      ['profiles', uid],
    ];
    for (const parts of tryPaths) {
      try {
          const ref = buildDocRef(parts);
          const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() || {};
          // Algunos documentos guardan el perfil dentro de 'user'. Priorizar realName sobre otros campos.
          const nested = data.user || {};
          const realName = (nested.realName || data.realName || '').trim();
          const resolved =
            realName ||
            nested.name ||
            nested.displayName ||
            data.displayName ||
            data.name ||
            uid;
          return _formatUserDisplayLegacy(resolved);
        }
      } catch {
        /* ignore lookup errors */
      }
    }
    return _formatUserDisplayLegacy(uid);
  };

  const _formatUserDisplayLegacy = (
    raw: string | number | null | undefined,
  ) => {
    if (!raw) return '';
    const val = String(raw).trim();
    // If it already looks like a proper name (contains space) or an email, keep it.
    if (val.includes('@') || /\s/.test(val)) return val;
    // Heuristic: Firestore auth UIDs are usually long (>18) and opaque.
    if (val.length > 18) {
      return `${val.slice(0, 6)}…${val.slice(-4)}`;
    }
    return val;
  };

  const handleCreate = async () => {
    if (!user?.businessID) return;
    // If already an open session, just navigate
    if (openSessionId) {
      navigate(`/inventory/control/${openSessionId}`);
      return;
    }
    const ref = collection(
      db,
      'businesses',
      user.businessID,
      'inventorySessions',
    );
    // Double-check (race safety)
    const q = query(ref, where('status', '==', 'open'));
    const openSnap = await getDocs(q);
    if (!openSnap.empty) {
      const existing = openSnap.docs[0];
      setOpenSessionId(existing.id);
      navigate(`/inventory/control/${existing.id}`);
      return;
    }
    // Crear objeto user solo con valores definidos para evitar errores de Firestore
    const userData: EmbeddedUser & { uid?: string | null } = {
      uid: user.uid ?? null,
    };
    if (user.realName) userData.realName = user.realName;
    if (user.name) userData.name = user.name;
    if (user.displayName) userData.displayName = user.displayName;
    if (user.email) userData.email = user.email;

    const docRef = await addDoc(ref, {
      name: `Inventario ${formatLocaleDate(Date.now())}`,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      // Priorizar realName si existe; luego displayName, name, email y finalmente UID
      createdByName:
        (user?.realName && user.realName.trim()) ||
        user.displayName ||
        user.name ||
        user.uid,
      // Embebido: guardar objeto user con los datos del usuario para uso futuro
      user: userData,
      status: 'open',
    });
    navigate(`/inventory/control/${docRef.id}`);
  };

  const handleRowClick = (row: SessionRow) => {
    const sessionId = typeof row.id === 'string' ? row.id : null;
    if (sessionId) {
      navigate(`/inventory/control/${sessionId}`);
    }
  };

  const columns: AdvancedTableProps<SessionRow>['columns'] = [
    {
      Header: 'Nombre',
      accessor: 'name',
      minWidth: '200px',
      maxWidth: '2fr',
    },
    {
      Header: 'Usuarios',
      accessor: 'editorsList',
      minWidth: '220px',
      maxWidth: '2fr',
      // Nota: dependemos de campos agregados en tableData
      cell: ({ value, row }) => (
        <EditorsList
          editors={
            Array.isArray(value) ? (value as InventoryEditorInfo[]) : []
          }
          loading={Boolean(row?.editorsLoading)}
        />
      ),
    },
    {
      Header: 'Estado',
      accessor: 'status',
      minWidth: '120px',
      maxWidth: '1fr',
      cell: ({ value }) => {
        const status = typeof value === 'string' ? value : '';
        return (
          <StatusBadge status={status}>
            {status === 'open'
              ? 'Abierto'
              : status === 'closed'
                ? 'Cerrado'
                : status || 'Abierto'}
          </StatusBadge>
        );
      },
    },
    {
      Header: 'Fecha de Creación',
      accessor: 'createdAt',
      minWidth: '150px',
      maxWidth: '1fr',
      cell: ({ value }) =>
        value ? formatDate(value) : 'N/A',
    },
    {
      Header: 'Creado por',
      accessor: 'createdByDisplay',
      minWidth: '160px',
      maxWidth: '1fr',
      cell: ({ value, row }) =>
        row?.createdByLoading ? (
          <Skeleton.Input active size="small" style={{ width: 140 }} />
        ) : (
          <span>{typeof value === 'string' && value ? value : '\u2014'}</span>
        ),
    },
  ];

  const creatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      if (!s.createdBy) return;
      if (!map.has(s.createdBy)) {
        const display = formatUserDisplay(
          s.createdByName || userNameCache[s.createdBy] || s.createdBy,
        );
        map.set(s.createdBy, display);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [sessions, userNameCache, formatUserDisplay]);

  const filteredSessions = useMemo<InventorySessionDoc[]>(() => {
    return sessions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (creatorFilter !== 'all' && s.createdBy !== creatorFilter)
        return false;
      if (
        dateRange &&
        Array.isArray(dateRange) &&
        dateRange[0] &&
        dateRange[1]
      ) {
        const ts = toMillis(s.createdAt);
        if (!ts) return false;
        const start = dateRange[0].startOf('day').toMillis();
        const end = dateRange[1].endOf('day').toMillis();
        if (ts < start || ts > end) return false;
      }
      return true;
    });
  }, [sessions, statusFilter, creatorFilter, dateRange]);

  const clearFilters = () => {
    setStatusFilter('all');
    setCreatorFilter('all');
    setDateRange(null);
  };

  const tableData: SessionRow[] = filteredSessions.map((session) => {
    // Nombre preferido: user embebido (realName > name) > createdByName persistido > cache > uid
    const embedded = pickEmbeddedUserName(session.user, session.createdBy);
    const createdByDisplay = formatUserDisplay(
      embedded ||
      session.createdByName ||
      userNameCache[session.createdBy] ||
      session.createdBy ||
      '',
    );
    const createdByLoading = session.createdBy
      ? !!resolvingUIDs[session.createdBy]
      : false;
    const editorsLoading = !!loadingEditorsBySession[session.id];
    return {
      ...session,
      key: session.id,
      editorsList: sessionEditors[session.id] || [],
      createdByDisplay,
      createdByLoading,
      editorsLoading,
    };
  });

  return (
    <Container>
      <MenuApp sectionName={'Inventarios'} />
      <Component>
        <Header>
          <FiltersBar>
            <RangePickerWrapper>
              <RangeDatePicker
                mode="range"
                value={dateRange}
                onChange={setDateRange}
                placeholder="Rango de fechas"
                allowClear
              />
            </RangePickerWrapper>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'open', label: 'Abiertos' },
                { value: 'closed', label: 'Cerrados' },
              ]}
              placeholder="Estado"
            />
            <Select
              value={creatorFilter}
              onChange={setCreatorFilter}
              style={{ minWidth: 180 }}
              options={[
                { value: 'all', label: 'Todos los usuarios' },
                ...creatorOptions,
              ]}
              placeholder="Creado por"
              showSearch
              optionFilterProp="label"
            />
            <Button
              onClick={clearFilters}
              disabled={
                statusFilter === 'all' && creatorFilter === 'all' && !dateRange
              }
            >
              Limpiar
            </Button>
          </FiltersBar>
          <Space>
            <Button
              type={openSessionId ? 'default' : 'primary'}
              onClick={handleCreate}
              title={
                openSessionId
                  ? 'Ya existe un inventario abierto. Haz clic para ir a él.'
                  : 'Crear un nuevo inventario'
              }
            >
              {openSessionId ? 'Ver inventario abierto' : 'Crear inventario'}
            </Button>
          </Space>
        </Header>

        <TableContainer>
          <AdvancedTable<SessionRow>
            columns={columns}
            data={tableData}
            loading={loading}
            numberOfElementsPerPage={10}
            emptyText="No hay inventarios aún"
            onRowClick={handleRowClick}
            elementName="inventario"
          />
        </TableContainer>
      </Component>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 1rem;
  height: 100%;
`;
const Component = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 1em;
  width: 98vw;
  height: 100%;
  padding: 0 1em 1em;
  margin: 0 auto;
  overflow: hidden;
  background-color: #fff;
`;
const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
`;
const FiltersBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`;
const RangePickerWrapper = styled.div`
  min-width: 260px;
  max-width: 340px;
`;
const TableContainer = styled.div`
  height: 100%;
  min-height: 0;
`;
const StatusBadge = styled.span<{ status?: string }>`
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ status }) =>
    status === 'open'
      ? '#2e7d32'
      : status === 'processing'
        ? '#d97706'
        : status === 'closed'
          ? '#666'
          : '#2e7d32'};
  background-color: ${({ status }) =>
    status === 'open'
      ? '#e7f5e7'
      : status === 'processing'
        ? '#fff7ed'
        : status === 'closed'
          ? '#f5f5f5'
          : '#e7f5e7'};
  border-radius: 4px;
`;

// Badge de usuarios activos eliminado

// Lista de editores (mÃƒÆ’Â¡x 3 visibles + overflow)
const EditorsInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
`;

const EditorPill = styled.span`
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.2;
  color: #111827;
  background: #f3f4f6;
  border-radius: 999px;
`;

const MorePill = styled(EditorPill)`
  background: #e5e7eb;
`;

const LoadingInline = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

type EditorsListProps = {
  editors?: InventoryEditorInfo[];
  loading?: boolean;
};

function EditorsList({ editors, loading }: EditorsListProps) {
  if (loading) return <LoadingInline>Cargando…</LoadingInline>;
  if (!editors || !editors.length)
    return <span style={{ color: '#6b7280' }}>—</span>;
  const shown = editors.slice(0, 3);
  const extra = editors.length - shown.length;
  return (
    <EditorsInline>
      {shown.map((e) => (
        <EditorPill key={e.uid}>{e.name}</EditorPill>
      ))}
      {extra > 0 && <MorePill>+{extra}</MorePill>}
    </EditorsInline>
  );
}

