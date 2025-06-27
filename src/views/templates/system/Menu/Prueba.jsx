import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { useState } from 'react';
import { Button, Select, Table, Space, Typography, Card, Tag, Spin, Divider, Alert, Modal, Progress, notification } from 'antd';
import { collection, getDocs, orderBy, query, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseconfig';
import { nanoid } from 'nanoid';
import { EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

export const Prueba = () => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState('todas');
  const [correctionOverview, setCorrectionOverview] = useState(null);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [applyingCorrections, setApplyingCorrections] = useState(false);
  const [correctionProgress, setCorrectionProgress] = useState(0);
  const user = useSelector(selectUser);
  const cargarFacturas = async () => {
    if (!user?.businessID) {
      console.error('No se encontró businessID');
      return;
    }

    setLoading(true);
    try {
      const invoicesRef = collection(db, "businesses", user.businessID, "invoices");
      const q = query(invoicesRef, orderBy("data.date", "desc"));
      const querySnapshot = await getDocs(q);

      const facturas = [];
      const ncfMap = new Map(); // Para rastrear NCF duplicados
      const gruposDuplicados = new Map(); // Para almacenar grupos de duplicados

      querySnapshot.forEach((doc) => {
        const facturaData = doc.data();
        const ncf = facturaData.data?.NCF;
        const fecha = facturaData.data?.date;
        
        if (ncf && fecha) {
          const factura = {
            id: doc.id,
            docId: doc.id,
            ncf: ncf,
            fecha: fecha.seconds ? new Date(fecha.seconds * 1000) : new Date(fecha),
            fechaFormateada: fecha.seconds 
              ? new Date(fecha.seconds * 1000).toLocaleDateString('es-DO', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : new Date(fecha).toLocaleDateString('es-DO', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
            totalPurchase: facturaData.data?.totalPurchase?.value || 0,
            cliente: facturaData.data?.client?.name || 'N/A',
            isDuplicate: false,
            duplicateCode: null,
            originalData: facturaData // Guardamos los datos originales para el análisis
          };

          // Verificar si el NCF ya existe
          if (ncfMap.has(ncf)) {
            // Es un duplicado, asignar el mismo código de grupo
            const existingCode = ncfMap.get(ncf);
            factura.isDuplicate = true;
            factura.duplicateCode = existingCode;
            
            // Marcar la factura original también como duplicada
            const facturaOriginal = facturas.find(f => f.ncf === ncf);
            if (facturaOriginal && !facturaOriginal.isDuplicate) {
              facturaOriginal.isDuplicate = true;
              facturaOriginal.duplicateCode = existingCode;
            }

            // Añadir al grupo de duplicados
            if (gruposDuplicados.has(existingCode)) {
              gruposDuplicados.get(existingCode).push(factura);
            } else {
              gruposDuplicados.set(existingCode, [facturaOriginal, factura].filter(Boolean));
            }
          } else {
            // Primera vez que vemos este NCF
            const duplicateCode = nanoid(7);
            ncfMap.set(ncf, duplicateCode);
            factura.duplicateCode = duplicateCode;
          }

          facturas.push(factura);
        }
      });

      // Crear lista de grupos de duplicados para el select
      const gruposParaSelect = Array.from(gruposDuplicados.entries()).map(([codigo, facturas]) => ({
        codigo,
        cantidad: facturas.length,
        ncf: facturas[0]?.ncf
      }));

      setInvoices(facturas);
      setFilteredInvoices(facturas);
      setDuplicateGroups(gruposParaSelect);
      
      // Facturas cargadas y grupos procesados correctamente
      
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  };
   const generarOverviewCorreccion = () => {
    if (!invoices.length) return;

    // Función para extraer el número secuencial del NCF
    const extraerSecuencia = (ncf) => {
      if (!ncf || ncf.length < 3) return 0;
      const secuencia = ncf.substring(3); // Quita serie y tipo (ej: "B02")
      return parseInt(secuencia) || 0;
    };

    // Función para extraer serie y tipo del NCF
    const extraerSerieYTipo = (ncf) => {
      if (!ncf || ncf.length < 3) return { serie: 'B', tipo: '02' };
      return {
        serie: ncf.substring(0, 1),
        tipo: ncf.substring(1, 3)
      };
    };

    // Función para formatear NCF con secuencia de 8 dígitos
    const formatearNCF = (serie, tipo, secuencia) => {
      const secuenciaFormateada = secuencia.toString().padStart(8, '0');
      return `${serie}${tipo}${secuenciaFormateada}`;
    };

    // Función para crear clave única de serie+tipo
    const crearClaveSerieYTipo = (serie, tipo) => `${serie}${tipo}`;

    // 1. Ordenar TODAS las facturas por fecha (más antigua primero)
    const facturasOrdenadas = [...invoices].sort((a, b) => a.fecha - b.fecha);

    // 2. Agrupar facturas por serie y tipo
    const facturasPorSerieYTipo = new Map();
    
    facturasOrdenadas.forEach(factura => {
      const { serie, tipo } = extraerSerieYTipo(factura.ncf);
      const clave = crearClaveSerieYTipo(serie, tipo);
      
      if (!facturasPorSerieYTipo.has(clave)) {
        facturasPorSerieYTipo.set(clave, []);
      }
      facturasPorSerieYTipo.get(clave).push(factura);
    });

    // Procesando facturas por serie y tipo

    // 3. Procesar cada grupo de serie+tipo por separado
    const facturasCorregidas = [];
    const ncfUtilizados = new Set(); // Para detectar duplicados globales
    let totalProblemas = 0;
    let totalDuplicados = 0;
    let totalInconsistencias = 0;
    const resumenPorSerieYTipo = new Map();    
    facturasPorSerieYTipo.forEach((facturasDelGrupo, claveSerieYTipo) => {
      const [serie, tipo] = [claveSerieYTipo.substring(0, 1), claveSerieYTipo.substring(1, 3)];
      
      // Encontrar la primera factura de este grupo para establecer secuencia base
      const primeraFacturaDelGrupo = facturasDelGrupo[0];
      const secuenciaInicialDelGrupo = extraerSecuencia(primeraFacturaDelGrupo.ncf);
      let secuenciaEsperadaDelGrupo = secuenciaInicialDelGrupo;
      
      const resumenGrupo = {
        serie,
        tipo,
        clave: claveSerieYTipo,
        totalFacturas: facturasDelGrupo.length,
        secuenciaInicial: secuenciaInicialDelGrupo,
        facturasSinCambios: 0,
        facturasConCambios: 0,
        duplicados: 0,
        inconsistencias: 0
      };

      // Procesando grupo de facturas

      facturasDelGrupo.forEach((factura, indexEnGrupo) => {
        const secuenciaOriginal = extraerSecuencia(factura.ncf);
        const ncfOriginal = factura.ncf;
        
        let necesitaCorreccion = false;
        let tipoProblema = null;
        let razon = '';
        
        // Verificar si es la primera factura del grupo (establecer como base)
        if (indexEnGrupo === 0) {
          facturasCorregidas.push({
            ...factura,
            accion: 'MANTENER_COMO_BASE_DEL_GRUPO',
            ncfOriginal: ncfOriginal,
            ncfNuevo: ncfOriginal,
            secuenciaOriginal: secuenciaOriginal,
            secuenciaNueva: secuenciaOriginal,
            secuenciaEsperada: secuenciaEsperadaDelGrupo,
            posicionCronologica: facturasOrdenadas.indexOf(factura) + 1,
            serieYTipo: claveSerieYTipo,
            esBaseDelGrupo: true,
            necesitaCorreccion: false,
            tipoProblema: null,
            razon: `NCF base del grupo ${claveSerieYTipo} - primer elemento cronológico`
          });
          
          ncfUtilizados.add(ncfOriginal);
          secuenciaEsperadaDelGrupo++;
          resumenGrupo.facturasSinCambios++;
          return;
        }

        // Para el resto de facturas del grupo, verificar secuencia y duplicados
        const ncfEsperado = formatearNCF(serie, tipo, secuenciaEsperadaDelGrupo);
        
        // Verificar problemas
        if (ncfUtilizados.has(ncfOriginal)) {
          // Es un duplicado
          necesitaCorreccion = true;
          tipoProblema = 'DUPLICADO';
          totalDuplicados++;
          totalProblemas++;
          resumenGrupo.duplicados++;
          resumenGrupo.facturasConCambios++;
          razon = `NCF duplicado en grupo ${claveSerieYTipo} - ya utilizado anteriormente`;
        } else if (ncfOriginal !== ncfEsperado) {
          // No sigue la secuencia esperada del grupo
          necesitaCorreccion = true;
          tipoProblema = 'SECUENCIA_INCORRECTA';
          totalInconsistencias++;
          totalProblemas++;
          resumenGrupo.inconsistencias++;
          resumenGrupo.facturasConCambios++;
          
          if (secuenciaOriginal < secuenciaEsperadaDelGrupo) {
            razon = `Secuencia se "devuelve" en grupo ${claveSerieYTipo} - esperado #${secuenciaEsperadaDelGrupo}, encontrado #${secuenciaOriginal}`;
          } else {
            razon = `Secuencia salta en grupo ${claveSerieYTipo} - esperado #${secuenciaEsperadaDelGrupo}, encontrado #${secuenciaOriginal}`;
          }
        } else {
          // Secuencia correcta
          resumenGrupo.facturasSinCambios++;
        }

        // Asignar NCF final
        let ncfFinal, secuenciaFinal, accion;
        
        if (necesitaCorreccion) {
          // Usar la secuencia esperada del grupo
          ncfFinal = ncfEsperado;
          secuenciaFinal = secuenciaEsperadaDelGrupo;
          accion = tipoProblema === 'DUPLICADO' ? 'CORREGIR_DUPLICADO' : 'CORREGIR_SECUENCIA';
        } else {
          // Mantener el NCF original
          ncfFinal = ncfOriginal;
          secuenciaFinal = secuenciaOriginal;
          secuenciaEsperadaDelGrupo = secuenciaOriginal; // Ajustar la secuencia esperada del grupo
          accion = 'SIN_CAMBIOS';
          razon = `NCF correcto en grupo ${claveSerieYTipo} - sigue secuencia lógica`;
        }

        facturasCorregidas.push({
          ...factura,
          accion: accion,
          ncfOriginal: ncfOriginal,
          ncfNuevo: ncfFinal,
          secuenciaOriginal: secuenciaOriginal,
          secuenciaNueva: secuenciaFinal,
          secuenciaEsperada: secuenciaEsperadaDelGrupo,
          posicionCronologica: facturasOrdenadas.indexOf(factura) + 1,
          serieYTipo: claveSerieYTipo,
          necesitaCorreccion: necesitaCorreccion,
          tipoProblema: tipoProblema,
          razon: razon
        });

        // Actualizar sets y contadores del grupo
        ncfUtilizados.add(ncfFinal);
        secuenciaEsperadaDelGrupo = secuenciaFinal + 1;
      });

      resumenPorSerieYTipo.set(claveSerieYTipo, resumenGrupo);
    });

    // 4. Clasificar facturas por estado
    const facturasSinCambios = facturasCorregidas.filter(f => !f.necesitaCorreccion);
    const facturasConCambios = facturasCorregidas.filter(f => f.necesitaCorreccion);

    // 5. Preparar overview con la nueva lógica por serie y tipo
    const overview = {
      resumen: {
        totalFacturasAnalizadas: invoices.length,
        gruposSerieYTipo: Array.from(resumenPorSerieYTipo.values()),
        totalGrupos: facturasPorSerieYTipo.size,
        totalProblemas: totalProblemas,
        totalDuplicados: totalDuplicados,
        totalInconsistencias: totalInconsistencias,
        facturasSinCambios: facturasSinCambios.length,
        facturasConCambios: facturasConCambios.length,
        estrategia: 'CORRECCION_SECUENCIAL_POR_SERIE_Y_TIPO'
      },
      correcciones: [{
        descripcion: 'Corrección secuencial independiente por cada serie y tipo',
        facturas: facturasCorregidas
      }],
      impacto: {
        facturasSinCambios: facturasSinCambios.length,
        facturasConNuevoNCF: facturasConCambios.length,
        gruposAfectados: Array.from(resumenPorSerieYTipo.entries()).map(([clave, resumen]) => ({
          serieYTipo: clave,
          totalFacturas: resumen.totalFacturas,
          sinCambios: resumen.facturasSinCambios,
          conCambios: resumen.facturasConCambios,
          duplicados: resumen.duplicados,
          inconsistencias: resumen.inconsistencias
        })),
        metodologia: `Secuencia independiente por serie+tipo - ${facturasPorSerieYTipo.size} grupos procesados, Sin cambios: ${facturasSinCambios.length}, Corregidas: ${facturasConCambios.length}`,
        fechaSimulacion: new Date().toLocaleDateString('es-DO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    };

    setCorrectionOverview(overview);
    setShowOverviewModal(true);
  };

  // Función para aplicar correcciones directamente en Firestore
  const aplicarCorreccionesEnFirestore = async () => {
    if (!correctionOverview || !user?.businessID) {
      notification.error({
        message: 'Error',
        description: 'No hay correcciones para aplicar o no se encontró businessID'
      });
      return;
    }

    // Confirmar con el usuario
    Modal.confirm({
      title: '⚠️ ¿Aplicar Correcciones en Firestore?',
      content: (
        <div>
          <p><strong>Esta acción modificará permanentemente los NCF en la base de datos.</strong></p>
          <br />
          <p><strong>Resumen de cambios:</strong></p>
          <ul>
            <li>Facturas sin cambios: <strong>{correctionOverview.resumen.facturasSinCambios}</strong></li>
            <li>Facturas a corregir: <strong>{correctionOverview.resumen.facturasConCambios}</strong></li>
            <li>Total duplicados: <strong>{correctionOverview.resumen.totalDuplicados}</strong></li>
            <li>Total inconsistencias: <strong>{correctionOverview.resumen.totalInconsistencias}</strong></li>
          </ul>
          <br />
          <p><strong>⚠️ Esta acción no se puede deshacer.</strong></p>
        </div>
      ),
      okText: 'Sí, Aplicar Correcciones',
      cancelText: 'Cancelar',
      okType: 'danger',
      width: 500,
      onOk: () => ejecutarCorreccionesFirestore()
    });
  };

  // Función que ejecuta las correcciones en Firestore
  const ejecutarCorreccionesFirestore = async () => {
    setApplyingCorrections(true);
    setCorrectionProgress(0);

    try {
      const batch = writeBatch(db);
      const facturasACorregir = correctionOverview.correcciones[0].facturas.filter(
        factura => factura.necesitaCorreccion
      );

      let procesadas = 0;
      const total = facturasACorregir.length;

      notification.info({
        message: 'Iniciando Correcciones',
        description: `Aplicando correcciones a ${total} facturas...`,
        duration: 3
      });

      // Procesar en lotes para evitar límites de Firestore
      const loteSize = 10; // Firestore permite hasta 500 operaciones por batch, usamos 10 para ser conservadores
      
      for (let i = 0; i < facturasACorregir.length; i += loteSize) {
        const lote = facturasACorregir.slice(i, i + loteSize);
        const batchLote = writeBatch(db);

        for (const factura of lote) {
          const facturaRef = doc(db, "businesses", user.businessID, "invoices", factura.docId);
          
          // Solo actualizar el campo data.NCF
          batchLote.update(facturaRef, {
            'data.NCF': factura.ncfNuevo
          });

          procesadas++;
          setCorrectionProgress(Math.round((procesadas / total) * 100));
        }

        // Ejecutar el lote
        await batchLote.commit();
        
        console.log(`Lote ${Math.ceil((i + 1) / loteSize)} completado: ${lote.length} facturas actualizadas`);
      }

      notification.success({
        message: '✅ Correcciones Aplicadas Exitosamente',
        description: `Se han corregido ${total} facturas en Firestore. Los NCF han sido actualizados con la secuencia correcta.`,
        duration: 6
      });

      // Recargar datos para mostrar los cambios
      await cargarFacturas();
      
      // Cerrar modal y resetear estado
      setShowOverviewModal(false);
      setCorrectionOverview(null);

    } catch (error) {
      console.error('Error aplicando correcciones:', error);
      notification.error({
        message: 'Error al Aplicar Correcciones',
        description: `Ocurrió un error: ${error.message}. Algunas correcciones pueden no haberse aplicado.`,
        duration: 8
      });
    } finally {
      setApplyingCorrections(false);
      setCorrectionProgress(0);
    }
  };

  const handleFilterChange = (value) => {
    setSelectedDuplicateId(value);
    
    if (value === 'todas') {
      setFilteredInvoices(invoices);
    } else {
      const filtered = invoices.filter(invoice => invoice.duplicateCode === value);
      setFilteredInvoices(filtered);
    }
  };

  const columns = [
    {
      title: 'NCF',
      dataIndex: 'ncf',
      key: 'ncf',
      width: 150,
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.isDuplicate && (
            <Tag color="red" style={{ fontSize: '10px' }}>
              DUPLICADO
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaFormateada',
      key: 'fecha',
      width: 180,
    },
    {
      title: 'Cliente',
      dataIndex: 'cliente',
      key: 'cliente',
      width: 200,
    },
    {
      title: 'Total',
      dataIndex: 'totalPurchase',
      key: 'total',
      width: 120,
      render: (value) => `$${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Código de Grupo',
      dataIndex: 'duplicateCode',
      key: 'duplicateCode',
      width: 150,
      render: (text, record) => (
        record.isDuplicate ? (
          <Tag color="orange">{text}</Tag>
        ) : (
          <Tag color="green">{text}</Tag>
        )
      ),
    },
    {
      title: 'ID Documento',
      dataIndex: 'docId',
      key: 'docId',
      width: 120,
      render: (text) => <Text code>{text}</Text>,
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>Análisis de Facturas Duplicadas por NCF</Title>
            <Text type="secondary">
              Esta herramienta analiza todas las facturas y identifica aquellas con NCF duplicados.
              Cada grupo de duplicados recibe un código único de 7 caracteres.
            </Text>
          </div>          <Space size="middle">
            <Button 
              type="primary" 
              onClick={cargarFacturas}
              loading={loading}
              size="large"
            >
              {loading ? 'Cargando...' : 'Cargar Facturas'}
            </Button>

            {duplicateGroups.length > 0 && (
              <>                <Button 
                  type="default" 
                  icon={<EyeOutlined />}
                  onClick={generarOverviewCorreccion}
                  size="large"
                >
                  Ver Overview de Corrección Avanzada
                </Button>
                
                <Button 
                  type="default" 
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => setShowExplanationModal(true)}
                  size="large"
                >
                  ¿Qué detecta?
                </Button>
                
                <Select
                  style={{ width: 300 }}
                  value={selectedDuplicateId}
                  onChange={handleFilterChange}
                  placeholder="Filtrar por grupo de duplicados"
                  size="large"
                >
                  <Option value="todas">
                    Todas las facturas ({invoices.length})
                  </Option>
                  {duplicateGroups.map(grupo => (
                    <Option key={grupo.codigo} value={grupo.codigo}>
                      {grupo.ncf} - {grupo.cantidad} facturas (Código: {grupo.codigo})
                    </Option>
                  ))}
                </Select>
              </>
            )}
          </Space>

          {loading && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '20px' }}>
                <Text>Analizando facturas...</Text>
              </div>
            </div>
          )}
        </Space>
      </Card>


        {correctionOverview && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>            {/* Resumen General */}
            <Alert
              message="Simulación de Corrección por Serie y Tipo"
              description={`Análisis con corrección secuencial independiente por cada serie y tipo de NCF. Se encontraron ${correctionOverview.resumen.totalGrupos} grupos diferentes. Problemas detectados: ${correctionOverview.resumen.totalProblemas} (${correctionOverview.resumen.totalDuplicados} duplicados, ${correctionOverview.resumen.totalInconsistencias} inconsistencias). Generado el ${correctionOverview.impacto.fechaSimulacion}.`}
              type="info"
              showIcon
            />
            
            {/* Resumen por Grupos */}
            <Card title="� Resumen por Serie y Tipo" size="small">
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Grupos de Serie+Tipo encontrados:</Text>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {correctionOverview.resumen.gruposSerieYTipo.map((grupo) => (
                  <div key={grupo.clave} style={{ 
                    padding: '12px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Tag color="blue" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        {grupo.clave}
                      </Tag>
                      <Text strong> - {grupo.totalFacturas} facturas</Text>
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      <div><Text type="secondary">Serie: {grupo.serie} | Tipo: {grupo.tipo}</Text></div>
                      <div><Text type="secondary">Secuencia inicial: {grupo.secuenciaInicial}</Text></div>
                      <div style={{ marginTop: '4px' }}>
                        <Text style={{ color: '#52c41a' }}>✓ Sin cambios: {grupo.facturasSinCambios}</Text>
                      </div>
                      <div>
                        <Text style={{ color: '#faad14' }}>⚠ Con cambios: {grupo.facturasConCambios}</Text>
                      </div>
                      {grupo.duplicados > 0 && (
                        <div><Text style={{ color: '#ff4d4f' }}>🔄 Duplicados: {grupo.duplicados}</Text></div>
                      )}
                      {grupo.inconsistencias > 0 && (
                        <div><Text style={{ color: '#fa8c16' }}>📊 Inconsistencias: {grupo.inconsistencias}</Text></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="📊 Resumen del Impacto General" size="small">              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <Text type="secondary">Total de Facturas</Text>
                  <div><Text strong style={{ fontSize: '18px' }}>{correctionOverview.resumen.totalFacturasAnalizadas}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Grupos Serie+Tipo</Text>
                  <div><Text strong style={{ fontSize: '18px', color: '#1890ff' }}>{correctionOverview.resumen.totalGrupos}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Total Problemas</Text>
                  <div><Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>{correctionOverview.resumen.totalProblemas}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Duplicados Detectados</Text>
                  <div><Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>{correctionOverview.resumen.totalDuplicados}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Inconsistencias Secuencia</Text>
                  <div><Text strong style={{ fontSize: '18px', color: '#fa8c16' }}>{correctionOverview.resumen.totalInconsistencias}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Facturas Sin Cambios</Text>
                  <div><Text strong style={{ fontSize: '18px', color: '#52c41a' }}>{correctionOverview.resumen.facturasSinCambios}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Facturas Corregidas</Text>
                  <div><Text strong style={{ fontSize: '18px', color: '#faad14' }}>{correctionOverview.resumen.facturasConCambios}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Estrategia Aplicada</Text>
                  <div><Text code style={{ fontSize: '10px', color: '#722ed1' }}>{correctionOverview.resumen.estrategia}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Estrategia</Text>
                  <div>
                    <Tag color="blue" style={{ fontSize: '10px' }}>
                      SECUENCIAL ESTRICTA
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>            <Divider />
            
            {/* Detalles de Correcciones */}
            <div>
              <Title level={4}>📋 Vista Completa de Todas las Facturas</Title>
              <Alert
                message={`Estrategia: ${correctionOverview.resumen.estrategia}`}
                description={
                  <div>
                    <p><strong>Metodología:</strong> {correctionOverview.impacto.metodologia}</p>
                    <p><strong>Grupos procesados:</strong> {correctionOverview.resumen.totalGrupos} combinaciones de serie+tipo diferentes</p>
                    <p><strong>Lógica:</strong> Cada grupo de serie+tipo mantiene su propia secuencia independiente - no se comparan entre grupos diferentes</p>
                    <div style={{ marginTop: '8px' }}>
                      <strong>Grupos encontrados:</strong>
                      {correctionOverview.resumen.gruposSerieYTipo.map((grupo, idx) => (
                        <Tag key={idx} color="blue" style={{ marginLeft: '4px' }}>
                          {grupo.clave} ({grupo.totalFacturas})
                        </Tag>
                      ))}
                    </div>
                  </div>
                }
                type="info"
                style={{ marginBottom: '16px' }}
              />
                {correctionOverview.correcciones.map((correccion, index) => (
                <Card 
                  key={index}
                  size="small" 
                  style={{ marginBottom: '16px' }}                  title={
                    <Space>
                      <Text strong>Todas las Facturas Clasificadas por Estado</Text>
                      <Tag color="green">{correccion.facturas.filter(f => !f.necesitaCorreccion).length} sin cambios</Tag>
                      <Tag color="orange">{correccion.facturas.filter(f => f.necesitaCorreccion).length} corregidas</Tag>
                      <Tag color="red">{correccion.facturas.filter(f => f.tipoProblema === 'DUPLICADO').length} duplicados</Tag>
                      <Tag color="purple">{correccion.facturas.filter(f => f.tipoProblema === 'SECUENCIA_INCORRECTA').length} secuencia</Tag>
                      <Tag color="gray">{correccion.facturas.length} total</Tag>
                    </Space>
                  }
                >
                  <Table
                    size="small"
                    dataSource={correccion.facturas}
                    rowKey="docId"
                    pagination={{
                      pageSize: 20,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} de ${total} facturas`,
                    }}
                    columns={[                      {
                        title: 'Estado',
                        dataIndex: 'accion',
                        key: 'estado',
                        width: 140,                        render: (accion, record) => {
                          if (record.esBaseDelGrupo) {
                            return <Tag color="blue">BASE GRUPO</Tag>;
                          } else if (!record.necesitaCorreccion) {
                            return <Tag color="green">SIN CAMBIOS</Tag>;
                          } else if (record.tipoProblema === 'DUPLICADO') {
                            return <Tag color="red">DUPLICADO</Tag>;
                          } else if (record.tipoProblema === 'SECUENCIA_INCORRECTA') {
                            return <Tag color="orange">SECUENCIA INCORRECTA</Tag>;
                          }
                          return <Tag color="gray">DESCONOCIDO</Tag>;
                        },
                      },                      {
                        title: 'Orden Cronológico',
                        key: 'posicion',
                        width: 80,
                        render: (_, record) => (
                          <Tag color="blue" style={{ fontSize: '10px' }}>
                            #{record.posicionCronologica || 'N/A'}
                          </Tag>
                        ),
                      },                      {
                        title: 'Secuencia Esperada',
                        dataIndex: 'secuenciaEsperada',
                        key: 'secuenciaEsperada',
                        width: 100,                        render: (secuenciaEsperada, record) => {
                          if (record.esBaseDelGrupo) {
                            return (
                              <Tag color="blue" style={{ fontSize: '10px' }}>
                                BASE #{secuenciaEsperada}
                              </Tag>
                            );
                          }
                          return (
                            <Tag color="purple" style={{ fontSize: '10px' }}>
                              #{secuenciaEsperada}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: 'Fecha',
                        dataIndex: 'fechaFormateada',
                        key: 'fecha',
                        width: 120,
                      },
                      {
                        title: 'Total',
                        dataIndex: 'totalPurchase',
                        key: 'total',
                        width: 80,
                        render: (value) => `$${value?.toFixed(2) || '0.00'}`,
                      },                      {
                        title: 'NCF Original',
                        dataIndex: 'ncfOriginal',
                        key: 'ncfOriginal',
                        width: 150,                        render: (text, record) => {
                          let color = '#52c41a'; // verde para facturas sin cambios
                          if (record.necesitaCorreccion) {
                            color = '#ff4d4f'; // rojo para facturas que necesitan corrección
                          }
                          return (
                            <Text code style={{ fontSize: '11px', color }}>
                              {text}
                            </Text>
                          );
                        },
                      },
                      {
                        title: 'NCF Final',
                        dataIndex: 'ncfNuevo',
                        key: 'ncfNuevo',
                        width: 150,
                        render: (text, record) => {
                          const isChanged = record.ncfOriginal !== record.ncfNuevo;
                          return (
                            <Space direction="vertical" size={0}>
                              <Text 
                                code 
                                style={{ 
                                  color: isChanged ? '#52c41a' : '#1890ff',
                                  fontSize: '11px',
                                  fontWeight: isChanged ? 'bold' : 'normal'
                                }}
                              >
                                {text}
                              </Text>
                              {isChanged && (
                                <Text type="secondary" style={{ fontSize: '10px' }}>
                                  Nueva secuencia: #{record.secuenciaNueva}
                                </Text>
                              )}
                              {!isChanged && (
                                <Text type="secondary" style={{ fontSize: '10px' }}>
                                  Sin cambios
                                </Text>
                              )}
                            </Space>
                          );                        },                      },
                      {
                        title: 'Serie+Tipo',
                        dataIndex: 'serieYTipo',
                        key: 'serieYTipo',
                        width: 80,
                        render: (serieYTipo) => (
                          <Tag color="cyan" style={{ fontSize: '10px' }}>
                            {serieYTipo}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Razón',
                        dataIndex: 'razon',
                        key: 'razon',
                        width: 250,
                        render: (text, record) => (
                          <Text style={{ fontSize: '11px' }}>
                            {text}
                          </Text>
                        ),
                      },
                    
                    ]}
                  />                </Card>
              ))}

              {/* Botones de Acción */}
              <Divider />
              <Card title="🚀 Aplicar Correcciones" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {applyingCorrections && (
                    <div>
                      <Text strong>Aplicando correcciones en Firestore...</Text>
                      <Progress 
                        percent={correctionProgress} 
                        status="active"
                        format={(percent) => `${percent}% completado`}
                      />
                    </div>
                  )}
                  
                  <Alert
                    message="⚠️ Acción Permanente"
                    description={
                      <div>
                        <p>Esta operación modificará permanentemente los NCF en Firestore.</p>
                        <p><strong>Facturas a corregir:</strong> {correctionOverview.resumen.facturasConCambios}</p>
                        <p><strong>Facturas sin cambios:</strong> {correctionOverview.resumen.facturasSinCambios}</p>
                      </div>
                    }
                    type="warning"
                    showIcon
                  />
                  
                  <Space>
                    <Button 
                      type="primary" 
                      danger
                      size="large"
                      loading={applyingCorrections}
                      disabled={correctionOverview.resumen.facturasConCambios === 0}
                      onClick={aplicarCorreccionesEnFirestore}
                      icon={<ExclamationCircleOutlined />}
                    >
                      {applyingCorrections ? 'Aplicando...' : 'Aplicar Correcciones en Firestore'}
                    </Button>
                    
                    <Button 
                      size="large"
                      onClick={() => setCorrectionOverview(null)}
                      disabled={applyingCorrections}
                    >
                      Cancelar
                    </Button>
                  </Space>
                </Space>
              </Card>
            </div>
          </Space>
        )}
    
        {/* Modal explicativo sobre las mejoras */}
        <Modal
          title="🔧 Corrección Avanzada de NCF - ¿Qué detecta y corrige?"
          open={showExplanationModal}
          onCancel={() => setShowExplanationModal(false)}
          footer={[
            <Button key="ok" type="primary" onClick={() => setShowExplanationModal(false)}>
              Entendido
            </Button>
          ]}
          width={700}
        >
          <div style={{ lineHeight: 1.6 }}>
            <Alert
              message="Sistema Mejorado de Detección"
              description="Ahora detecta y corrige TODOS los problemas de NCF, no solo duplicados."
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Title level={5}>🔍 Problemas que detecta:</Title>
            
            <div style={{ marginBottom: '16px' }}>
              <Tag color="red">DUPLICADOS</Tag>
              <Text> - NCF exactamente iguales (ej: dos facturas con B0200000050)</Text>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Tag color="orange">INCONSISTENCIAS CRONOLÓGICAS</Tag>
              <Text> - NCF con secuencia menor que NCF anteriores</Text>
            </div>
            
            <Title level={5}>📝 Ejemplo del problema que resuelve:</Title>
            <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
              <Text code>25 Feb 2025 - 1:17 PM → B0200000096</Text><br/>
              <Text code style={{ color: '#ff4d4f' }}>25 Feb 2025 - 2:29 PM → B0100000001 ❌</Text><br/>
              <Text type="secondary">Problema: La secuencia 1 es menor que 96, rompe orden cronológico</Text>
            </div>
            
            <Title level={5}>🛠️ Cómo lo corrige:</Title>
            <div style={{ backgroundColor: '#f6ffed', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
              <Text>1. Identifica el primer problema cronológicamente</Text><br/>
              <Text>2. Toma como referencia el NCF anterior más alto</Text><br/>
              <Text>3. Reasigna secuencialmente desde esa base:</Text><br/>
              <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                <Text code style={{ color: '#52c41a' }}>B0200000096 → Sin cambios</Text><br/>
                <Text code style={{ color: '#1890ff' }}>B0100000001 → B0200000097 ✅</Text><br/>
                <Text code style={{ color: '#1890ff' }}>Siguiente factura → B0200000098 ✅</Text>
              </div>
            </div>
            
            <Alert
              message="Resultado"
              description="Secuencia cronológicamente correcta sin duplicados ni inconsistencias."
              type="info"
              showIcon
            />
          </div>
        </Modal>
    </div>
  );
};