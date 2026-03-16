import { ShieldAlert, AlertTriangle, FolderOpen, Clock } from 'lucide-react';
import type { RiskSummary } from '@/lib/types';

interface RiskSummaryCardsProps {
  summary: RiskSummary;
}

export function RiskSummaryCards({ summary }: RiskSummaryCardsProps) {
  const cards = [
    {
      label: 'Active Risks',
      value: summary.total_active,
      icon: ShieldAlert,
      color: summary.total_active > 0 ? 'text-accent-red' : 'text-accent-teal',
      bgColor: summary.total_active > 0 ? 'bg-accent-red/10' : 'bg-accent-teal/10',
    },
    {
      label: 'Critical',
      value: summary.critical_count,
      icon: AlertTriangle,
      color: summary.critical_count > 0 ? 'text-[#FF6B6B]' : 'text-text-muted',
      bgColor: summary.critical_count > 0 ? 'bg-[#FF6B6B]/10' : 'bg-text-muted/10',
    },
    {
      label: 'Projects Affected',
      value: summary.projects_affected,
      icon: FolderOpen,
      color: 'text-accent-gold',
      bgColor: 'bg-accent-gold/10',
    },
    {
      label: 'Oldest (days)',
      value: summary.oldest_unresolved_days,
      icon: Clock,
      color: summary.oldest_unresolved_days > 7 ? 'text-accent-gold' : 'text-text-muted',
      bgColor: summary.oldest_unresolved_days > 7 ? 'bg-accent-gold/10' : 'bg-text-muted/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
              {card.label}
            </span>
            <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-mono font-bold ${card.color}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
