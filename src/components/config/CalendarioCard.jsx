import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import CalendarioModal from '../calendario/CalendarioModal';

export default function CalendarioCard() {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="ficha">
      <p className="ficha-cabecera !mb-3 !justify-start gap-2 rotulo"><CalendarPlus size={16} /> Calendario de Google / iPhone</p>
      <p className="mb-3 text-xs text-textSecondary">Lleva tus clases, reuniones y tareas (con alarmas) a Google Calendar, Apple Calendar u Outlook.</p>
      <button onClick={() => setAbierto(true)} className="boton-secundario w-full justify-center">Abrir opciones</button>
      {abierto && <CalendarioModal onCerrar={() => setAbierto(false)} />}
    </section>
  );
}
