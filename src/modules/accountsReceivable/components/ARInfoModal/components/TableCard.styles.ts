import styled from 'styled-components';

export const TableCard = styled.div`
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;

  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
    color: #595959;
    font-size: 13px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead tr {
    background: #fafafa;
  }

  th,
  td {
    padding: 12px 16px;
    font-size: 13px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }

  th {
    color: #8c8c8c;
    font-weight: 600;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: #fafafa;
  }

  .numeric {
    text-align: right;
  }
`;
