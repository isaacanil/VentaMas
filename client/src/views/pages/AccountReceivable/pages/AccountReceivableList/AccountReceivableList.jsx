import styled from "styled-components";
import { MenuApp } from "../../../../templates/MenuApp/MenuApp";
import { AccountReceivableTable } from "./components/AccountReceivableTable/AccountReceivableTable";
import { useEffect, useState } from "react";
import { FilterAccountReceivable } from "./components/FilterAccountReceivable/FilterAccountReceivable";
import { useListenAccountsReceivable } from "../../../../../firebase/accountsReceivable/accountReceivableServices";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../features/auth/userSlice";
import { DateTime } from "luxon";
import { getDateRange } from "../../../../../utils/date/getDateRange";
import { sortAccounts } from "../../../../../utils/sorts/sortAccountsReceivable";

const Container = styled.div`
    display: grid;
    height: 100vh;
    grid-template-rows: min-content min-content 1fr;
`;

const mapDataToAccounts = (data) => {
    console.log("data ",data);
    return data?.map((account) => {
        const invoiceData = account?.invoice?.data;
        const client = account?.client || {};
        const paymentMethods = invoiceData?.paymentMethod || [];

        // Calcular total pagado
        const totalPaid = paymentMethods.reduce((sum, method) => {
            return method.status ? sum + method.value : sum;
        }, 0);

        return {
            ncf: invoiceData?.NCF || "N/A",
            invoiceNumber: invoiceData?.numberID || "N/A",
            client: client?.name || "Generic Client",
            rnc: client?.personalID,
            date: account?.createdAt,
            initialAmount: account?.initialAmountAr || 0,
            lastPaymentDate: account?.lastPaymentDate, // Último pago no está en los datos iniciales
            totalPaid: totalPaid,
            balance: (account?.balance || 0) ,
            products: invoiceData?.products?.length || 0, // Total de productos
            total: invoiceData?.totalPurchase?.value || 0,
            ver: { account },
            actions: { account },
            dateGroup: account?.createdAt?.seconds
                ? DateTime.fromMillis(account.createdAt.seconds * 1000).toLocaleString(DateTime.DATE_FULL)
                : "N/A"
        };
    });
};

export const AccountReceivableList = () => {
    const user = useSelector(selectUser);
    const [datesSelected, setDatesSelected] = useState(getDateRange('today'));
    const [processedAccount, setProcessedAccount] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortCriteria, setSortCriteria] = useState('defaultCriteria');
    const [sortDirection, setSortDirection] = useState('asc');

    const accounts = useListenAccountsReceivable(user, datesSelected);

    useEffect(() => {
        const data = mapDataToAccounts(accounts);
        const sortedData = sortAccounts(data, sortCriteria, sortDirection);
        setProcessedAccount(sortedData);
    }, [accounts, sortCriteria, sortDirection]);

    // Calculate total balance
    const totalBalance = processedAccount.reduce((sum, account) => {
        return sum + (account.balance || 0);
    }, 0);

    const handleSort = (sortedAccounts) => {
        setProcessedAccount(sortedAccounts);
    };

    return (
        <Container>
            <MenuApp
                searchData={searchTerm}
                setSearchData={setSearchTerm}
            />
            <FilterAccountReceivable
                accounts={processedAccount}
                onSort={handleSort}
                datesSelected={datesSelected}
                setDatesSelected={setDatesSelected}
            />
            <AccountReceivableTable
                data={processedAccount}
                searchTerm={searchTerm}
                totalBalance={totalBalance}
            />
        </Container>
    );
};