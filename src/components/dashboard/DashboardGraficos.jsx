import Chart from 'react-apexcharts';
import { useTema } from '../../hooks/useTema';
import { claveMesDe, fechaLocalISO } from '../../lib/dateUtils';

function Tarjeta({ titulo, sub, children }) {
  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <p className="text-sm font-bold">{titulo}</p>
      {sub && <p className="mb-2 text-[11px] text-textSecondary">{sub}</p>}
      {children}
    </div>
  );
}

const base = (oscuro) => ({
  chart: { background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit', foreColor: oscuro ? '#94A0B4' : '#6E7180', animations: { speed: 400 } },
  theme: { mode: oscuro ? 'dark' : 'light' },
  grid: { borderColor: oscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', strokeDashArray: 3 },
  tooltip: { theme: oscuro ? 'dark' : 'light' },
  dataLabels: { enabled: false },
  legend: { position: 'bottom', fontSize: '12px', markers: { radius: 12 } },
});

const cop = (v) => `$${Math.round(v).toLocaleString('es-CO')}`;

export default function DashboardGraficos({ tareas, movimientos, sesiones, dias }) {
  const { oscuro } = useTema();
  const b = base(oscuro);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // 1) Estado de tareas
  const estados = ['pendiente', 'enProgreso', 'hecha'].map((s) => tareas.filter((t) => t.status === s).length);

  // 2) Entregas por día
  const dia = (i) => { const d = new Date(hoy); d.setDate(d.getDate() + i); return d; };
  const cats = Array.from({ length: dias }, (_, i) => dia(i));
  const cuenta = (categoria) =>
    cats.map((d) => tareas.filter((t) => t.status !== 'hecha' && t.category === categoria && new Date(t.due_date).toDateString() === d.toDateString()).length);

  // 3) Finanzas: últimos 6 meses
  const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1); return d; });
  const suma = (tipo) => meses.map((m) => {
    const clave = claveMesDe(m);
    return movimientos.filter((x) => x.type === tipo && claveMesDe(x.date) === clave).reduce((s, x) => s + Number(x.amount), 0);
  });

  // 4) Enfoque
  const diasEnfoque = Array.from({ length: dias }, (_, i) => { const d = new Date(hoy); d.setDate(d.getDate() - (dias - 1 - i)); return d; });
  const minutos = diasEnfoque.map((d) => {
    const clave = fechaLocalISO(d);
    return sesiones.filter((s) => s.completada && fechaLocalISO(s.hora_inicio) === clave).reduce((a, s) => a + s.duracion_minutos, 0);
  });
  const etiqueta = (d) => `${d.getDate()}/${d.getMonth() + 1}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Tarjeta titulo="Entregas de los próximos días" sub="Tareas pendientes por día y categoría">
        <Chart
          type="bar" height={240}
          series={[{ name: 'Universidad', data: cuenta('universidad') }, { name: 'Trabajo', data: cuenta('trabajo') }]}
          options={{ ...b, colors: ['#5B8DEF', '#8B7FD1'], chart: { ...b.chart, stacked: true }, plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
            xaxis: { categories: cats.map(etiqueta), tickAmount: Math.min(dias, 10), labels: { rotate: 0 } }, yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v) => Math.round(v) } } }}
        />
      </Tarjeta>

      <Tarjeta titulo="Estado de tus tareas" sub={`${tareas.length} en total`}>
        {tareas.length === 0 ? (
          <p className="py-16 text-center text-sm text-textSecondary">Aún no hay tareas</p>
        ) : (
          <Chart
            type="donut" height={240} series={estados}
            options={{ ...b, labels: ['Por hacer', 'En progreso', 'Hechas'], colors: ['#8B93A7', '#F5A524', '#17C964'], stroke: { width: 0 },
              plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Total', color: oscuro ? '#94A0B4' : '#6E7180' } } } } } }}
          />
        )}
      </Tarjeta>

      <Tarjeta titulo="Ingresos vs gastos" sub="Últimos 6 meses">
        <Chart
          type="bar" height={240}
          series={[{ name: 'Ingresos', data: suma('ingreso') }, { name: 'Gastos', data: suma('gasto') }]}
          options={{ ...b, colors: ['#17C964', '#E5484D'], plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
            xaxis: { categories: meses.map((m) => m.toLocaleDateString('es-CO', { month: 'short' })) },
            yaxis: { labels: { formatter: (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v) } },
            tooltip: { ...b.tooltip, y: { formatter: cop } } }}
        />
      </Tarjeta>

      <Tarjeta titulo="Minutos de enfoque" sub="Sesiones Pomodoro completadas">
        <Chart
          type="area" height={240} series={[{ name: 'Minutos', data: minutos }]}
          options={{ ...b, colors: ['#6FA8DC'], stroke: { curve: 'smooth', width: 3 },
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
            xaxis: { categories: diasEnfoque.map(etiqueta), tickAmount: Math.min(dias, 10), labels: { rotate: 0 } }, yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v) => Math.round(v) } } }}
        />
      </Tarjeta>
    </div>
  );
}
