import React from 'react'
import { Bill } from '../Bill'
import { DateTime } from 'luxon';
import styled from 'styled-components';

export const Body = ({bills, tableConfig}) => {
    const billsByDate = bills.reduce((acc, { data }) => {
        const date = DateTime.fromMillis(data.date.seconds * 1000).toLocaleString(DateTime.DATE_FULL);
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(data);
        return acc;
      }, {});
  return (
    Object
    .entries(billsByDate)
    .map(([date, bills], index) => (
      <DateGroup key={index}>
        <h2>{date}</h2>
        {bills.map((bill, index) => (
          <Bill data={bill} colData={tableConfig.headers} key={index} />
        ))}
      </DateGroup>
    ))
  )
}
const DateGroup = styled.div`
  background-color: #ffffff2b;
  box-sizing: content-box;
  padding: 0 1em;
  margin-bottom: 4em;
  h2{
    margin: 1em 0 1.4em;
  }
`