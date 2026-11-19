import Chart from 'react-apexcharts';
import { useTema } from '../../hooks/useTema';

const Tarjeta = ({ titulo, sub, children }) => (
  <div className="ficha">
    <p className="text-sm font-bold">{titulo}</p>
    {sub && <p className="mb-2 text-t-micro text-textSecondary">{sub}</p>}
    {children}
  </div>
);

export default function ResumenGraficos({ resumen }) {
  const { oscuro } = useTema();
  const base = {
    chart: { background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit', foreColor: oscuro ? '#9A9890' : '#807F7A' },
    theme: { mode: oscuro ? 'dark' : 'light' },
    grid: { borderColor: oscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', strokeDashArray: 3 },
    tooltip: { theme: oscuro ? 'dark' : 'light' },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '12px', markers: { radius: 12 } },
  };
  const cats = resumen.dias.map((d) => d.etiqueta);
  const gastos = Object.entries(resumen.gastosPorCategoria);
  const mat = resumen.filas.filter((f) => f.activas + f.completadas > 0);
  const tick = { tickAmount: Math.min(cats.length, 10), labels: { rotate: 0 } };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Tarjeta titulo="Actividad diaria" sub="Tareas completadas y minutos de enfoque">
        <Chart
          type="line" height={250}
          series={[{ name: 'Tareas completadas', type: 'column', data: resumen.dias.map((d) => d.hechas) }, { name: 'Minutos de enfoque', type: 'line', data: resumen.dias.map((d) => d.minutos) }]}
          options={{ ...base, colors: ['#3B5BA9', '#A8732A'], stroke: { width: [0, 3], curve: 'smooth' }, plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
            xaxis: { categories: cats, ...tick },
            yaxis: [{ min: 0, forceNiceScale: true, labels: { formatter: (v) => Math.round(v) } }, { opposite: true, min: 0, labels: { formatter: (v) => Math.round(v) } }] }}
        />
      </Tarjeta>

      <Tarjeta titulo="Tareas por materia" sub="Completadas en el periodo vs. activas hoy">
        {mat.length === 0 ? <p className="py-16 text-center text-sm text-textSecondary">Aún no hay tareas asociadas a materias</p> : (
          <Chart
            type="bar" height={250}
            series={[{ name: 'Completadas', data: mat.map((f) => f.completadas) }, { name: 'Activas', data: mat.map((f) => f.activas) }]}
            options={{ ...base, colors: ['#2F7A55', '#A8732A'], plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
              xaxis: { categories: mat.map((f) => f.nombre), labels: { formatter: (v) => Math.round(v) } } }}
          />
        )}
      </Tarjeta>

      <Tarjeta titulo="Gastos por categoría" sub="En el periodo seleccionado">
        {gastos.length === 0 ? <p className="py-16 text-center text-sm text-textSecondary">Sin gastos en este periodo</p> : (
          <Chart
            type="donut" height={250} series={gastos.map(([, v]) => v)}
            options={{ ...base, labels: gastos.map(([k]) => k), stroke: { width: 0 }, colors: ['#3B5BA9', '#6B5FA8', '#A8732A', '#B04A3E', '#2F7A55', '#2E4BF0', '#3E7E7C', '#AD5A77'],
              tooltip: { ...base.tooltip, y: { formatter: (v) => `$${Math.round(v).toLocaleString('es-CO')}` } } }}
          />
        )}
      </Tarjeta>

      <Tarjeta titulo="Dinero del periodo" sub="Ingresos, gastos y ahorro">
        <Chart
          type="bar" height={250} series={[{ name: 'Monto', data: [resumen.ingresos, resumen.gastos, resumen.ahorro] }]}
          options={{ ...base, legend: { show: false }, colors: ['#2F7A55', '#B04A3E', '#2E4BF0'], plotOptions: { bar: { distributed: true, borderRadius: 6, columnWidth: '45%' } },
            xaxis: { categories: ['Ingresos', 'Gastos', 'Ahorro'] },
            yaxis: { labels: { formatter: (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v) } },
            tooltip: { ...base.tooltip, y: { formatter: (v) => `$${Math.round(v).toLocaleString('es-CO')}` } } }}
        />
      </Tarjeta>
    </div>
  );
}
