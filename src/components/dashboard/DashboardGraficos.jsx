import Chart from 'react-apexcharts';
import { useTema } from '../../hooks/useTema';
import { claveMesDe, fechaLocalISO } from '../../lib/dateUtils';

function Tarjeta({ titulo, sub, children }) {
  return (
    <div className="ficha">
      <div className="ficha-cabecera !mb-3">
        <span className="rotulo">{titulo}</span>
        {sub && <span className="franja-acc">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

/** El acento configurado en Ajustes, para que las gráficas usen el mismo color que la app. */
function acento(porDefecto = '46 75 240') {
  if (typeof window === 'undefined') return `rgb(${porDefecto.split(' ').join(',')})`;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || porDefecto;
  return `rgb(${v.split(/\s+/).join(',')})`;
}

const base = (oscuro) => ({
  chart: { background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit', foreColor: oscuro ? '#8E8C85' : '#7E7D77', animations: { speed: 400 } },
  theme: { mode: oscuro ? 'dark' : 'light' },
  grid: { borderColor: oscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', strokeDashArray: 2, xaxis: { lines: { show: false } }, padding: { left: 4, right: 4 } },
  tooltip: { theme: oscuro ? 'dark' : 'light' },
  dataLabels: { enabled: false },
  states: { hover: { filter: { type: 'lighten', value: 0.06 } } },
  legend: { position: 'bottom', fontSize: '11.5px', itemMargin: { horizontal: 10 }, markers: { width: 7, height: 7, radius: 2, offsetX: -3 } },
  xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: '10.5px' } } },
  yaxis: { labels: { style: { fontSize: '10.5px' } } },
});

const cop = (v) => `$${Math.round(v).toLocaleString('es-CO')}`;

export default function DashboardGraficos({ tareas, movimientos, sesiones, dias }) {
  const { oscuro } = useTema();
  const b = base(oscuro);
  const A = acento();
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
          options={{ ...b, colors: [A, oscuro ? '#56544E' : '#C9C6BE'], chart: { ...b.chart, stacked: true }, plotOptions: { bar: { borderRadius: 3, columnWidth: '52%' } },
            xaxis: { ...b.xaxis, categories: cats.map(etiqueta), tickAmount: Math.min(dias, 10), labels: { ...b.xaxis.labels, rotate: 0 } }, yaxis: { ...b.yaxis, min: 0, forceNiceScale: true, labels: { ...b.yaxis.labels, formatter: (v) => Math.round(v) } } }}
        />
      </Tarjeta>

      <Tarjeta titulo="Estado de tus tareas" sub={`${tareas.length} en total`}>
        {tareas.length === 0 ? (
          <p className="py-16 text-center text-t-pie text-textSecondary">Aún no hay tareas</p>
        ) : (
          <Chart
            type="donut" height={240} series={estados}
            options={{ ...b, labels: ['Por hacer', 'En progreso', 'Hechas'], colors: [oscuro ? '#56544E' : '#C9C6BE', '#A8732A', A], stroke: { width: 0 },
              plotOptions: { pie: { donut: { size: '78%', labels: { show: true, value: { fontSize: '26px', fontWeight: 300 }, total: { show: true, label: 'Total', fontSize: '10px', color: oscuro ? '#8E8C85' : '#7E7D77' } } } } } }}
          />
        )}
      </Tarjeta>

      <Tarjeta titulo="Ingresos vs gastos" sub="Últimos 6 meses">
        <Chart
          type="bar" height={240}
          series={[{ name: 'Ingresos', data: suma('ingreso') }, { name: 'Gastos', data: suma('gasto') }]}
          options={{ ...b, colors: ['#2F7A55', '#B04A3E'], plotOptions: { bar: { borderRadius: 3, columnWidth: '48%' } },
            xaxis: { ...b.xaxis, categories: meses.map((m) => m.toLocaleDateString('es-CO', { month: 'short' })) },
            yaxis: { ...b.yaxis, labels: { ...b.yaxis.labels, formatter: (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v) } },
            tooltip: { ...b.tooltip, y: { formatter: cop } } }}
        />
      </Tarjeta>

      <Tarjeta titulo="Minutos de enfoque" sub="Sesiones Pomodoro completadas">
        <Chart
          type="area" height={240} series={[{ name: 'Minutos', data: minutos }]}
          options={{ ...b, colors: [A], stroke: { curve: 'smooth', width: 2 },
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0.02 } },
            markers: { size: 0, hover: { size: 4 } },
            xaxis: { ...b.xaxis, categories: diasEnfoque.map(etiqueta), tickAmount: Math.min(dias, 10), labels: { ...b.xaxis.labels, rotate: 0 } }, yaxis: { ...b.yaxis, min: 0, forceNiceScale: true, labels: { ...b.yaxis.labels, formatter: (v) => Math.round(v) } } }}
        />
      </Tarjeta>
    </div>
  );
}
