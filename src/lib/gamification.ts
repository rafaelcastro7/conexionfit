import { Award, Flame, Trophy, Target, Zap, Crown, Star, Medal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
  /** progress towards earning it (0..1), only when not yet earned */
  progress?: number;
}

export interface GamificationStats {
  totalAttended: number;
  currentStreak: number; // consecutive days with attendance ending today/yesterday
  longestStreak: number;
  monthAttended: number; // attendances in current calendar month
  completionRatio: number; // attended / totalClasses
  badges: Badge[];
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export function computeGamification(
  attendance: { date: string }[],
  totalClasses: number,
): GamificationStats {
  // Normalize unique dates (YYYY-MM-DD)
  const dateSet = new Set(attendance.map((a) => a.date));
  const dates = Array.from(dateSet)
    .map((s) => new Date(s + 'T12:00:00'))
    .sort((a, b) => a.getTime() - b.getTime());

  const totalAttended = attendance.length;
  const today = new Date();

  // Current streak: count back from today/yesterday
  let currentStreak = 0;
  const lastDate = dates[dates.length - 1];
  if (lastDate) {
    const isToday = sameDay(lastDate, today);
    const isYesterday = sameDay(lastDate, addDays(today, -1));
    if (isToday || isYesterday) {
      currentStreak = 1;
      let cursor = lastDate;
      for (let i = dates.length - 2; i >= 0; i--) {
        const expected = addDays(cursor, -1);
        if (sameDay(dates[i], expected)) {
          currentStreak++;
          cursor = dates[i];
        } else {
          break;
        }
      }
    }
  }

  // Longest streak
  let longestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    if (prev && sameDay(addDays(prev, 1), d)) {
      run++;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prev = d;
  }

  // Month count
  const monthAttended = dates.filter(
    (d) => d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
  ).length;

  const completionRatio = totalClasses > 0 ? Math.min(1, totalAttended / totalClasses) : 0;

  const badges: Badge[] = [
    {
      id: 'first-step',
      label: 'Primer paso',
      description: 'Registra tu primera asistencia',
      icon: Star,
      earned: totalAttended >= 1,
      progress: Math.min(1, totalAttended / 1),
    },
    {
      id: 'consistent',
      label: 'Constante',
      description: '5 asistencias acumuladas',
      icon: Target,
      earned: totalAttended >= 5,
      progress: Math.min(1, totalAttended / 5),
    },
    {
      id: 'fire-streak',
      label: 'En racha',
      description: '3 días consecutivos',
      icon: Flame,
      earned: longestStreak >= 3,
      progress: Math.min(1, longestStreak / 3),
    },
    {
      id: 'unstoppable',
      label: 'Imparable',
      description: '7 días consecutivos',
      icon: Zap,
      earned: longestStreak >= 7,
      progress: Math.min(1, longestStreak / 7),
    },
    {
      id: 'monthly-warrior',
      label: 'Guerrero del mes',
      description: '12 asistencias en el mes',
      icon: Medal,
      earned: monthAttended >= 12,
      progress: Math.min(1, monthAttended / 12),
    },
    {
      id: 'half-way',
      label: 'A mitad de camino',
      description: '50% del paquete completado',
      icon: Award,
      earned: completionRatio >= 0.5,
      progress: completionRatio / 0.5,
    },
    {
      id: 'champion',
      label: 'Campeón',
      description: 'Paquete 100% completado',
      icon: Trophy,
      earned: completionRatio >= 1,
      progress: completionRatio,
    },
    {
      id: 'legend',
      label: 'Leyenda',
      description: '20 asistencias acumuladas',
      icon: Crown,
      earned: totalAttended >= 20,
      progress: Math.min(1, totalAttended / 20),
    },
  ];

  return {
    totalAttended,
    currentStreak,
    longestStreak,
    monthAttended,
    completionRatio,
    badges,
  };
}
