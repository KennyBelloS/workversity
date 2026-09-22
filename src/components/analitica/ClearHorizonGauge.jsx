import Chart from 'react-apexcharts';

export default function ClearHorizonGauge({ porcentaje }) {
  const color = porcentaje >= 70 ? '#17C964' : porcentaje >= 40 ? '#F5A524' : '#E5484D';

  const opciones = {
    chart: { type: 'radialBar', fontFamily: 'inherit' },
    plotOptions: {
      radialBar: {
        hollow: { size: '65%' },
        dataLabels: {
          value: { fontSize: '26px', fontWeight: 800, formatter: (v) => `${v}%` },
          name: { show: false },
        },
      },
    },
    colors: [color],
    labels: ['Despeje'],
  };

  return (
    <div className="text-center">
      <Chart options={opciones} series={[porcentaje]} type="radialBar" height={220} />
      <p className="-mt-4 text-xs font-semibold text-textSecondary">
        {porcentaje >= 70 ? 'Presión baja — vas muy bien' : porcentaje >= 40 ? 'Presión moderada' : 'Presión alta esta semana'}
      </p>
    </div>
  );
}
