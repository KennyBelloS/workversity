import Chart from 'react-apexcharts';

export default function ConcentrationChart({ porHora }) {
  const conActividad = porHora.filter((p) => p.total > 0);

  if (conActividad.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-textSecondary">
        Usa el Pomodoro un par de días y aquí verás en qué horas te concentras mejor.
      </p>
    );
  }

  const opciones = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    colors: ['#7FD1C3'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: conActividad.map((p) => `${p.hora}:00`),
      labels: { style: { fontSize: '10px' } },
    },
    yaxis: { title: { text: 'Pomodoros completados' } },
  };

  return <Chart options={opciones} series={[{ name: 'Completados', data: conActividad.map((p) => p.completadas) }]} type="bar" height={240} />;
}
