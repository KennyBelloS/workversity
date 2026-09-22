import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import CalendarioModal from '../calendario/CalendarioModal';

export default function CalendarioCard() {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="rounded-md2 bg-white p-4 shadow-card">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold"><CalendarPlus size={16} /> Calendario de Google / iPhone</p>
      <p className="mb-3 text-xs text-textSecondary">Lleva tus clases, reuniones y tareas (con alarmas) a Google Calendar, Apple Calendar u Outlook.</p>
      <button onClick={() => setAbierto(true)} className="w-full rounded-sm2 border border-primary/30 py-2.5 text-sm font-bold text-primary">Abrir opciones</button>
      {abierto && <CalendarioModal onCerrar={() => setAbierto(false)} />}
    </section>
  );
}
