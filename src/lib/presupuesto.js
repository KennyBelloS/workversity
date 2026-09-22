import { claveMesDe } from './dateUtils';

/** Cómo va el gasto del mes contra el presupuesto: nivel 'ok' | 'ritmo' | 'aviso' | 'excedido' (o null si no hay presupuesto). */
export function estadoPresupuesto({ ahora = new Date(), movimientos = [], presupuestos = [] }) {
  const mes = claveMesDe(ahora);
  const p = presupuestos.find((x) => x.mes === mes);
  const tope = Number(p?.amount);
  if (!p || !(tope > 0)) return null;
  const gastado = movimientos.filter((m) => m.type === 'gasto' && claveMesDe(m.date) === mes).reduce((s, m) => s + Number(m.amount), 0);
  const diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  const dia = ahora.getDate();
  const diasRestantes = diasMes - dia;
  const ritmoDiario = gastado / dia;
  const proyeccion = ritmoDiario * diasMes;
  const pct = (gastado / tope) * 100;
  let nivel = 'ok';
  if (pct >= 100) nivel = 'excedido';
  else if (pct >= 80) nivel = 'aviso';
  else if (dia >= 7 && proyeccion > tope * 1.05) nivel = 'ritmo';
  return { mes, tope, gastado, pct, restante: tope - gastado, diasRestantes, ritmoDiario, proyeccion, nivel, sugeridoPorDia: diasRestantes > 0 ? Math.max(0, (tope - gastado) / diasRestantes) : 0 };
}
