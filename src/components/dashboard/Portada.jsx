import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, AlertTriangle } from 'lucide-react';
import { textoDuracion } from '../../lib/agenda';
import { propsPreview } from '../../lib/preview';

// ---------------------------------------------------------------------------------------------
// Portada del Dashboard. En vez de abrir con una fila de pastillas, la página abre con una sola
// frase grande que contesta "¿y ahora qué?": lo que está pasando o lo que sigue, con el tiempo
// que falta contado en letra grande. Debajo, un riel de cifras separadas por filetes, como el
// tablero de un instrumento: nada de globitos de colores.
// ---------------------------------------------------------------------------------------------

function Cifra({ etiqueta, valor, nota, to, onClick, alerta, icono: Icono }) {
  const Elemento = to ? Link : onClick ? 'button' : 'div';
  const extra = to ? { to } : onClick ? { type: 'button', onClick } : {};
  return (
    <Elemento {...extra} className={`pt-cifra ${alerta ? 'pt-cifra--alerta' : ''} ${to || onClick ? 'pt-cifra--toca' : ''}`}>
      <span className="pt-cifra-et">{Icono && <Icono size={11} strokeWidth={2} className="mr-1 inline align-[-1px]" />}{etiqueta}</span>
      <span className="pt-cifra-v">{valor}</span>
      {nota && <span className="pt-cifra-n">{nota}</span>}
    </Elemento>
  );
}

export default function Portada({
  fecha, saludo, nombre, ahora, urgente, pendientes, vencidas, racha, nivel, puntos, onRevisar,
}) {
  // Lo que pide una decisión ya: lo vencido primero, si no, lo que vence antes.
  const vence = urgente?.due_date ? new Date(urgente.due_date) : null;
  const atrasada = vence && vence < ahora;
  const cuando = vence ? textoDuracion(Math.abs(vence - ahora)) : null;

  return (
    <header className="pt">
      <p className="rotulo">{fecha}</p>
      <h2 className="pt-saludo">{saludo}, <span>{nombre}</span>.</h2>

      {urgente ? (
        <Link to="/tareas" {...propsPreview('tarea', urgente.id)} className={`pt-foco ${atrasada ? 'pt-foco--tarde' : ''}`}>
          <span className="pt-foco-et" style={{ '--c': atrasada ? 'rgb(var(--danger))' : urgente.color || 'rgb(var(--primary))' }}>
            <i />{atrasada ? 'Lo primero de hoy' : 'Lo que sigue en tu lista'}
          </span>
          <span className="pt-foco-t">{urgente.title}</span>
          <span className="pt-foco-m">
            {vence ? (atrasada ? `se pasó hace ${cuando}` : `vence en ${cuando}`) : 'sin fecha'}
            {urgente.materia ? ` · ${urgente.materia}` : ''}
            <ArrowUpRight size={14} strokeWidth={1.8} className="pt-foco-flecha" />
          </span>
        </Link>
      ) : (
        <p className="pt-foco pt-foco--libre">
          <span className="pt-foco-et"><i />Nada pendiente</span>
          <span className="pt-foco-t">Tu lista está limpia.</span>
        </p>
      )}

      <div className="pt-riel">
        {vencidas > 0 && <Cifra etiqueta="Vencidas" valor={vencidas} nota="reprogramar" onClick={onRevisar} alerta icono={AlertTriangle} />}
        <Cifra etiqueta="Pendientes" valor={pendientes} nota="por hacer" to="/tareas" />
        <Cifra etiqueta="Racha" valor={racha} nota={racha === 1 ? 'día' : 'días'} icono={Flame} />
        <Cifra etiqueta="Nivel" valor={nivel} nota={`${puntos} pts`} to="/analitica" />
      </div>
    </header>
  );
}
