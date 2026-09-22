import { useState } from 'react';
import { CalendarPlus, AlertTriangle } from 'lucide-react';
import { fechaLocalISO } from '../../lib/dateUtils';
import { seCruzaConAlgo } from '../../lib/espacios';

export default function SolicitarHorario({ miembros, perfiles, ocupados, onEnviar }) {
  const [titulo, setTitulo] = useState('');
  const [para, setPara] = useState('');
  const [fecha, setFecha] = useState(fechaLocalISO());
  const [horaIni, setHoraIni] = useState('18:00');
  const [horaFin, setHoraFin] = useState('19:00');
  const [nota, setNota] = useState('');

  const inicio = new Date(`${fecha}T${horaIni}:00`);
  const fin = new Date(`${fecha}T${horaFin}:00`);
  const validas = fin > inicio;
  const choques = validas ? seCruzaConAlgo(inicio, fin, ocupados) : [];

  const enviar = () => {
    if (!titulo.trim() || !validas) return;
    onEnviar({ titulo: titulo.trim(), nota: nota.trim(), para_user_id: para || null, inicio: inicio.toISOString(), fin: fin.toISOString() });
    setTitulo(''); setNota('');
  };

  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <p className="mb-3 flex items-center gap-2 text-sm font-extrabold"><CalendarPlus size={16} /> Pedir un espacio en la agenda</p>
      <div className="space-y-2.5">
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Salida al cine, Estudiar juntos…" className="w-full rounded-sm2 bg-bg px-3 py-2.5 text-sm outline-none" aria-label="Título de la solicitud" />
        <select value={para} onChange={(e) => setPara(e.target.value)} className="w-full rounded-sm2 bg-bg px-3 py-2.5 text-sm outline-none" aria-label="Para quién">
          <option value="">Para todo el espacio</option>
          {miembros.filter((m) => !m.esYo).map((m) => <option key={m.user_id} value={m.user_id}>Para {perfiles.find((p) => p.id === m.user_id)?.nombre || 'esa persona'}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="col-span-1 rounded-sm2 bg-bg px-2 py-2.5 text-sm outline-none" aria-label="Fecha" />
          <input type="time" value={horaIni} onChange={(e) => setHoraIni(e.target.value)} className="rounded-sm2 bg-bg px-2 py-2.5 text-sm outline-none" aria-label="Hora de inicio" />
          <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="rounded-sm2 bg-bg px-2 py-2.5 text-sm outline-none" aria-label="Hora de fin" />
        </div>
        {!validas && <p className="text-xs font-semibold text-danger">La hora de fin debe ser después de la de inicio.</p>}
        {choques.length > 0 && <p className="flex items-center gap-1.5 rounded-sm2 bg-warningSoft p-2 text-xs font-semibold text-warning"><AlertTriangle size={13} /> Ya hay algo agendado a esa hora: {choques[0].titulo}. Puedes enviarla igual y lo conversan.</p>}
        <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" className="w-full rounded-sm2 bg-bg px-3 py-2.5 text-sm outline-none" aria-label="Nota" />
        <button onClick={enviar} disabled={!titulo.trim() || !validas} className="w-full rounded-sm2 bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">Enviar solicitud</button>
      </div>
    </div>
  );
}
