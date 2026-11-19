import { BookOpen, Briefcase, Users, Compass, CheckCircle2 } from 'lucide-react';

// ---------------------------------------------------------------------------------------------
// Un ícono por tipo de evento, compartido entre la rejilla de escritorio y la línea de tiempo
// del celular: con esto se reconoce "clase / trabajo / reunión / tarea" de un vistazo, sin
// tener que leer la etiqueta de texto cada vez.
// ---------------------------------------------------------------------------------------------
export const ICONO_TIPO = {
  clase: BookOpen,
  trabajo: Briefcase,
  reunion: Users,
  tarea: CheckCircle2,
  otro: Compass,
};
