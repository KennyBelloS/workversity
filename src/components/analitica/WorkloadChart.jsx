import Chart from 'react-apexcharts';
import { CalendarClock } from 'lucide-react';

export default function WorkloadChart({ prediccion, capacidadMaximaHoras }) {
  const sinDatos = prediccion.every((d) => d.horas === 0);
  if (sinDatos) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center" style={{ height: 280 }}>
        <CalendarClock size={26} className="text-textSecondary/50" />
        <p className="max-w-xs text-sm text-textSecondary">Todavía no tienes tareas con fecha en los próximos 14 días. En cuanto agregues algunas, aquí verás cómo se reparte tu carga día a día.</p>
      </div>
    );
  }

  const categorias = prediccion.map((d) =>
    d.fecha.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
  );
  const horas = prediccion.map((d) => d.horas);
  const colores = prediccion.map((d) => (d.sobrecargado ? '#E5484D' : '#6FA8DC'));

  const opciones = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%', distributed: true } },
    colors: colores,
    legend: { show: false },
    dataLabels: { enabled: false },
    xaxis: { categories: categorias, labels: { style: { fontSize: '10px' } } },
    yaxis: { title: { text: 'Horas estimadas' } },
    annotations: {
      yaxis: [
        {
          y: capacidadMaximaHoras,
          borderColor: '#E5484D',
          label: {
            text: `Tu límite: ${capacidadMaximaHoras}h`,
            style: { color: '#fff', background: '#E5484D', fontSize: '10px' },
          },
        },
      ],
    },
    tooltip: { y: { formatter: (v) => `${v}h estimadas` } },
  };

  return <Chart options={opciones} series={[{ name: 'Horas', data: horas }]} type="bar" height={280} />;
}
