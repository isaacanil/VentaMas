import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../features/auth/userSlice';

import { updatePrices, exportProductsToExcel } from './code/excelUtils';
import { Container, PageTitle } from './code/styledComponents';
import { FLOW_STATES, DEFAULT_UPDATE_CONFIG } from './code/updateProductsConfig';
import InitialForm from './components/InitialForm';
import PriceUpdateConfig from './components/PriceUpdateConfig';
import ProductPreview from './components/ProductPreview';
import ProgressModal from './components/ProgressModal';
import ResultsView from './components/ResultsView';
import { updateProductsBatch } from './firebaseUpdate';

// Import custom hooks
import useFileProcessing from './hooks/useFileProcessing';

// Import components

// Import config

const UpdateProducts = () => {
    // User data
    const user = useSelector(selectUser);

    // Main state
    const [currentState, setCurrentState] = useState(FLOW_STATES.INITIAL);
    const [products, setProducts] = useState([]);
    const [updatedProducts, setUpdatedProducts] = useState([]);
    const [results, setResults] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [nameFilter, setNameFilter] = useState('');
    
    // Progress modal state
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('Uploading products...');

    // Custom hook for file processing
    const { processFile, isLoading, error, setError } = useFileProcessing();

    // Price update configuration
    const [updateConfig, setUpdateConfig] = useState(DEFAULT_UPDATE_CONFIG);

    // Handle file selection
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUpdatedProducts([]);
        setResults(null);

        const importedProducts = await processFile(file);
        if (importedProducts) {
            setProducts(importedProducts);
            setCurrentState(FLOW_STATES.PREVIEW);
        }
    };

    // Handle configuration changes
    const handleConfigChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUpdateConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Apply price updates
    const handleApplyUpdates = () => {
        if (products.length === 0) return;

        setError(null);
        try {
            const newUpdatedProducts = updatePrices(products, updateConfig);
            setUpdatedProducts(newUpdatedProducts);
        } catch (err) {
            setError(`Error updating prices: ${err.message}`);
        }
    };

    // Revert changes
    const handleRevertChanges = () => {
        setUpdatedProducts([]);
    };

    // Export to Excel
    const handleExportToExcel = () => {
        try {
            const dataToExport = updatedProducts.length > 0 ? updatedProducts : products;
            exportProductsToExcel(dataToExport, 'updated_products');
        } catch (err) {
            setError(`Error exporting to Excel: ${err.message}`);
        }
    };

    // Reset the process
    const handleReset = () => {
        setCurrentState(FLOW_STATES.INITIAL);
        setProducts([]);
        setUpdatedProducts([]);
        setResults(null);
        setError(null);
        setNameFilter('');
    };

    // Upload to Firebase
    const handleUploadToFirebase = async () => {
        if (!user.businessID) {
            setError("Please enter a valid business ID");
            return;
        }

        setIsUploading(true);
        setError(null);
        setShowProgressModal(true);
        setUploadProgress(0);
        setProgressMessage('Preparing to upload products...');        try {
            const dataToUpload = updatedProducts.length > 0 ? updatedProducts : products;
            
            // Track progress
            const updateProgressCallback = (progress, message) => {
                setUploadProgress(progress);
                if (message) setProgressMessage(message);
            };
            
            const result = await updateProductsBatch(user, dataToUpload, updateProgressCallback);

            setResults(result);
            setCurrentState(FLOW_STATES.RESULTS);
            setIsUploading(false);
            setShowProgressModal(false);
        } catch (err) {
            setError(`Error uploading to Firebase: ${err.message}`);
            setIsUploading(false);
            setShowProgressModal(false);
        }
    };

    // Filter products by name
    const filteredProducts = useMemo(() => {
        const dataToShow = updatedProducts.length > 0 ? updatedProducts : products;

        if (!nameFilter) return dataToShow;

        const term = nameFilter.toLowerCase();
        return dataToShow.filter(product =>
            product.name.toLowerCase().includes(term) ||
            product.barcode.toLowerCase().includes(term)
        );
    }, [products, updatedProducts, nameFilter]);

    // Render content based on current state
    const renderContent = () => {
        switch (currentState) {
            case FLOW_STATES.INITIAL:
                return (
                    <InitialForm 
                        onFileSelect={handleFileUpload}
                        isLoading={isLoading}
                        error={error}
                        userBusinessID={user.businessID}
                    />
                );
            case FLOW_STATES.PREVIEW:
                return (
                    <>
                        <ProductPreview 
                            products={products}
                            originalProducts={products}
                            updatedProducts={updatedProducts}
                            nameFilter={nameFilter}
                            setNameFilter={setNameFilter}
                            error={error}
                            isUploading={isUploading}
                            userBusinessID={user.businessID}
                            onUploadToFirebase={handleUploadToFirebase}
                            onExportToExcel={handleExportToExcel}
                            onReset={handleReset}
                            filteredProducts={filteredProducts}
                        />
                        <PriceUpdateConfig 
                            updateConfig={updateConfig}
                            onConfigChange={handleConfigChange}
                            onApplyUpdates={handleApplyUpdates}
                            onRevertChanges={handleRevertChanges}
                            hasUpdatedProducts={updatedProducts.length > 0}
                            isLoading={isLoading}
                        />
                    </>
                );
            case FLOW_STATES.RESULTS:
                return (
                    <ResultsView 
                        results={results}
                        onReset={handleReset}
                        onExportToExcel={handleExportToExcel}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Container>
            <PageTitle>Product Importer</PageTitle>
            {renderContent()}
            <ProgressModal 
                isOpen={showProgressModal}
                progress={uploadProgress}
                message={progressMessage}
            />
        </Container>
    );
};

export default UpdateProducts;