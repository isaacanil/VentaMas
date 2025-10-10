import React from 'react';

import {
    SectionTitle,
    FormGroup,
    Label,
    Input,
    Select,
    Checkbox,
    ButtonGroup,
    PrimaryButton,
    SecondaryButton,
    Grid,
    Card
} from '../code/styledComponents';

const PriceUpdateConfig = ({ 
    updateConfig, 
    onConfigChange, 
    onApplyUpdates, 
    onRevertChanges,
    hasUpdatedProducts,
    isLoading
}) => {
    return (
        <Card>
            <SectionTitle>Price Update Settings</SectionTitle>

            <Grid columns="repeat(2, 1fr)" gap="1rem">
                <FormGroup>
                    <Label htmlFor="method">Update Method:</Label>
                    <Select
                        id="method"
                        name="method"
                        value={updateConfig.method}
                        onChange={onConfigChange}
                    >
                        <option value="percentage">Increase by percentage</option>
                        <option value="amount">Increase by fixed amount</option>
                        <option value="formula">Calculate from cost</option>
                    </Select>
                </FormGroup>

                <FormGroup>
                    <Label htmlFor="value">
                        {updateConfig.method === 'percentage' ? 'Percentage (%)' :
                            updateConfig.method === 'amount' ? 'Amount' : 'Margin (%)'}:
                    </Label>
                    <Input
                        id="value"
                        type="number"
                        name="value"
                        value={updateConfig.value}
                        onChange={onConfigChange}
                    />
                </FormGroup>

                <FormGroup>
                    <Label htmlFor="applyTo">Apply to:</Label>
                    <Select
                        id="applyTo"
                        name="applyTo"
                        value={updateConfig.applyTo}
                        onChange={onConfigChange}
                    >
                        <option value="all">All products</option>
                        <option value="withStock">Only products with stock</option>
                        <option value="withoutStock">Only products without stock</option>
                    </Select>
                </FormGroup>

                <FormGroup>
                    <Label htmlFor="targetField">Field to update:</Label>
                    <Select
                        id="targetField"
                        name="targetField"
                        value={updateConfig.targetField}
                        onChange={onConfigChange}
                    >
                        <option value="listPrice">List Price</option>
                        <option value="minPrice">Minimum Price</option>
                        <option value="cost">Cost</option>
                    </Select>
                </FormGroup>

                <Checkbox>
                    <input
                        type="checkbox"
                        id="roundPrices"
                        name="roundPrices"
                        checked={updateConfig.roundPrices}
                        onChange={onConfigChange}
                    />
                    <label htmlFor="roundPrices">Round prices</label>
                </Checkbox>

                {updateConfig.roundPrices && (
                    <FormGroup>
                        <Label htmlFor="roundTo">Round to:</Label>
                        <Select
                            id="roundTo"
                            name="roundTo"
                            value={updateConfig.roundTo}
                            onChange={onConfigChange}
                        >
                            <option value="0">Units</option>
                            <option value="1">Tens</option>
                            <option value="2">Hundreds</option>
                        </Select>
                    </FormGroup>
                )}

                <Checkbox>
                    <input
                        type="checkbox"
                        id="onlyProductsWithCost"
                        name="onlyProductsWithCost"
                        checked={updateConfig.onlyProductsWithCost}
                        onChange={onConfigChange}
                    />
                    <label htmlFor="onlyProductsWithCost">Only products with cost {`>`} 0</label>
                </Checkbox>

                <Checkbox>
                    <input
                        type="checkbox"
                        id="updateExisting"
                        name="updateExisting"
                        checked={updateConfig.updateExisting}
                        onChange={onConfigChange}
                    />
                    <label htmlFor="updateExisting">Update existing products</label>
                </Checkbox>
            </Grid>

            <ButtonGroup>
                <PrimaryButton
                    onClick={onApplyUpdates}
                    disabled={isLoading}
                >
                    {isLoading ? 'Applying...' : 'Apply Updates'}
                </PrimaryButton>

                {hasUpdatedProducts && (
                    <SecondaryButton
                        onClick={onRevertChanges}
                    >
                        Revert Changes
                    </SecondaryButton>
                )}
            </ButtonGroup>
        </Card>
    );
};

export default PriceUpdateConfig;