let chartsRegistered = false;

const ensureChartsRegistered = async () => {
  if (chartsRegistered) {
    return;
  }

  const {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    RadialLinearScale,
    Title,
    Tooltip,
  } = await import('chart.js');

  Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend,
    Title,
    RadialLinearScale,
  );

  chartsRegistered = true;
};

const loadReactChart = async <T extends 'Bar' | 'Doughnut' | 'Line' | 'Radar'>(
  chartName: T,
) => {
  await ensureChartsRegistered();
  const module = await import('react-chartjs-2');
  return { default: module[chartName] };
};

export const loadBarChart = () => loadReactChart('Bar');
export const loadDoughnutChart = () => loadReactChart('Doughnut');
export const loadLineChart = () => loadReactChart('Line');
export const loadRadarChart = () => loadReactChart('Radar');
