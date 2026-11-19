import Chart from 'react-apexcharts';

export default function GastosDonutChart({ movimientos }) {
  const gastos = movimientos.filter((m) => m.type === 'gasto');
  const porCategoria = {};
  for (const g of gastos) {
    porCategoria[g.category] = (porCategoria[g.category] || 0) + Number(g.amount);
  }
  const categorias = Object.keys(porCategoria);
  const valores = Object.values(porCategoria);

  if (categorias.length === 0) {
    return <p className="py-10 text-center text-sm text-textSecondary">Aún no hay gastos registrados este periodo</p>;
  }

  const opciones = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: categorias,
    colors: ['#3B5BA9', '#6B5FA8', '#A8732A', '#B04A3E', '#2F7A55', '#2E4BF0', '#3E7E7C', '#AD5A77'],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => `$${v.toLocaleString('es-CO')}` } },
  };

  return <Chart options={opciones} series={valores} type="donut" height={280} />;
}
