import React, { useState } from 'react';
import { Alert, Space, Tabs, Typography, message } from 'antd';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../../../firebase/firebaseconfig';
import { importProductData, createProductTemplate } from '../../../../../../utils/import/product';
import type { CompareResult, MatchType, ProductData } from './types';
import { FileUploader } from './components/FileUploader';
import { ResultsSummary } from './components/ResultsSummary';
import { ResultsTable } from './components/ResultsTable';

const { Title } = Typography;
const { TabPane } = Tabs;

const Container = styled.div`
  padding: 20px;
`;

const ResultsContainer = styled.div`
  margin-top: 20px;
`;

export const CompareProducts: React.FC = () => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareResults, setCompareResults] = useState<CompareResult[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);
  
  const user = useSelector(selectUser);
  const businessID = user?.businessID;

  const handleCompare = async () => {
    if (fileList.length === 0) {
      setError('Por favor, seleccione un archivo Excel para comparar');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 1. Cargar datos del archivo Excel
      const excelData = await importProductData(fileList[0], 'es');
      
      if (!excelData || excelData.length === 0) {
        throw new Error('No se pudieron cargar datos del archivo Excel');
      }

      // 2. Cargar productos de la base de datos
      const productsRef = collection(db, 'businesses', businessID, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      const dbProducts: any[] = [];
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        product.id = doc.id;
        // Asegurarse de que los arrays de imágenes existen
        if (!product.images) {
          product.images = [];
        }
        dbProducts.push(product);
      });

      // Ordenar productos por nombre
      const sortedExcelData = [...excelData].sort((a, b) => 
        (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())
      );

      const sortedDbProducts = dbProducts.sort((a, b) =>
        (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())
      );

      // 3. Comparar productos preservando imágenes
      const results: CompareResult[] = [];
      
      // Crear mapas para búsqueda eficiente
      const dbProductsByBarcode = new Map(
        sortedDbProducts
          .filter(p => p.barcode)
          .map(p => [p.barcode.trim(), p])
      );

      const dbProductsByName = new Map(
        sortedDbProducts
          .filter(p => p.name)
          .map(p => [p.name.toLowerCase().trim(), p])
      );

      // Agrupar productos por nombre en Excel
      const excelGroups = sortedExcelData.reduce((acc, product) => {
        const key = product.name?.toLowerCase().trim();
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(product);
        return acc;
      }, {} as Record<string, ProductData[]>);

      // Agrupar productos por nombre en la base de datos
      const dbGroups = sortedDbProducts.reduce((acc, product) => {
        const key = product.name?.toLowerCase().trim();
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(product);
        return acc;
      }, {} as Record<string, ProductData[]>);

      // Comparar grupos por nombre
      const excelGroupEntries = Object.entries(excelGroups) as Array<[string, ProductData[]]>;
      excelGroupEntries.forEach(([name, excelProducts]) => {
        const dbProducts: ProductData[] = dbGroups[name] ?? [];

        if (excelProducts.length !== dbProducts.length) {
          // Conflicto: Diferente cantidad de productos con el mismo nombre
          excelProducts.forEach(product => {
            results.push({
              id: product.id || `excel-${results.length}`,
              name: product.name || 'Sin nombre',
              barcode: product.barcode || 'Sin código',
              excelOnly: false,
              dbOnly: false,
              conflict: true,
              conflictFields: ['count'],
              excelData: product,
              dbData: null
            });
          });
        } else {
          // Comparar productos uno a uno
          excelProducts.forEach((excelProduct, index) => {
            const dbProduct = dbProducts[index];
            const conflictFields: string[] = [];

            if (excelProduct.barcode && dbProduct.barcode && 
                excelProduct.barcode.trim() !== dbProduct.barcode.trim()) {
              conflictFields.push('barcode');
            }

            if (excelProduct.pricing?.price !== undefined && dbProduct.pricing?.price !== undefined) {
              const excelPriceValue = Number(excelProduct.pricing?.price);
              const dbPriceValue = Number(dbProduct.pricing?.price);

              if (!Number.isNaN(excelPriceValue) && !Number.isNaN(dbPriceValue) &&
                  excelPriceValue !== dbPriceValue) {
                conflictFields.push('price');
              }
            }

            if (excelProduct.stock !== undefined && dbProduct.stock !== undefined) {
              const excelStockValue = Number(excelProduct.stock);
              const dbStockValue = Number(dbProduct.stock);

              if (!Number.isNaN(excelStockValue) && !Number.isNaN(dbStockValue) &&
                  excelStockValue !== dbStockValue) {
                conflictFields.push('stock');
              }
            }

            if (excelProduct.category !== undefined && dbProduct.category !== undefined &&
                excelProduct.category.toLowerCase().trim() !== dbProduct.category.toLowerCase().trim()) {
              conflictFields.push('category');
            }

            results.push({
              id: dbProduct.id,
              name: dbProduct.name || excelProduct.name || 'Sin nombre',
              barcode: dbProduct.barcode || excelProduct.barcode || 'Sin código',
              excelOnly: false,
              dbOnly: false,
              conflict: conflictFields.length > 0,
              conflictFields: conflictFields.length > 0 ? conflictFields : undefined,
              excelData: excelProduct,
              dbData: dbProduct
            });
          });
        }

        // Marcar este grupo como procesado
        delete dbGroups[name];
      });

      // Agregar productos restantes en la base de datos que no están en Excel
      (Object.values(dbGroups) as ProductData[][]).forEach(dbProducts => {
        dbProducts.forEach(product => {
          results.push({
            id: product.id,
            name: product.name || 'Sin nombre',
            barcode: product.barcode || 'Sin código',
            excelOnly: false,
            dbOnly: true,
            conflict: false,
            dbData: product
          });
        });
      });

      setCompareResults(results);
    } catch (err) {
      console.error("Error al comparar productos:", err);
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo o consultar la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await createProductTemplate('es');
      message.success('Plantilla descargada correctamente');
    } catch (err) {
      console.error('Error al crear la plantilla:', err);
      message.error('Error al descargar la plantilla');
    }
  };

  // Filtrar resultados según la pestaña activa
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'excel':
        return compareResults.filter(result => result.excelOnly);
      case 'db':
        return compareResults.filter(result => result.dbOnly);
      case 'conflicts':
        return compareResults.filter(result => result.conflict);
      default:
        return compareResults;
    }
  };

  // Estadísticas de comparación
  const excelOnlyCount = compareResults.filter(r => r.excelOnly).length;
  const dbOnlyCount = compareResults.filter(r => r.dbOnly).length;
  const conflictCount = compareResults.filter(r => r.conflict).length;
  const matchCount = compareResults.filter(r => !r.excelOnly && !r.dbOnly && !r.conflict).length;

  return (
    <Container>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>Comparar Productos con Excel</Title>
        
        <Alert
          message="Compare sus productos con Excel"
          description="Esta herramienta le permite cargar un archivo Excel con productos y compararlo con los productos existentes en la base de datos para identificar diferencias."
          type="info"
          showIcon
        />
        
        <FileUploader 
          fileList={fileList}
          onFileChange={setFileList}
          onCompare={handleCompare}
          onDownloadTemplate={handleDownloadTemplate}
          loading={loading}
        />
        
        {error && (
          <Alert message={error} type="error" style={{ marginBottom: '16px' }} />
        )}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Comparando productos...
          </div>
        ) : compareResults.length > 0 ? (
          <ResultsContainer>
            <ResultsSummary 
              matchCount={matchCount}
              conflictCount={conflictCount}
              excelOnlyCount={excelOnlyCount}
              dbOnlyCount={dbOnlyCount}
            />
            
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              type="card"
            >
              <TabPane tab={`Todos (${compareResults.length})`} key="all" />
              <TabPane tab={`Conflictos (${conflictCount})`} key="conflicts" />
              <TabPane tab={`Solo en Excel (${excelOnlyCount})`} key="excel" />
              <TabPane tab={`Solo en BD (${dbOnlyCount})`} key="db" />
            </Tabs>
            
            <ResultsTable 
              data={getFilteredResults()}
              loading={loading}
            />
          </ResultsContainer>
        ) : null}
      </Space>
    </Container>
  );
};
