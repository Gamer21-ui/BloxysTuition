import {
  Award, Book, BookOpen, Brain, Briefcase, Calculator, CalendarCheck, Cpu, Crown, Flame, Footprints, Gem,
  NotebookPen, Shield, Star, Swords, Target, Timer, TrendingUp, Trophy, Zap, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  award: Award, book: Book, "book-open": BookOpen, brain: Brain, briefcase: Briefcase, calculator: Calculator,
  "calendar-check": CalendarCheck, cpu: Cpu, crown: Crown, flame: Flame, footprints: Footprints, gem: Gem,
  "notebook-pen": NotebookPen, shield: Shield, star: Star, swords: Swords, target: Target, timer: Timer,
  "trending-up": TrendingUp, trophy: Trophy, zap: Zap,
};

export function Icon({ name, className, size = 20 }: { name: string; className?: string; size?: number }) {
  const C = MAP[name] ?? Award;
  return <C className={className} size={size} aria-hidden="true" />;
}
