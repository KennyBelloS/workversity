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
    colors: ['#5B8DEF', '#8B7FD1', '#F5A524', '#E5484D', '#17C964', '#3E7BFA', '#7FD1C3', '#E5789C'],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => `$${v.toLocaleString('es-CO')}` } },
  };

  return <Chart options={opciones} series={valores} type="donut" height={280} />;
}
