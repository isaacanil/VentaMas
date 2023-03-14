import React, { Fragment, useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement } from 'chart.js';

import { getBills } from '../../../../firebase/firebaseconfig';
import { useBillsByDay } from './countBillsByMonth';

Chart.register(CategoryScale);
Chart.register(LinearScale);
Chart.register(BarElement);
Chart.register(PointElement);


const options = {
    scales: {
        yAxes: [
            {
                ticks: {
                    beginAtZero: true
                }
            }
        ]
    }
};

const SaleBarChart = ({bills}) => {
 const [count, setCount] = useState([])
 const billsData = useBillsByDay(bills)
 
    console.log(count, billsData)
    const data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
        datasets: [
            {
                label: '# de Ventas',
                data: billsData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99 ,132 ,1)',
                    'rgba(54 ,162 ,235 ,1)',
                    'rgba(255 ,206 ,86 ,1)',
                    'rgba(75 ,192 ,192 ,1)',
                    'rgba(153 ,102 ,255 ,1)'
                ],
                borderWidth: 1
            }
        ]
    };
    return (
        <Fragment>
            <Bar data={data} options={options} />
            {/* <Line data={data} options={options} /> */}
        </Fragment >
    )

}

export default SaleBarChart;
