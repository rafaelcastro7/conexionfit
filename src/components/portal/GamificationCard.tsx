import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Flame, Trophy, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { computeGamification } from '@/lib/gamification';

interface GamificationCardProps {
  attendance: { date: string }[];
  totalClasses: number;
}

const GamificationCard = ({ attendance, totalClasses }: GamificationCardProps) => {
  const stats = computeGamification(attendance, totalClasses);
  const earned = stats.badges.filter((b) => b.earned);
  const next = stats.badges.find((b) => !b.earned);

  return (
    <Card className="bg-card/90 backdrop-blur-md shadow-xl border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-secondary tracking-wide flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> LOGROS
          </h3>
          <span className="text-xs font-body text-muted-foreground">
            {earned.length} / {stats.badges.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-accent p-3 text-center">
            <div className="flex justify-center mb-1">
              <Flame className={cn('h-5 w-5', stats.currentStreak > 0 ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <p className="text-[9px] text-accent-foreground uppercase tracking-wider font-body">Racha</p>
            <p className="text-lg font-bold font-body text-accent-foreground">{stats.currentStreak}d</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3 text-center">
            <div className="flex justify-center mb-1">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-body">Récord</p>
            <p className="text-lg font-bold font-body">{stats.longestStreak}d</p>
          </div>
          <div className="rounded-xl bg-secondary/10 p-3 text-center">
            <div className="flex justify-center mb-1">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-body">Este mes</p>
            <p className="text-lg font-bold font-body">{stats.monthAttended}</p>
          </div>
        </div>

        {next && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <next.icon className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold font-body text-secondary truncate">
                  Siguiente: {next.label}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">{next.description}</p>
              </div>
            </div>
            <Progress value={(next.progress ?? 0) * 100} className="h-1.5" />
          </div>
        )}

        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body mb-2">
            Insignias
          </p>
          <div className="grid grid-cols-4 gap-2">
            {stats.badges.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  title={`${b.label} — ${b.description}`}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg p-2 transition-all',
                    b.earned
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-muted/40 border border-border/40 opacity-50 grayscale',
                  )}
                >
                  <Icon className={cn('h-5 w-5', b.earned ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-[9px] font-body text-center leading-tight text-secondary line-clamp-2">
                    {b.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamificationCard;
