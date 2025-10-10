import React, { useRef } from 'react';

import {
    Card,
    SectionTitle,
    FormGroup,
    Label,
    Input,
    HelperText,
    ButtonGroup,
    PrimaryButton,
    Alert
} from '../code/styledComponents';

const InitialForm = ({ onFileSelect, isLoading, error, userBusinessID }) => {
    const fileInputRef = useRef(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
            <SectionTitle>Import Products</SectionTitle>

            <FormGroup>
                <Label htmlFor="fileUpload">Select TSV/Excel file:</Label>
                <Input
                    id="fileUpload"
                    ref={fileInputRef}
                    type="file"
                    accept=".tsv,.txt,.csv,.xlsx,.xls"
                    onChange={onFileSelect}
                />
                <HelperText>
                    The file should have columns like "Nombre del producto", "Stock", "Impuesto", etc.
                </HelperText>
            </FormGroup>

            {isLoading && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <p>Processing file...</p>
                </div>
            )}

            {error && (
                <Alert type="error">
                    {error}
                </Alert>
            )}

            <ButtonGroup>
                <PrimaryButton
                    disabled={isLoading || !userBusinessID}
                    onClick={handleButtonClick}
                >
                    Select File and Continue
                </PrimaryButton>
            </ButtonGroup>
        </Card>
    );
};

export default InitialForm;