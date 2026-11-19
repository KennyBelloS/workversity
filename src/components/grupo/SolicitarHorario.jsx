import { useState } from 'react';
import { CalendarPlus, AlertTriangle, Users2, Coffee } from 'lucide-react';
import { fechaLocalISO } from '../../lib/dateUtils';
import { seCruzaConAlgo, nombreDeMiembro, iniciales } from '../../lib/espacios';

/**
 * Proponer algo al grupo. Dos clases de propuesta:
 *  • Reunión: se verá marcada como tal en la semana del grupo, con quién va y dónde.
 *  • Plan: un rato juntos, sin el peso de una reunión.
 * Quien la recibe la acepta o la rechaza; al aceptarla entra en la semana de todos.
 */
export default function SolicitarHorario({ miembros, perfiles, ocupados, onEnviar }) {
  const [tipo, setTipo] = useState('reunion');
  const [titulo, setTitulo] = useState('');
  const [para, setPara] = useState('');
  const [lugar, setLugar] = useState('');
  const [fecha, setFecha] = useState(fechaLocalISO());
  const [horaIni, setHoraIni] = useState('18:00');
  const [horaFin, setHoraFin] = useState('19:00');
  const [nota, setNota] = useState('');

  const inicio = new Date(`${fecha}T${horaIni}:00`);
  const fin = new Date(`${fecha}T${horaFin}:00`);
  const validas = fin > inicio;
  const choques = validas ? seCruzaConAlgo(inicio, fin, ocupados) : [];
  const otros = miembros.filter((m) => !m.esYo);
  const destino = para ? otros.filter((m) => m.user_id === para) : otros;

  const enviar = () => {
    if (!titulo.trim() || !validas) return;
    onEnviar({ tipo, titulo: titulo.trim(), nota: nota.trim(), lugar: lugar.trim(), para_user_id: para || null, inicio: inicio.toISOString(), fin: fin.toISOString() });
    setTitulo(''); setNota(''); setLugar('');
  };

  const campo = 'w-full rounded-[11px] bg-bg px-3 py-2.5 text-t-pie outline-none ring-1 ring-transparent transition focus:ring-primary/40';

  return (
    <section id="pedir-espacio" className="rounded-pieza bg-surface p-4 shadow-card sm:p-5">
      <p className="rotulo mb-3">Proponer al grupo</p>

      <div className="seg mb-3" role="tablist">
        {[['reunion', 'Reunión', Users2], ['plan', 'Plan', Coffee]].map(([v, t, Icono]) => (
          <button key={v} role="tab" aria-selected={tipo === v} onClick={() => setTipo(v)} className={`seg-op ${tipo === v ? 'activo' : ''}`}>
            <Icono size={14} strokeWidth={1.8} /> {t}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={tipo === 'reunion' ? 'Ej: Repasar el parcial de Cálculo' : 'Ej: Salida al cine'} className={campo} aria-label="Título" />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <select value={para} onChange={(e) => setPara(e.target.value)} className={campo} aria-label="Con quién">
            <option value="">Con todo el grupo</option>
            {otros.map((m) => <option key={m.user_id} value={m.user_id}>Con {nombreDeMiembro(m, perfiles)}</option>)}
          </select>
          <input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder={tipo === 'reunion' ? 'Lugar o enlace' : 'Dónde (opcional)'} className={campo} aria-label="Lugar" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} aria-label="Fecha" />
          <input type="time" value={horaIni} onChange={(e) => setHoraIni(e.target.value)} className={campo} aria-label="Hora de inicio" />
          <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className={campo} aria-label="Hora de fin" />
        </div>

        {/* Quién la va a recibir, con cara y nombre: no hay duda de a quién le llega. */}
        {destino.length > 0 && (
          <p className="flex flex-wrap items-center gap-1.5 text-t-nota text-textSecondary">
            Le llega a
            {destino.map((m) => {
              const n = nombreDeMiembro(m, perfiles);
              return (
                <span key={m.user_id} className="sg-persona">
                  <span className="sg-inicial sg-inicial--chico" style={{ '--c': m.color }}>{iniciales(n)}</span>{n}
                </span>
              );
            })}
          </p>
        )}

        {!validas && <p className="text-t-micro font-medium text-danger">La hora de fin debe ser después de la de inicio.</p>}
        {choques.length > 0 && <p className="flex items-center gap-1.5 rounded-[11px] bg-warningSoft p-2.5 text-t-micro text-warning"><AlertTriangle size={13} /> Ya hay algo a esa hora: {choques[0].titulo}. Puedes enviarla igual y lo conversan.</p>}
        <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" className={campo} aria-label="Nota" />
        <button onClick={enviar} disabled={!titulo.trim() || !validas} className="flex w-full items-center justify-center gap-2 rounded-full bg-textPrimary py-3 text-t-pie font-medium text-surface transition hover:bg-primary hover:text-white disabled:opacity-45">
          <CalendarPlus size={15} strokeWidth={1.9} /> Enviar {tipo === 'reunion' ? 'la reunión' : 'el plan'}
        </button>
      </div>
    </section>
  );
}
