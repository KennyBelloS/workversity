import {
  Check, Trophy, Flame, Timer, Star, Target, Medal, Rocket, BookOpen, CalendarDays, CalendarCheck, Sparkles, GraduationCap,
  Bell, BarChart3, Wallet, Keyboard, Puzzle, PenLine, FileText, Mic, Code2, Brain, MessageCircle, Heart, Search, Wind,
  Feather, Gauge, Mountain, Zap, Sun, Moon, Coffee, Leaf, Music, Waves, CloudRain, Trees, Dumbbell, PiggyBank, Plane,
  Home, Laptop, Car, Gift, Smile, Hourglass, Award, Crown, Lightbulb, TrendingUp, Repeat, Clock, Circle,
  Orbit, Flag, Tag, Sprout, Compass, Smartphone, FolderTree, TrendingDown, Banknote, Scale, AlertTriangle, PartyPopper, CloudFog,
  Flower2, CircleDot, Handshake, Briefcase, Pin, Footprints, Wrench, Bug, Pointer,
} from 'lucide-react';

// Los emojis se veían genéricos: aquí cada uno se traduce a un icono de línea con el mismo
// significado. Los datos (logros, dificultades, sonidos…) siguen guardando su emoji como clave.
const MAPA = {
  '✅': Check, '✔️': Check, '🔟': Medal, '💪': Dumbbell, '🏆': Trophy, '⏱️': Timer, '⏱': Timer, '⏰': Clock, '🔥': Flame,
  '⭐': Star, '🌟': Star, '🎯': Target, '🥇': Medal, '🏅': Medal, '🚀': Rocket, '📚': BookOpen, '📖': BookOpen, '🗓️': CalendarDays,
  '📅': CalendarCheck, '📆': CalendarDays, '✨': Sparkles, '🎓': GraduationCap, '🔔': Bell, '📊': BarChart3, '📈': TrendingUp,
  '💰': Wallet, '💵': Wallet, '🐷': PiggyBank, '⌨️': Keyboard, '🧩': Puzzle, '✍️': PenLine, '📝': PenLine, '📄': FileText,
  '🎤': Mic, '💻': Code2, '🧠': Brain, '💬': MessageCircle, '🧡': Heart, '❤️': Heart, '🔎': Search, '🔍': Search, '🪁': Wind,
  '🪶': Feather, '🌱': Leaf, '🌿': Leaf, '🍃': Leaf, '⚡': Zap, '☀️': Sun, '🌙': Moon, '☕': Coffee, '🎵': Music, '🎧': Music,
  '🌊': Waves, '🌧️': CloudRain, '🌲': Trees, '🏔️': Mountain, '✈️': Plane, '🏠': Home, '🚗': Car, '🎁': Gift, '😊': Smile,
  '🙂': Smile, '⏳': Hourglass, '🎖️': Award, '👑': Crown, '💡': Lightbulb, '🔁': Repeat, '🐢': Gauge, '🐇': Zap, '😅': Gauge,
  '🌋': Mountain, '☄️': Orbit, '☄': Orbit, '🏁': Flag, '🏷️': Tag, '🪴': Sprout, '🧭': Compass, '📲': Smartphone, '🍅': Timer,
  '🗂️': FolderTree, '📉': TrendingDown, '💸': Banknote, '⚖️': Scale, '⚠️': AlertTriangle, '⚠': AlertTriangle, '🎉': PartyPopper,
  '🌫️': CloudFog, '🌸': Flower2, '🟤': CircleDot, '🟢': CircleDot, '🟡': CircleDot, '🔴': CircleDot, '🤝': Handshake, '💼': Briefcase,
  '📌': Pin, '🏃': Footprints, '🔧': Wrench, '🐞': Bug, '🕐': Clock, '👆': Pointer, '🏔': Mountain, '🌧': CloudRain, '⏰️': Clock,
};

export function iconoDeEmoji(e) {
  return MAPA[String(e || '').trim()] || Circle;
}

/** Icono de línea en lugar de un emoji. `e` es el emoji original (la clave). */
export default function Glifo({ e, size = 16, className = '', strokeWidth = 1.8 }) {
  const Icono = iconoDeEmoji(e);
  return <Icono size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
